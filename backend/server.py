from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx
from partners_module import router as partners_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "kandengue-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    created_at: str

class UserTier(BaseModel):
    tier: str  # normal, premium
    benefits: List[str]
    price: float

class Partner(BaseModel):
    partner_id: str
    user_id: str
    business_name: str
    business_type: str  # taxi, restaurant, tourism, real_estate
    tier: str  # basico, premium, enterprise
    status: str  # pending, active, suspended
    wallet_balance: float
    total_revenue: float
    commission_rate: float
    created_at: str

class PartnerWallet(BaseModel):
    wallet_id: str
    partner_id: str
    balance: float
    credit_limit: float
    payment_methods: List[str]

class Transaction(BaseModel):
    transaction_id: str
    partner_id: str
    type: str  # credit, debit, commission, payout
    amount: float
    description: str
    status: str
    created_at: str

class ServiceListing(BaseModel):
    listing_id: str
    partner_id: str
    service_type: str
    title: str
    description: str
    price: float
    status: str  # active, inactive, pending
    created_at: str

class AccountingRecord(BaseModel):
    record_id: str
    partner_id: str
    period: str
    total_revenue: float
    commission: float
    net_amount: float
    status: str

class SessionData(BaseModel):
    session_id: str

class RideRequest(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    provider: str

class Ride(BaseModel):
    ride_id: str
    user_id: str
    pickup_address: str
    destination_address: str
    provider: str
    price: float
    status: str
    created_at: str

class AppConnection(BaseModel):
    app_name: str
    connected: bool
    has_credentials: bool
    icon: str

class NavigationStep(BaseModel):
    instruction: str
    distance: float
    duration: float
    lat: float
    lng: float

class NavigationRoute(BaseModel):
    distance: float
    duration: int
    steps: List[NavigationStep]
    polyline: str

class Restaurant(BaseModel):
    restaurant_id: str
    name: str
    description: str
    image: str
    cuisine_type: str
    rating: float
    delivery_time: str
    delivery_fee: float

class MenuItem(BaseModel):
    item_id: str
    restaurant_id: str
    name: str
    description: str
    price: float
    image: str
    category: str

class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[OrderItem]
    delivery_address: str
    payment_method: str
    notes: Optional[str] = None

class Order(BaseModel):
    order_id: str
    user_id: str
    restaurant_id: str
    restaurant_name: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    delivery_address: str
    payment_method: str
    status: str
    notes: Optional[str] = None
    created_at: str

async def get_current_user(request: Request) -> str:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session_doc["user_id"]

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = pwd_context.hash(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hashed_password,
        "phone": user_data.phone,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "picture": None,
            "phone": user_data.phone
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user_doc = await db.users.find_one({"email": credentials.email})
    
    if not user_doc or not pwd_context.verify(credentials.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "picture": user_doc.get("picture"),
            "phone": user_doc.get("phone")
        }
    }

@api_router.post("/auth/session")
async def exchange_session(session_data: SessionData, response: Response):
    async with httpx.AsyncClient() as client:
        try:
            emergent_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id},
                timeout=10.0
            )
            
            if emergent_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = emergent_response.json()
            
        except Exception as e:
            logger.error(f"Error exchanging session: {e}")
            raise HTTPException(status_code=500, detail="Failed to authenticate with Emergent")
    
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data.get("name", existing_user["name"]),
                "picture": user_data.get("picture", existing_user.get("picture"))
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture"),
            "phone": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "picture": user_doc.get("picture"),
            "phone": user_doc.get("phone")
        }
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user_id = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture"),
        "phone": user_doc.get("phone")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


@api_router.get("/taxi/connected-apps")
async def get_connected_apps(request: Request):
    user_id = await get_current_user(request)
    
    # Simular verificação de apps instalados
    # Em ambiente mobile real, isso verificaria apps instalados no dispositivo
    apps = [
        {"app_name": "Yango", "connected": False, "has_credentials": False, "icon": "🚖", "installed": True},
        {"app_name": "Heetch", "connected": False, "has_credentials": False, "icon": "🚗", "installed": True},
        {"app_name": "Ugo", "connected": False, "has_credentials": False, "icon": "🚙", "installed": False},
        {"app_name": "Tupuca Taxi", "connected": False, "has_credentials": False, "icon": "🚕", "installed": True}
    ]
    
    # Verificar se usuário já conectou algum app
    connections = await db.app_connections.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    
    for app in apps:
        connection = next((c for c in connections if c["app_name"] == app["app_name"]), None)
        if connection:
            app["connected"] = connection.get("connected", False)
            app["has_credentials"] = connection.get("has_credentials", False)
    
    return {"apps": apps}

