"""
Rides Module - Rotas de taxi, corridas e navegacao
Extraido de server.py para melhor organizacao
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import math
import random
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(tags=["rides"])


async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)


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


# ============ TAXI / APPS CONECTADOS ============

@router.get("/taxi/connected-apps")
async def get_connected_apps(request: Request):
    user_id = await get_current_user(request)
    db = await get_db()

    apps = [
        {"app_name": "Yango", "connected": False, "has_credentials": False, "icon": "car", "installed": True},
        {"app_name": "Heetch", "connected": False, "has_credentials": False, "icon": "car", "installed": True},
        {"app_name": "Ugo", "connected": False, "has_credentials": False, "icon": "car", "installed": False},
        {"app_name": "Tupuca Taxi", "connected": False, "has_credentials": False, "icon": "car", "installed": True}
    ]

    connections = await db.app_connections.find({"user_id": user_id}, {"_id": 0}).to_list(10)

    for app in apps:
        connection = next((c for c in connections if c["app_name"] == app["app_name"]), None)
        if connection:
            app["connected"] = connection.get("connected", False)
            app["has_credentials"] = connection.get("has_credentials", False)

    return {"apps": apps}


@router.post("/taxi/connect-app")
async def connect_app(request: Request, app_data: dict):
    user_id = await get_current_user(request)
    db = await get_db()
    app_name = app_data.get("app_name")
    credentials = app_data.get("credentials")

    await db.app_connections.update_one(
        {"user_id": user_id, "app_name": app_name},
        {
            "$set": {
                "user_id": user_id,
                "app_name": app_name,
                "connected": True,
                "has_credentials": credentials is not None,
                "credentials_encrypted": credentials,
                "connected_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )

    return {"message": f"{app_name} conectado com sucesso", "connected": True}


@router.delete("/taxi/disconnect-app/{app_name}")
async def disconnect_app(request: Request, app_name: str):
    user_id = await get_current_user(request)
    db = await get_db()

    await db.app_connections.delete_one({"user_id": user_id, "app_name": app_name})

    return {"message": f"{app_name} desconectado", "connected": False}


@router.get("/taxi/navigation-route")
async def get_navigation_route(
    request: Request,
    pickup_lat: float,
    pickup_lng: float,
    dest_lat: float,
    dest_lng: float
):
    await get_current_user(request)

    R = 6371
    lat_diff = math.radians(dest_lat - pickup_lat)
    lng_diff = math.radians(dest_lng - pickup_lng)
    a = math.sin(lat_diff / 2) * math.sin(lat_diff / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    duration = int((distance / 30) * 60)

    steps = [
        {
            "instruction": "Siga em frente na rua atual",
            "distance": distance * 0.3,
            "duration": duration * 0.3,
            "lat": pickup_lat + (dest_lat - pickup_lat) * 0.3,
            "lng": pickup_lng + (dest_lng - pickup_lng) * 0.3
        },
        {
            "instruction": "Vire a direita",
            "distance": distance * 0.4,
            "duration": duration * 0.4,
            "lat": pickup_lat + (dest_lat - pickup_lat) * 0.6,
            "lng": pickup_lng + (dest_lng - pickup_lng) * 0.6
        },
        {
            "instruction": "Continue reto ate o destino",
            "distance": distance * 0.3,
            "duration": duration * 0.3,
            "lat": dest_lat,
            "lng": dest_lng
        }
    ]

    polyline = f"{pickup_lat},{pickup_lng}|{dest_lat},{dest_lng}"

    return {
        "distance": round(distance, 2),
        "duration": duration,
        "steps": steps,
        "polyline": polyline,
        "pickup": {"lat": pickup_lat, "lng": pickup_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng}
    }


# ============ CORRIDAS ============

@router.get("/rides/compare")
async def compare_ride_prices(request: Request, pickup_lat: float, pickup_lng: float, dest_lat: float, dest_lng: float):
    await get_current_user(request)

    base_price = random.uniform(800, 2000)

    providers = [
        {"name": "Yango", "price": round(base_price * random.uniform(0.9, 1.1), 2), "eta": f"{random.randint(3, 8)} min", "rating": 4.5},
        {"name": "Heetch", "price": round(base_price * random.uniform(0.95, 1.15), 2), "eta": f"{random.randint(4, 10)} min", "rating": 4.3},
        {"name": "Ugo", "price": round(base_price * random.uniform(0.85, 1.05), 2), "eta": f"{random.randint(5, 12)} min", "rating": 4.6},
        {"name": "Tupuca Taxi", "price": round(base_price * random.uniform(1.0, 1.2), 2), "eta": f"{random.randint(2, 6)} min", "rating": 4.7}
    ]

    return {"providers": sorted(providers, key=lambda x: x["price"])}


@router.post("/rides", response_model=Ride)
async def create_ride(request: Request, ride_data: RideRequest):
    user_id = await get_current_user(request)
    db = await get_db()

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


@router.post("/rides/request")
async def request_ride(request: Request, ride_data: dict):
    """Pedido completo de corrida com estimativa de preco"""
    user_id = await get_current_user(request)
    db = await get_db()

    pickup_lat = ride_data.get("pickup_lat", -8.8383)
    pickup_lng = ride_data.get("pickup_lng", 13.2344)
    dest_lat = ride_data.get("dest_lat", -8.8500)
    dest_lng = ride_data.get("dest_lng", 13.2500)
    vehicle_type = ride_data.get("vehicle_type", "standard")

    R = 6371
    lat_diff = math.radians(dest_lat - pickup_lat)
    lng_diff = math.radians(dest_lng - pickup_lng)
    a = math.sin(lat_diff / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    duration = int((distance / 30) * 60)

    base_per_km = {"standard": 150, "comfort": 250, "premium": 400}
    price_km = base_per_km.get(vehicle_type, 150)
    estimated_price = max(500, round(distance * price_km + 300, 0))

    ride_id = f"ride_{uuid.uuid4().hex[:10]}"
    ride_doc = {
        "ride_id": ride_id,
        "user_id": user_id,
        "pickup_address": ride_data.get("pickup_address", ""),
        "destination_address": ride_data.get("destination_address", ""),
        "pickup_lat": pickup_lat, "pickup_lng": pickup_lng,
        "dest_lat": dest_lat, "dest_lng": dest_lng,
        "vehicle_type": vehicle_type,
        "provider": "TudoAqui",
        "price": estimated_price,
        "distance_km": round(distance, 2),
        "estimated_duration": duration,
        "status": "solicitado",
        "payment_method": ride_data.get("payment_method", "transferencia"),
        "payment_status": "pendente",
        "driver_name": None,
        "driver_phone": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.rides.insert_one(ride_doc)

    driver_names = ["Joao Silva", "Maria Santos", "Pedro Costa", "Ana Mendes", "Carlos Ferreira"]
    driver_phones = ["+244 923 111 222", "+244 912 333 444", "+244 924 555 666"]

    await db.rides.update_one(
        {"ride_id": ride_id},
        {"$set": {
            "status": "aceite",
            "driver_name": random.choice(driver_names),
            "driver_phone": random.choice(driver_phones),
            "accepted_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated_ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})

    return updated_ride


@router.patch("/rides/{ride_id}/status")
async def update_ride_status(request: Request, ride_id: str, status_data: dict):
    """Atualizar status da corrida"""
    user_id = await get_current_user(request)
    db = await get_db()

    new_status = status_data.get("status")
    valid = ["solicitado", "aceite", "em_andamento", "concluido", "cancelado"]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status invalido. Use: {', '.join(valid)}")

    ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida nao encontrada")

    update_data = {"status": new_status, "status_updated_at": datetime.now(timezone.utc).isoformat()}
    if new_status == "concluido":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    await db.rides.update_one({"ride_id": ride_id}, {"$set": update_data})

    return {"ride_id": ride_id, "status": new_status}


@router.get("/rides", response_model=List[Ride])
async def get_rides(request: Request):
    user_id = await get_current_user(request)
    db = await get_db()

    rides = await db.rides.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

    return rides
