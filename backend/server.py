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

app.include_router(api_router)

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