@api_router.post("/taxi/connect-app")
async def connect_app(request: Request, app_data: dict):
    user_id = await get_current_user(request)
    app_name = app_data.get("app_name")
    credentials = app_data.get("credentials")
    
    # Salvar conexão do app
    await db.app_connections.update_one(
        {"user_id": user_id, "app_name": app_name},
        {
            "$set": {
                "user_id": user_id,
                "app_name": app_name,
                "connected": True,
                "has_credentials": credentials is not None,
                "credentials_encrypted": credentials,  # Em produção, criptografar
                "connected_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": f"{app_name} conectado com sucesso", "connected": True}

@api_router.delete("/taxi/disconnect-app/{app_name}")
async def disconnect_app(request: Request, app_name: str):
    user_id = await get_current_user(request)
    
    await db.app_connections.delete_one({"user_id": user_id, "app_name": app_name})
    
    return {"message": f"{app_name} desconectado", "connected": False}

@api_router.get("/taxi/navigation-route")
async def get_navigation_route(
    request: Request,
    pickup_lat: float,
    pickup_lng: float,
    dest_lat: float,
    dest_lng: float
):
    await get_current_user(request)
    
    # Simular cálculo de rota (em produção, usar Google Maps API ou similar)
    import math
    
    # Calcular distância aproximada (fórmula de Haversine simplificada)
    R = 6371  # Raio da Terra em km
    lat_diff = math.radians(dest_lat - pickup_lat)
    lng_diff = math.radians(dest_lng - pickup_lng)
    a = math.sin(lat_diff/2) * math.sin(lat_diff/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    # Estimar duração (assumindo 30 km/h em média)
    duration = int((distance / 30) * 60)  # minutos
    
    # Criar pontos da rota simplificados
    steps = [
        {
            "instruction": "Siga em frente na rua atual",
            "distance": distance * 0.3,
            "duration": duration * 0.3,
            "lat": pickup_lat + (dest_lat - pickup_lat) * 0.3,
            "lng": pickup_lng + (dest_lng - pickup_lng) * 0.3
        },
        {
            "instruction": "Vire à direita",
            "distance": distance * 0.4,
            "duration": duration * 0.4,
            "lat": pickup_lat + (dest_lat - pickup_lat) * 0.6,
            "lng": pickup_lng + (dest_lng - pickup_lng) * 0.6
        },
        {
            "instruction": "Continue reto até o destino",
            "distance": distance * 0.3,
            "duration": duration * 0.3,
            "lat": dest_lat,
            "lng": dest_lng
        }
    ]
    
    # Criar polyline simples (lista de coordenadas)
    polyline = f"{pickup_lat},{pickup_lng}|{dest_lat},{dest_lng}"
    
    return {
        "distance": round(distance, 2),
        "duration": duration,
        "steps": steps,
        "polyline": polyline,
        "pickup": {"lat": pickup_lat, "lng": pickup_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng}
    }

@api_router.get("/rides/compare")
async def compare_ride_prices(request: Request, pickup_lat: float, pickup_lng: float, dest_lat: float, dest_lng: float):
    await get_current_user(request)
    
    import random
    base_price = random.uniform(800, 2000)
    
    providers = [
        {"name": "Yango", "price": round(base_price * random.uniform(0.9, 1.1), 2), "eta": f"{random.randint(3, 8)} min", "rating": 4.5},
        {"name": "Heetch", "price": round(base_price * random.uniform(0.95, 1.15), 2), "eta": f"{random.randint(4, 10)} min", "rating": 4.3},
        {"name": "Ugo", "price": round(base_price * random.uniform(0.85, 1.05), 2), "eta": f"{random.randint(5, 12)} min", "rating": 4.6},
        {"name": "Tupuca Taxi", "price": round(base_price * random.uniform(1.0, 1.2), 2), "eta": f"{random.randint(2, 6)} min", "rating": 4.7}
    ]
    
    return {"providers": sorted(providers, key=lambda x: x["price"])}

@api_router.post("/rides", response_model=Ride)
async def create_ride(request: Request, ride_data: RideRequest):
    user_id = await get_current_user(request)
    
    ride_id = f"ride_{uuid.uuid4().hex[:10]}"
    
    ride_doc = {
        "ride_id": ride_id,
        "user_id": user_id,
        "pickup_address": ride_data.pickup_address,
        "destination_address": ride_data.destination_address,
        "provider": ride_data.provider,
        "price": 0,
        "status": "solicitado",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rides.insert_one(ride_doc)
    
    return Ride(**ride_doc)

@api_router.get("/rides", response_model=List[Ride])
async def get_rides(request: Request):
    user_id = await get_current_user(request)
    
    rides = await db.rides.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return rides

@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(request: Request):
    await get_current_user(request)
    
    count = await db.restaurants.count_documents({})
    
    if count == 0:
        sample_restaurants = [
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Restaurante Ilha",
                "description": "Culinária tradicional angolana com frutos do mar",
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Angolana",
                "rating": 4.7,
                "delivery_time": "30-40 min",
                "delivery_fee": 350.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Mano Grill",
                "description": "Churrasco e carnes grelhadas",
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Churrasco",
                "rating": 4.5,
                "delivery_time": "25-35 min",
                "delivery_fee": 300.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Tupuca Express",
                "description": "Refeições rápidas e lanches",
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Fast Food",
                "rating": 4.3,
                "delivery_time": "15-25 min",
                "delivery_fee": 200.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Sabor da Terra",
                "description": "Pratos tradicionais e caseiros",
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Tradicional",
                "rating": 4.8,
                "delivery_time": "35-45 min",
                "delivery_fee": 400.0
            }
        ]
        
        await db.restaurants.insert_many(sample_restaurants)
        return sample_restaurants
    
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(100)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_restaurant_menu(request: Request, restaurant_id: str):
    await get_current_user(request)
    
    count = await db.menu_items.count_documents({"restaurant_id": restaurant_id})
    
    if count == 0:
        sample_items = [
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Muamba de Galinha",
                "description": "Frango cozido com quiabo e dendê",
                "price": 2500.0,
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Prato Principal"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Calulu",
                "description": "Peixe seco com vegetais",
                "price": 2800.0,
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Prato Principal"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Funge",
                "description": "Acompanhamento tradicional",
                "price": 500.0,
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Acompanhamentos"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Sumo Natural",
                "description": "Suco de frutas frescas",
                "price": 800.0,
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Bebidas"
            }
        ]
        
        await db.menu_items.insert_many(sample_items)
        return sample_items
    
    items = await db.menu_items.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/orders", response_model=Order)
async def create_order(request: Request, order_data: OrderCreate):
    user_id = await get_current_user(request)
    
    restaurant = await db.restaurants.find_one({"restaurant_id": order_data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    delivery_fee = restaurant["delivery_fee"]
    total = subtotal + delivery_fee
    
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    
    order_doc = {
        "order_id": order_id,
        "user_id": user_id,
        "restaurant_id": order_data.restaurant_id,
        "restaurant_name": restaurant["name"],
        "items": [item.model_dump() for item in order_data.items],
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "total": total,
        "delivery_address": order_data.delivery_address,
        "payment_method": order_data.payment_method,
        "status": "confirmado",
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    return Order(**order_doc)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(request: Request):
    user_id = await get_current_user(request)
    
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return orders

class TouristPlace(BaseModel):
    place_id: str
    name: str
    type: str
    description: str
    location: str
    price_per_night: float
    images: List[str]
    rating: float
    amenities: List[str]
    capacity: int

class BookingCreate(BaseModel):
    place_id: str
    check_in: str
    check_out: str
    guests: int
    payment_method: str
    special_requests: Optional[str] = None

class Booking(BaseModel):
    booking_id: str
    user_id: str
    place_id: str
    place_name: str
    place_type: str
    check_in: str
    check_out: str
    guests: int
    nights: int
    price_per_night: float
    total_price: float
    payment_method: str
    status: str
    special_requests: Optional[str] = None
    created_at: str

@api_router.get("/tourist-places", response_model=List[TouristPlace])
async def get_tourist_places(request: Request, type: Optional[str] = None):
    await get_current_user(request)
    
    count = await db.tourist_places.count_documents({})
    
    if count == 0:
        sample_places = [
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Hotel Epic Sana Luanda",
                "type": "hotel",
                "description": "Hotel de luxo com vista para a Baía de Luanda, piscina infinity e spa completo",
                "location": "Ilha de Luanda, Luanda",
                "price_per_night": 25000.0,
                "images": [
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.8,
                "amenities": ["Wi-Fi", "Piscina", "Spa", "Restaurante", "Bar", "Academia"],
                "capacity": 2
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Resort Kwanza Lodge",
                "type": "resort",
                "description": "Resort ecológico às margens do Rio Kwanza com safaris e atividades aquáticas",
                "location": "Rio Kwanza, Bengo",
                "price_per_night": 18000.0,
                "images": [
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.6,
                "amenities": ["Safari", "Pesca", "Piscina", "Restaurante", "Wi-Fi", "Passeios de Barco"],
                "capacity": 4
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Museu Nacional de Antropologia",
                "type": "museu",
                "description": "Acervo rico sobre a história e cultura dos povos de Angola",
                "location": "Luanda",
                "price_per_night": 500.0,
                "images": [
                    "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.4,
                "amenities": ["Guia Turístico", "Audioguia", "Café", "Loja de Souvenirs"],
                "capacity": 50
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Parque Nacional da Kissama",
                "type": "parque",
                "description": "Santuário de vida selvagem com elefantes, girafas e outras espécies africanas",
                "location": "Kissama, Bengo",
                "price_per_night": 1200.0,
                "images": [
                    "https://images.unsplash.com/photo-1516426122078-c23e76319801?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1535338623859-02b29c1686e7?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.7,
                "amenities": ["Safari Guiado", "Camping", "Observação de Animais", "Trilhas"],
                "capacity": 10
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Fortaleza de São Miguel",
                "type": "atrativo",
                "description": "Fortaleza histórica portuguesa construída em 1576, agora Museu das Forças Armadas",
                "location": "Luanda",
                "price_per_night": 300.0,
                "images": [
                    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.5,
                "amenities": ["Visita Guiada", "Museu", "Vista Panorâmica", "Fotografia"],
                "capacity": 100
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Miradouro da Lua",
                "type": "atrativo",
                "description": "Formações rochosas espetaculares que lembram a superfície lunar",
                "location": "Bengo",
                "price_per_night": 200.0,
                "images": [
                    "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.9,
                "amenities": ["Mirante", "Trilhas", "Piquenique", "Fotografia"],
                "capacity": 50
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Pousada Lua de Mel",
                "type": "hotel",
                "description": "Acomodação romântica com vista para o oceano Atlântico",
                "location": "Cabo Ledo, Bengo",
                "price_per_night": 15000.0,
                "images": [
                    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 4.7,
                "amenities": ["Praia Privada", "Restaurante", "Wi-Fi", "Spa"],
                "capacity": 2
            },
            {
                "place_id": f"place_{uuid.uuid4().hex[:8]}",
                "name": "Cataratas de Kalandula",
                "type": "atrativo",
                "description": "Uma das maiores quedas d'água de África com 105 metros de altura",
                "location": "Malanje",
                "price_per_night": 800.0,
                "images": [
                    "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "rating": 5.0,
                "amenities": ["Vista Panorâmica", "Trilhas", "Piquenique", "Guia Local"],
                "capacity": 30
            }
        ]
        
        await db.tourist_places.insert_many(sample_places)
        places = sample_places
    else:
        query = {"type": type} if type else {}
        places = await db.tourist_places.find(query, {"_id": 0}).to_list(100)
    
    return places

@api_router.get("/tourist-places/{place_id}", response_model=TouristPlace)
async def get_tourist_place(request: Request, place_id: str):
    await get_current_user(request)
    
    place = await db.tourist_places.find_one({"place_id": place_id}, {"_id": 0})
    
    if not place:
        raise HTTPException(status_code=404, detail="Local turístico não encontrado")
    
    return place

@api_router.post("/bookings", response_model=Booking)
async def create_booking(request: Request, booking_data: BookingCreate):
    user_id = await get_current_user(request)
    
    place = await db.tourist_places.find_one({"place_id": booking_data.place_id}, {"_id": 0})
    if not place:
        raise HTTPException(status_code=404, detail="Local não encontrado")
    
    from datetime import datetime
    check_in_date = datetime.fromisoformat(booking_data.check_in.replace('Z', '+00:00'))
    check_out_date = datetime.fromisoformat(booking_data.check_out.replace('Z', '+00:00'))
    nights = (check_out_date - check_in_date).days
    
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Data de check-out deve ser posterior ao check-in")
    
    total_price = place["price_per_night"] * nights
    
    booking_id = f"booking_{uuid.uuid4().hex[:10]}"
    
    booking_doc = {
        "booking_id": booking_id,
        "user_id": user_id,
        "place_id": booking_data.place_id,
        "place_name": place["name"],
        "place_type": place["type"],
        "check_in": booking_data.check_in,
        "check_out": booking_data.check_out,
        "guests": booking_data.guests,
        "nights": nights,
        "price_per_night": place["price_per_night"],
        "total_price": total_price,
        "payment_method": booking_data.payment_method,
        "status": "confirmado",
        "special_requests": booking_data.special_requests,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    return Booking(**booking_doc)

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(request: Request):
    user_id = await get_current_user(request)
    
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return bookings

class Property(BaseModel):
    property_id: str
    type: str
    transaction_type: str
    title: str
    description: str
    price: float
    location: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: float
    images: List[str]
    features: List[str]
    owner_name: str
    owner_phone: str
    status: str

class PropertyInquiryCreate(BaseModel):
    property_id: str
    message: str
    phone: str

class PropertyInquiry(BaseModel):
    inquiry_id: str
    user_id: str
    property_id: str
    property_title: str
    property_price: float
    message: str
    phone: str
    status: str
    created_at: str

@api_router.get("/properties", response_model=List[Property])
async def get_properties(request: Request, type: Optional[str] = None, transaction: Optional[str] = None):
    await get_current_user(request)
    
    count = await db.properties.count_documents({})
    
    if count == 0:
        sample_properties = [
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "apartamento",
                "transaction_type": "venda",
                "title": "Apartamento T3 Moderno na Talatona",
                "description": "Apartamento luxuoso com 3 quartos, suite, varanda ampla e vista panorâmica. Condomínio fechado com segurança 24h.",
                "price": 85000000.0,
                "location": "Talatona, Luanda",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 120.0,
                "images": [
                    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Ar Condicionado", "Varanda", "Garagem", "Piscina do Condomínio", "Segurança 24h"],
                "owner_name": "Imobiliária Premium",
                "owner_phone": "+244 923 456 789",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "casa",
                "transaction_type": "aluguel",
                "title": "Vivenda T4 com Piscina - Benfica",
                "description": "Casa espaçosa com 4 quartos, piscina privada, jardim e churrasqueira. Ideal para famílias.",
                "price": 350000.0,
                "location": "Benfica, Luanda",
                "bedrooms": 4,
                "bathrooms": 3,
                "area": 250.0,
                "images": [
                    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Piscina Privada", "Jardim", "Churrasqueira", "Garagem para 2 carros", "Portão Eletrônico"],
                "owner_name": "António Silva",
                "owner_phone": "+244 912 345 678",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "terreno",
                "transaction_type": "venda",
                "title": "Terreno 500m² - Urbanização Kikuxi",
                "description": "Lote plano murado, pronto para construção. Infraestrutura completa (água, luz, esgoto).",
                "price": 12000000.0,
                "location": "Kikuxi, Talatona",
                "bedrooms": None,
                "bathrooms": None,
                "area": 500.0,
                "images": [
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Murado", "Documentação Regular", "Água", "Luz", "Esgoto"],
                "owner_name": "Construtora Futuro",
                "owner_phone": "+244 933 222 111",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "apartamento",
                "transaction_type": "aluguel",
                "title": "Apartamento T2 Mobilado - Ilha de Luanda",
                "description": "Apartamento totalmente mobilado e equipado com vista para o mar. Inclui Internet fibra óptica.",
                "price": 180000.0,
                "location": "Ilha de Luanda",
                "bedrooms": 2,
                "bathrooms": 1,
                "area": 80.0,
                "images": [
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Mobilado", "Vista Mar", "Internet Fibra", "Ar Condicionado", "Cozinha Equipada"],
                "owner_name": "Maria Costa",
                "owner_phone": "+244 924 567 890",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "comercial",
                "transaction_type": "aluguel",
                "title": "Escritório 150m² - Centro de Luanda",
                "description": "Espaço comercial moderno em edifício corporativo. Recepção, 3 salas, copa e 2 WCs.",
                "price": 280000.0,
                "location": "Maianga, Centro de Luanda",
                "bedrooms": None,
                "bathrooms": 2,
                "area": 150.0,
                "images": [
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Ar Condicionado Central", "Internet", "Estacionamento", "Segurança", "Elevador"],
                "owner_name": "Grupo Empresarial AOA",
                "owner_phone": "+244 922 111 222",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "casa",
                "transaction_type": "venda",
                "title": "Vivenda de Luxo T5 - Luanda Sul",
                "description": "Mansão com arquitetura contemporânea, piscina infinity, cinema privado e sistema domótica completo.",
                "price": 250000000.0,
                "location": "Luanda Sul",
                "bedrooms": 5,
                "bathrooms": 5,
                "area": 450.0,
                "images": [
                    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Piscina Infinity", "Cinema Privado", "Domótica", "Garagem 4 carros", "Segurança 24h", "Gerador"],
                "owner_name": "Premium Properties",
                "owner_phone": "+244 923 999 888",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "apartamento",
                "transaction_type": "venda",
                "title": "Apartamento T1 Novo - Kilamba",
                "description": "Apartamento novo nunca habitado, com acabamentos de qualidade. Pronto a habitar.",
                "price": 28000000.0,
                "location": "Kilamba Kiaxi",
                "bedrooms": 1,
                "bathrooms": 1,
                "area": 55.0,
                "images": [
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Novo", "Elevador", "Estacionamento", "Varanda"],
                "owner_name": "Construtora Kilamba",
                "owner_phone": "+244 913 444 555",
                "status": "disponível"
            },
            {
                "property_id": f"prop_{uuid.uuid4().hex[:8]}",
                "type": "terreno",
                "transaction_type": "venda",
                "title": "Terreno 1000m² - Belas",
                "description": "Grande lote em condomínio fechado de luxo. Localização privilegiada com vista.",
                "price": 35000000.0,
                "location": "Belas",
                "bedrooms": None,
                "bathrooms": None,
                "area": 1000.0,
                "images": [
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=srgb&fm=jpg&q=85"
                ],
                "features": ["Condomínio Fechado", "Vista Panorâmica", "Infraestrutura Completa", "Segurança"],
                "owner_name": "Belas Residence",
                "owner_phone": "+244 925 666 777",
                "status": "disponível"
            }
        ]
        
        await db.properties.insert_many(sample_properties)
        properties = sample_properties
    else:
        query = {}
        if type:
            query["type"] = type
        if transaction:
            query["transaction_type"] = transaction
        properties = await db.properties.find(query, {"_id": 0}).to_list(100)
    
    return properties

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(request: Request, property_id: str):
    await get_current_user(request)
    
    property_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    
    if not property_doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    return property_doc

@api_router.post("/property-inquiries", response_model=PropertyInquiry)
async def create_property_inquiry(request: Request, inquiry_data: PropertyInquiryCreate):
    user_id = await get_current_user(request)
    
    property_doc = await db.properties.find_one({"property_id": inquiry_data.property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    inquiry_id = f"inquiry_{uuid.uuid4().hex[:10]}"
    
    inquiry_doc = {
        "inquiry_id": inquiry_id,
        "user_id": user_id,
        "property_id": inquiry_data.property_id,
        "property_title": property_doc["title"],
        "property_price": property_doc["price"],
        "message": inquiry_data.message,
        "phone": inquiry_data.phone,
        "status": "enviado",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.property_inquiries.insert_one(inquiry_doc)
    
    return PropertyInquiry(**inquiry_doc)

@api_router.get("/property-inquiries", response_model=List[PropertyInquiry])
async def get_property_inquiries(request: Request):
    user_id = await get_current_user(request)
    
    inquiries = await db.property_inquiries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return inquiries

app.include_router(api_router)
app.include_router(partners_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()