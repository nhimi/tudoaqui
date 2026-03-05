"""
Tuendi Module - Clone do Uber para TudoAqui
Sistema completo de mobilidade urbana e entregas
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import random
import math
import os

router = APIRouter(prefix="/tuendi", tags=["Tuendi"])

async def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    """Get current user from session"""
    from server import get_current_user as base_get_user
    return await base_get_user(request)

# ==================== ENUMS ====================

class VehicleType(str, Enum):
    MOTO = "moto"
    STANDARD = "standard"
    COMFORT = "comfort"
    PREMIUM = "premium"

class RideStatus(str, Enum):
    SEARCHING = "searching"
    ACCEPTED = "accepted"
    ARRIVING = "arriving"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DeliverySize(str, Enum):
    SMALL = "small"  # Documentos, envelope
    MEDIUM = "medium"  # Pacote pequeno
    LARGE = "large"  # Pacote grande

class DriverStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class TransactionType(str, Enum):
    RIDE_PAYMENT = "ride_payment"
    DELIVERY_PAYMENT = "delivery_payment"
    CREDIT_ADD = "credit_add"
    DRIVER_EARNING = "driver_earning"
    WITHDRAWAL = "withdrawal"
    COUPON_DISCOUNT = "coupon_discount"

# ==================== MODELS ====================

class DriverRegistration(BaseModel):
    full_name: str
    phone: str
    email: str
    vehicle_type: VehicleType
    vehicle_brand: str
    vehicle_model: str
    vehicle_year: int
    vehicle_plate: str
    vehicle_color: str
    cnh_number: str
    nif: str

class DriverDocument(BaseModel):
    driver_id: str
    document_type: str  # cnh, crlv, photo, criminal_record
    document_base64: str

class RideRequest(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    dest_lat: float
    dest_lng: float
    vehicle_type: VehicleType = VehicleType.STANDARD
    payment_method: str = "wallet"  # wallet, cash, card
    coupon_code: Optional[str] = None
    notes: Optional[str] = None

class DeliveryRequest(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    dest_lat: float
    dest_lng: float
    package_size: DeliverySize = DeliverySize.SMALL
    package_description: str
    recipient_name: str
    recipient_phone: str
    payment_method: str = "wallet"
    coupon_code: Optional[str] = None

class RatingSubmit(BaseModel):
    ride_id: Optional[str] = None
    delivery_id: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    tags: List[str] = []  # "limpo", "educado", "seguro", etc.

class CouponCreate(BaseModel):
    code: str
    discount_percent: int = Field(ge=1, le=100)
    max_discount_kz: int = 5000
    min_order_kz: int = 0
    valid_until: str  # ISO date
    max_uses: int = 100
    description: str

class WalletTopUp(BaseModel):
    amount: int = Field(ge=100)
    payment_reference: str

# ==================== PRICE CALCULATION ====================

# Base prices in Kz
BASE_PRICES = {
    VehicleType.MOTO: {"base": 300, "per_km": 100, "per_min": 20},
    VehicleType.STANDARD: {"base": 500, "per_km": 150, "per_min": 30},
    VehicleType.COMFORT: {"base": 800, "per_km": 200, "per_min": 40},
    VehicleType.PREMIUM: {"base": 1500, "per_km": 350, "per_min": 60},
}

DELIVERY_PRICES = {
    DeliverySize.SMALL: {"base": 400, "per_km": 80},
    DeliverySize.MEDIUM: {"base": 600, "per_km": 120},
    DeliverySize.LARGE: {"base": 1000, "per_km": 180},
}

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    R = 6371  # Earth's radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 2)

def estimate_duration(distance_km: float, vehicle_type: VehicleType) -> int:
    """Estimate duration in minutes based on distance and vehicle type"""
    # Average speed assumptions (km/h)
    speeds = {
        VehicleType.MOTO: 35,
        VehicleType.STANDARD: 30,
        VehicleType.COMFORT: 28,
        VehicleType.PREMIUM: 25,
    }
    speed = speeds.get(vehicle_type, 30)
    duration = (distance_km / speed) * 60
    return max(5, int(duration))  # Minimum 5 minutes

def calculate_ride_price(distance_km: float, duration_min: int, vehicle_type: VehicleType) -> int:
    """Calculate ride price in Kz"""
    pricing = BASE_PRICES[vehicle_type]
    price = pricing["base"] + (distance_km * pricing["per_km"]) + (duration_min * pricing["per_min"])
    # Round to nearest 50
    return int(round(price / 50) * 50)

def calculate_delivery_price(distance_km: float, package_size: DeliverySize) -> int:
    """Calculate delivery price in Kz"""
    pricing = DELIVERY_PRICES[package_size]
    price = pricing["base"] + (distance_km * pricing["per_km"])
    return int(round(price / 50) * 50)

# ==================== SIMULATED DRIVERS ====================

SIMULATED_DRIVERS = [
    {"name": "João Silva", "phone": "+244 923 456 789", "rating": 4.9, "trips": 1523, "vehicle": "Toyota Corolla", "plate": "LD-45-78-AB"},
    {"name": "Maria Santos", "phone": "+244 912 345 678", "rating": 4.8, "trips": 892, "vehicle": "Honda Civic", "plate": "LD-23-56-CD"},
    {"name": "Pedro Fernandes", "phone": "+244 934 567 890", "rating": 4.7, "trips": 2341, "vehicle": "Hyundai Elantra", "plate": "LD-67-89-EF"},
    {"name": "Ana Costa", "phone": "+244 945 678 901", "rating": 4.9, "trips": 567, "vehicle": "Kia Cerato", "plate": "LD-12-34-GH"},
    {"name": "Carlos Mendes", "phone": "+244 956 789 012", "rating": 4.6, "trips": 3456, "vehicle": "Nissan Sentra", "plate": "LD-89-01-IJ"},
    {"name": "Bruno Teixeira", "phone": "+244 967 890 123", "rating": 4.8, "trips": 789, "vehicle": "BMW 320i", "plate": "LD-34-56-KL"},
]

MOTO_DRIVERS = [
    {"name": "Luís Gomes", "phone": "+244 923 111 222", "rating": 4.7, "trips": 2100, "vehicle": "Honda CG 150", "plate": "LD-MO-12-34"},
    {"name": "António Dias", "phone": "+244 912 222 333", "rating": 4.8, "trips": 1850, "vehicle": "Yamaha Factor", "plate": "LD-MO-56-78"},
]

def get_random_driver(vehicle_type: VehicleType):
    """Get a random driver based on vehicle type"""
    if vehicle_type == VehicleType.MOTO:
        return random.choice(MOTO_DRIVERS)
    return random.choice(SIMULATED_DRIVERS)

# ==================== API ENDPOINTS ====================

# ---------- CONFIG & INFO ----------

@router.get("/config")
async def get_tuendi_config(request: Request):
    """Get Tuendi configuration and pricing info"""
    return {
        "vehicle_types": [
            {"id": "moto", "name": "TuendiMoto", "description": "Rápido e económico", "icon": "bike", "base_price": 300},
            {"id": "standard", "name": "Tuendi", "description": "Viagem confortável", "icon": "car", "base_price": 500},
            {"id": "comfort", "name": "TuendiComfort", "description": "Mais espaço e conforto", "icon": "car-front", "base_price": 800},
            {"id": "premium", "name": "TuendiBlack", "description": "Luxo e exclusividade", "icon": "crown", "base_price": 1500},
        ],
        "delivery_sizes": [
            {"id": "small", "name": "Envelope", "description": "Documentos e pequenos itens", "max_weight": "1kg", "base_price": 400},
            {"id": "medium", "name": "Pacote Médio", "description": "Caixas pequenas", "max_weight": "5kg", "base_price": 600},
            {"id": "large", "name": "Pacote Grande", "description": "Caixas grandes", "max_weight": "15kg", "base_price": 1000},
        ],
        "payment_methods": ["wallet", "cash", "card"],
        "currency": "Kz",
        "service_fee_percent": 20,
        "min_wallet_topup": 500,
    }

# ---------- PRICE ESTIMATION ----------

@router.get("/estimate/ride")
async def estimate_ride_price(
    request: Request,
    pickup_lat: float,
    pickup_lng: float,
    dest_lat: float,
    dest_lng: float,
    vehicle_type: str = "standard"
):
    """Estimate ride price for all vehicle types"""
    distance_km = calculate_distance(pickup_lat, pickup_lng, dest_lat, dest_lng)
    
    estimates = []
    for vtype in VehicleType:
        duration = estimate_duration(distance_km, vtype)
        price = calculate_ride_price(distance_km, duration, vtype)
        eta = random.randint(3, 10)  # Simulated ETA
        
        estimates.append({
            "vehicle_type": vtype.value,
            "price": price,
            "distance_km": distance_km,
            "duration_min": duration,
            "eta_min": eta,
            "surge_multiplier": 1.0,  # Could implement surge pricing
        })
    
    return {
        "estimates": estimates,
        "selected": vehicle_type,
        "distance_km": distance_km,
    }

@router.get("/estimate/delivery")
async def estimate_delivery_price(
    request: Request,
    pickup_lat: float,
    pickup_lng: float,
    dest_lat: float,
    dest_lng: float,
):
    """Estimate delivery price for all package sizes"""
    distance_km = calculate_distance(pickup_lat, pickup_lng, dest_lat, dest_lng)
    
    estimates = []
    for size in DeliverySize:
        price = calculate_delivery_price(distance_km, size)
        eta = random.randint(20, 45)  # Simulated ETA
        
        estimates.append({
            "package_size": size.value,
            "price": price,
            "distance_km": distance_km,
            "eta_min": eta,
        })
    
    return {
        "estimates": estimates,
        "distance_km": distance_km,
    }

# ---------- RIDES ----------

@router.post("/rides")
async def request_ride(request: Request, ride_data: RideRequest):
    """Request a new ride"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    # Calculate price
    distance_km = calculate_distance(
        ride_data.pickup_lat, ride_data.pickup_lng,
        ride_data.dest_lat, ride_data.dest_lng
    )
    duration_min = estimate_duration(distance_km, ride_data.vehicle_type)
    price = calculate_ride_price(distance_km, duration_min, ride_data.vehicle_type)
    
    # Apply coupon if provided
    discount = 0
    if ride_data.coupon_code:
        coupon = await db.tuendi_coupons.find_one({
            "code": ride_data.coupon_code.upper(),
            "active": True
        })
        if coupon and coupon.get("uses_count", 0) < coupon.get("max_uses", 100):
            discount_amount = int(price * coupon["discount_percent"] / 100)
            discount = min(discount_amount, coupon.get("max_discount_kz", 5000))
            price = max(price - discount, 100)  # Minimum 100 Kz
    
    # Get random driver
    driver = get_random_driver(ride_data.vehicle_type)
    
    ride_id = f"tuendi_ride_{uuid.uuid4().hex[:10]}"
    ride_doc = {
        "ride_id": ride_id,
        "user_id": user_id,
        "type": "ride",
        "status": RideStatus.ACCEPTED.value,
        "pickup_address": ride_data.pickup_address,
        "pickup_lat": ride_data.pickup_lat,
        "pickup_lng": ride_data.pickup_lng,
        "destination_address": ride_data.destination_address,
        "dest_lat": ride_data.dest_lat,
        "dest_lng": ride_data.dest_lng,
        "vehicle_type": ride_data.vehicle_type.value,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "price": price,
        "original_price": price + discount,
        "discount": discount,
        "coupon_code": ride_data.coupon_code,
        "payment_method": ride_data.payment_method,
        "driver": driver,
        "eta_min": random.randint(3, 8),
        "notes": ride_data.notes,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    await db.tuendi_rides.insert_one(ride_doc)
    
    # Update coupon usage
    if ride_data.coupon_code and discount > 0:
        await db.tuendi_coupons.update_one(
            {"code": ride_data.coupon_code.upper()},
            {"$inc": {"uses_count": 1}}
        )
    
    ride_doc.pop("_id", None)
    return ride_doc

@router.get("/rides")
async def get_user_rides(request: Request, limit: int = 20):
    """Get user's ride history"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    rides = await db.tuendi_rides.find(
        {"user_id": user_id, "type": "ride"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"rides": rides}

@router.get("/rides/{ride_id}")
async def get_ride_details(request: Request, ride_id: str):
    """Get ride details"""
    db = await get_db()
    
    ride = await db.tuendi_rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    return ride

@router.patch("/rides/{ride_id}/status")
async def update_ride_status(request: Request, ride_id: str, data: dict):
    """Update ride status"""
    db = await get_db()
    
    new_status = data.get("status")
    if new_status not in [s.value for s in RideStatus]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if new_status == RideStatus.COMPLETED.value:
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    result = await db.tuendi_rides.update_one(
        {"ride_id": ride_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    return {"ride_id": ride_id, "status": new_status}

@router.post("/rides/{ride_id}/cancel")
async def cancel_ride(request: Request, ride_id: str, data: dict = {}):
    """Cancel a ride"""
    db = await get_db()
    
    ride = await db.tuendi_rides.find_one({"ride_id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    if ride["status"] in [RideStatus.COMPLETED.value, RideStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail="Não é possível cancelar esta corrida")
    
    cancellation_fee = 0
    if ride["status"] in [RideStatus.ARRIVING.value, RideStatus.IN_PROGRESS.value]:
        cancellation_fee = 300  # Fee for late cancellation
    
    await db.tuendi_rides.update_one(
        {"ride_id": ride_id},
        {"$set": {
            "status": RideStatus.CANCELLED.value,
            "cancellation_reason": data.get("reason", "Cancelado pelo usuário"),
            "cancellation_fee": cancellation_fee,
            "cancelled_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {
        "ride_id": ride_id,
        "status": "cancelled",
        "cancellation_fee": cancellation_fee
    }

# ---------- DELIVERIES ----------

@router.post("/deliveries")
async def request_delivery(request: Request, delivery_data: DeliveryRequest):
    """Request a new delivery"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    # Calculate price
    distance_km = calculate_distance(
        delivery_data.pickup_lat, delivery_data.pickup_lng,
        delivery_data.dest_lat, delivery_data.dest_lng
    )
    price = calculate_delivery_price(distance_km, delivery_data.package_size)
    
    # Apply coupon if provided
    discount = 0
    if delivery_data.coupon_code:
        coupon = await db.tuendi_coupons.find_one({
            "code": delivery_data.coupon_code.upper(),
            "active": True
        })
        if coupon and coupon.get("uses_count", 0) < coupon.get("max_uses", 100):
            discount_amount = int(price * coupon["discount_percent"] / 100)
            discount = min(discount_amount, coupon.get("max_discount_kz", 5000))
            price = max(price - discount, 100)
    
    # Get moto driver for deliveries
    driver = random.choice(MOTO_DRIVERS)
    
    delivery_id = f"tuendi_delivery_{uuid.uuid4().hex[:10]}"
    delivery_doc = {
        "delivery_id": delivery_id,
        "user_id": user_id,
        "type": "delivery",
        "status": RideStatus.ACCEPTED.value,
        "pickup_address": delivery_data.pickup_address,
        "pickup_lat": delivery_data.pickup_lat,
        "pickup_lng": delivery_data.pickup_lng,
        "destination_address": delivery_data.destination_address,
        "dest_lat": delivery_data.dest_lat,
        "dest_lng": delivery_data.dest_lng,
        "package_size": delivery_data.package_size.value,
        "package_description": delivery_data.package_description,
        "recipient_name": delivery_data.recipient_name,
        "recipient_phone": delivery_data.recipient_phone,
        "distance_km": distance_km,
        "price": price,
        "original_price": price + discount,
        "discount": discount,
        "coupon_code": delivery_data.coupon_code,
        "payment_method": delivery_data.payment_method,
        "driver": driver,
        "eta_min": random.randint(20, 40),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    await db.tuendi_deliveries.insert_one(delivery_doc)
    
    # Update coupon usage
    if delivery_data.coupon_code and discount > 0:
        await db.tuendi_coupons.update_one(
            {"code": delivery_data.coupon_code.upper()},
            {"$inc": {"uses_count": 1}}
        )
    
    delivery_doc.pop("_id", None)
    return delivery_doc

@router.get("/deliveries")
async def get_user_deliveries(request: Request, limit: int = 20):
    """Get user's delivery history"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    deliveries = await db.tuendi_deliveries.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"deliveries": deliveries}

@router.get("/deliveries/{delivery_id}")
async def get_delivery_details(request: Request, delivery_id: str):
    """Get delivery details"""
    db = await get_db()
    
    delivery = await db.tuendi_deliveries.find_one({"delivery_id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega não encontrada")
    
    return delivery

@router.patch("/deliveries/{delivery_id}/status")
async def update_delivery_status(request: Request, delivery_id: str, data: dict):
    """Update delivery status"""
    db = await get_db()
    
    new_status = data.get("status")
    if new_status not in [s.value for s in RideStatus]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if new_status == RideStatus.COMPLETED.value:
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    result = await db.tuendi_deliveries.update_one(
        {"delivery_id": delivery_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entrega não encontrada")
    
    return {"delivery_id": delivery_id, "status": new_status}

# ---------- DRIVERS ----------

@router.post("/drivers/register")
async def register_driver(request: Request, driver_data: DriverRegistration):
    """Register as a Tuendi driver"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    # Check if already registered
    existing = await db.tuendi_drivers.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Você já está registrado como motorista")
    
    driver_id = f"driver_{uuid.uuid4().hex[:10]}"
    driver_doc = {
        "driver_id": driver_id,
        "user_id": user_id,
        "full_name": driver_data.full_name,
        "phone": driver_data.phone,
        "email": driver_data.email,
        "vehicle_type": driver_data.vehicle_type.value,
        "vehicle_info": {
            "brand": driver_data.vehicle_brand,
            "model": driver_data.vehicle_model,
            "year": driver_data.vehicle_year,
            "plate": driver_data.vehicle_plate,
            "color": driver_data.vehicle_color,
        },
        "cnh_number": driver_data.cnh_number,
        "nif": driver_data.nif,
        "status": DriverStatus.PENDING.value,
        "documents": {},
        "rating": 5.0,
        "total_trips": 0,
        "total_earnings": 0,
        "is_online": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    await db.tuendi_drivers.insert_one(driver_doc)
    driver_doc.pop("_id", None)
    
    return driver_doc

@router.get("/drivers/me")
async def get_driver_profile(request: Request):
    """Get current user's driver profile"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    driver = await db.tuendi_drivers.find_one({"user_id": user_id}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Você não está registrado como motorista")
    
    return driver

@router.post("/drivers/documents")
async def upload_driver_document(request: Request, doc_data: DriverDocument):
    """Upload driver document"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    driver = await db.tuendi_drivers.find_one({"user_id": user_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    
    doc_field = f"documents.{doc_data.document_type}"
    await db.tuendi_drivers.update_one(
        {"user_id": user_id},
        {"$set": {
            doc_field: {
                "data": doc_data.document_base64,
                "uploaded_at": datetime.utcnow().isoformat(),
                "status": "pending"
            },
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {"message": f"Documento {doc_data.document_type} enviado com sucesso"}

@router.patch("/drivers/online")
async def toggle_driver_online(request: Request, data: dict):
    """Toggle driver online/offline status"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    is_online = data.get("is_online", False)
    
    result = await db.tuendi_drivers.update_one(
        {"user_id": user_id, "status": DriverStatus.APPROVED.value},
        {"$set": {"is_online": is_online, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Motorista não aprovado ou não encontrado")
    
    return {"is_online": is_online}

@router.get("/drivers/earnings")
async def get_driver_earnings(request: Request, period: str = "week"):
    """Get driver earnings"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    driver = await db.tuendi_drivers.find_one({"user_id": user_id}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    
    # Get earnings from wallet transactions
    transactions = await db.tuendi_wallet.find({
        "user_id": user_id,
        "type": TransactionType.DRIVER_EARNING.value
    }, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    total_earnings = sum(t.get("amount", 0) for t in transactions)
    
    return {
        "driver_id": driver["driver_id"],
        "total_earnings": driver.get("total_earnings", 0),
        "period_earnings": total_earnings,
        "total_trips": driver.get("total_trips", 0),
        "rating": driver.get("rating", 5.0),
        "recent_transactions": transactions[:10]
    }

# ---------- RATINGS ----------

@router.post("/ratings")
async def submit_rating(request: Request, rating_data: RatingSubmit):
    """Submit a rating for ride or delivery"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    rating_id = f"rating_{uuid.uuid4().hex[:10]}"
    rating_doc = {
        "rating_id": rating_id,
        "user_id": user_id,
        "ride_id": rating_data.ride_id,
        "delivery_id": rating_data.delivery_id,
        "rating": rating_data.rating,
        "comment": rating_data.comment,
        "tags": rating_data.tags,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.tuendi_ratings.insert_one(rating_doc)
    
    # Update ride/delivery with rating
    if rating_data.ride_id:
        await db.tuendi_rides.update_one(
            {"ride_id": rating_data.ride_id},
            {"$set": {"user_rating": rating_data.rating, "user_comment": rating_data.comment}}
        )
    elif rating_data.delivery_id:
        await db.tuendi_deliveries.update_one(
            {"delivery_id": rating_data.delivery_id},
            {"$set": {"user_rating": rating_data.rating, "user_comment": rating_data.comment}}
        )
    
    rating_doc.pop("_id", None)
    return rating_doc

@router.get("/ratings/driver/{driver_id}")
async def get_driver_ratings(request: Request, driver_id: str):
    """Get ratings for a driver"""
    db = await get_db()
    
    ratings = await db.tuendi_ratings.find(
        {"driver_id": driver_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    if not ratings:
        return {"ratings": [], "average": 5.0, "total": 0}
    
    avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
    
    return {
        "ratings": ratings,
        "average": round(avg_rating, 1),
        "total": len(ratings)
    }

# ---------- WALLET ----------

@router.get("/wallet")
async def get_wallet(request: Request):
    """Get user's wallet balance and recent transactions"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    # Get or create wallet
    wallet = await db.tuendi_wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        wallet = {
            "user_id": user_id,
            "balance": 0,
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.tuendi_wallets.insert_one(wallet)
        wallet.pop("_id", None)
    
    # Get recent transactions
    transactions = await db.tuendi_wallet_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "balance": wallet.get("balance", 0),
        "transactions": transactions
    }

@router.post("/wallet/topup")
async def topup_wallet(request: Request, topup_data: WalletTopUp):
    """Add credit to wallet"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    # Update wallet balance
    await db.tuendi_wallets.update_one(
        {"user_id": user_id},
        {
            "$inc": {"balance": topup_data.amount},
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        },
        upsert=True
    )
    
    # Create transaction record
    transaction_id = f"txn_{uuid.uuid4().hex[:10]}"
    transaction = {
        "transaction_id": transaction_id,
        "user_id": user_id,
        "type": TransactionType.CREDIT_ADD.value,
        "amount": topup_data.amount,
        "payment_reference": topup_data.payment_reference,
        "description": f"Carregamento de {topup_data.amount} Kz",
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.tuendi_wallet_transactions.insert_one(transaction)
    
    wallet = await db.tuendi_wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "balance": wallet.get("balance", 0),
        "transaction_id": transaction_id
    }

# ---------- COUPONS ----------

@router.post("/coupons")
async def create_coupon(request: Request, coupon_data: CouponCreate):
    """Create a new coupon (admin only)"""
    db = await get_db()
    
    # Check if coupon code already exists
    existing = await db.tuendi_coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Código de cupom já existe")
    
    coupon_doc = {
        "code": coupon_data.code.upper(),
        "discount_percent": coupon_data.discount_percent,
        "max_discount_kz": coupon_data.max_discount_kz,
        "min_order_kz": coupon_data.min_order_kz,
        "valid_until": coupon_data.valid_until,
        "max_uses": coupon_data.max_uses,
        "uses_count": 0,
        "description": coupon_data.description,
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.tuendi_coupons.insert_one(coupon_doc)
    coupon_doc.pop("_id", None)
    
    return coupon_doc

@router.get("/coupons/validate/{code}")
async def validate_coupon(request: Request, code: str):
    """Validate a coupon code"""
    db = await get_db()
    
    coupon = await db.tuendi_coupons.find_one(
        {"code": code.upper(), "active": True},
        {"_id": 0}
    )
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom não encontrado ou inativo")
    
    if coupon.get("uses_count", 0) >= coupon.get("max_uses", 100):
        raise HTTPException(status_code=400, detail="Cupom esgotado")
    
    valid_until = datetime.fromisoformat(coupon["valid_until"].replace("Z", "+00:00"))
    if datetime.utcnow() > valid_until.replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Cupom expirado")
    
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_percent": coupon["discount_percent"],
        "max_discount_kz": coupon["max_discount_kz"],
        "description": coupon["description"]
    }

@router.get("/coupons")
async def list_coupons(request: Request):
    """List available coupons"""
    db = await get_db()
    
    coupons = await db.tuendi_coupons.find(
        {"active": True},
        {"_id": 0}
    ).to_list(50)
    
    # Filter out expired and used up coupons
    valid_coupons = []
    for c in coupons:
        try:
            valid_until = datetime.fromisoformat(c["valid_until"].replace("Z", "+00:00"))
            if datetime.utcnow() <= valid_until.replace(tzinfo=None) and c.get("uses_count", 0) < c.get("max_uses", 100):
                valid_coupons.append(c)
        except:
            pass
    
    return {"coupons": valid_coupons}

# ---------- HISTORY ----------

@router.get("/history")
async def get_full_history(request: Request, limit: int = 30):
    """Get user's complete history (rides + deliveries)"""
    db = await get_db()
    user_id = await get_current_user(request)
    
    rides = await db.tuendi_rides.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    deliveries = await db.tuendi_deliveries.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Merge and sort by date
    history = rides + deliveries
    history.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"history": history[:limit]}

# ---------- NAVIGATION ----------

@router.get("/navigation")
async def get_navigation_route(
    request: Request,
    pickup_lat: float,
    pickup_lng: float,
    dest_lat: float,
    dest_lng: float
):
    """Get navigation route with turn-by-turn instructions"""
    distance_km = calculate_distance(pickup_lat, pickup_lng, dest_lat, dest_lng)
    duration_min = int((distance_km / 30) * 60)  # Assume 30 km/h average
    
    # Generate simulated route points
    num_points = max(5, int(distance_km * 2))
    route_points = []
    
    for i in range(num_points):
        ratio = i / (num_points - 1)
        lat = pickup_lat + (dest_lat - pickup_lat) * ratio
        lng = pickup_lng + (dest_lng - pickup_lng) * ratio
        route_points.append([lat, lng])
    
    # Generate turn-by-turn instructions
    streets = [
        "Avenida 4 de Fevereiro", "Rua Major Kanhangulo", "Avenida Comandante Valódia",
        "Rua Rainha Ginga", "Avenida dos Combatentes", "Rua da Missão",
        "Largo do Kinaxixi", "Marginal de Luanda", "Rua Ndunduma"
    ]
    
    instructions = [
        {"instruction": f"Siga pela {random.choice(streets)}", "distance": distance_km * 0.3},
        {"instruction": f"Vire à direita na {random.choice(streets)}", "distance": distance_km * 0.2},
        {"instruction": f"Continue em frente por {random.choice(streets)}", "distance": distance_km * 0.3},
        {"instruction": f"Vire à esquerda na {random.choice(streets)}", "distance": distance_km * 0.1},
        {"instruction": "Você chegou ao destino", "distance": distance_km * 0.1},
    ]
    
    return {
        "distance": distance_km,
        "duration": duration_min,
        "route_points": route_points,
        "steps": instructions,
        "pickup": {"lat": pickup_lat, "lng": pickup_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng}
    }

# ---------- ADMIN ENDPOINTS ----------

@router.get("/admin/drivers")
async def admin_list_drivers(request: Request, status: str = None):
    """Admin: List all drivers"""
    db = await get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    drivers = await db.tuendi_drivers.find(query, {"_id": 0}).to_list(100)
    return {"drivers": drivers}

@router.patch("/admin/drivers/{driver_id}/status")
async def admin_update_driver_status(request: Request, driver_id: str, data: dict):
    """Admin: Update driver status (approve/reject/suspend)"""
    db = await get_db()
    
    new_status = data.get("status")
    if new_status not in [s.value for s in DriverStatus]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    result = await db.tuendi_drivers.update_one(
        {"driver_id": driver_id},
        {"$set": {
            "status": new_status,
            "status_reason": data.get("reason", ""),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    
    return {"driver_id": driver_id, "status": new_status}

@router.get("/admin/stats")
async def admin_get_stats(request: Request):
    """Admin: Get Tuendi statistics"""
    db = await get_db()
    
    total_rides = await db.tuendi_rides.count_documents({})
    total_deliveries = await db.tuendi_deliveries.count_documents({})
    total_drivers = await db.tuendi_drivers.count_documents({})
    approved_drivers = await db.tuendi_drivers.count_documents({"status": "approved"})
    
    # Revenue calculation (simulated)
    rides = await db.tuendi_rides.find({"status": "completed"}, {"price": 1}).to_list(1000)
    deliveries = await db.tuendi_deliveries.find({"status": "completed"}, {"price": 1}).to_list(1000)
    
    total_revenue = sum(r.get("price", 0) for r in rides) + sum(d.get("price", 0) for d in deliveries)
    
    return {
        "total_rides": total_rides,
        "total_deliveries": total_deliveries,
        "total_orders": total_rides + total_deliveries,
        "total_drivers": total_drivers,
        "approved_drivers": approved_drivers,
        "pending_drivers": total_drivers - approved_drivers,
        "total_revenue": total_revenue,
        "platform_fee": int(total_revenue * 0.2),  # 20% platform fee
    }
