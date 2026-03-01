"""
Módulo de Turismo - Rotas para locais turísticos e reservas
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/tourism", tags=["tourism"])

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

SAMPLE_PLACES = [
    {
        "place_id": "place_epic_sana",
        "name": "Hotel Epic Sana Luanda",
        "type": "hotel",
        "description": "Hotel de luxo com vista para a Baía de Luanda, piscina infinity e spa completo",
        "location": "Ilha de Luanda, Luanda",
        "price_per_night": 25000.0,
        "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.8,
        "amenities": ["Wi-Fi", "Piscina", "Spa", "Restaurante", "Bar", "Academia"],
        "capacity": 2
    },
    {
        "place_id": "place_kwanza",
        "name": "Resort Kwanza Lodge",
        "type": "resort",
        "description": "Resort ecológico às margens do Rio Kwanza com safaris e atividades aquáticas",
        "location": "Rio Kwanza, Bengo",
        "price_per_night": 18000.0,
        "images": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.6,
        "amenities": ["Safari", "Pesca", "Piscina", "Restaurante", "Wi-Fi", "Passeios de Barco"],
        "capacity": 4
    },
    {
        "place_id": "place_museu",
        "name": "Museu Nacional de Antropologia",
        "type": "museu",
        "description": "Acervo rico sobre a história e cultura dos povos de Angola",
        "location": "Luanda",
        "price_per_night": 500.0,
        "images": ["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.4,
        "amenities": ["Guia Turístico", "Audioguia", "Café", "Loja de Souvenirs"],
        "capacity": 50
    },
    {
        "place_id": "place_kissama",
        "name": "Parque Nacional da Kissama",
        "type": "parque",
        "description": "Santuário de vida selvagem com elefantes, girafas e outras espécies africanas",
        "location": "Kissama, Bengo",
        "price_per_night": 1200.0,
        "images": ["https://images.unsplash.com/photo-1516426122078-c23e76319801?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1535338623859-02b29c1686e7?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.7,
        "amenities": ["Safari Guiado", "Camping", "Observação de Animais", "Trilhas"],
        "capacity": 10
    },
    {
        "place_id": "place_fortaleza",
        "name": "Fortaleza de São Miguel",
        "type": "atrativo",
        "description": "Fortaleza histórica portuguesa construída em 1576, agora Museu das Forças Armadas",
        "location": "Luanda",
        "price_per_night": 300.0,
        "images": ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.5,
        "amenities": ["Visita Guiada", "Museu", "Vista Panorâmica", "Fotografia"],
        "capacity": 100
    },
    {
        "place_id": "place_miradouro",
        "name": "Miradouro da Lua",
        "type": "atrativo",
        "description": "Formações rochosas espetaculares que lembram a superfície lunar",
        "location": "Bengo",
        "price_per_night": 200.0,
        "images": ["https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.9,
        "amenities": ["Mirante", "Trilhas", "Piquenique", "Fotografia"],
        "capacity": 50
    },
    {
        "place_id": "place_pousada",
        "name": "Pousada Lua de Mel",
        "type": "hotel",
        "description": "Acomodação romântica com vista para o oceano Atlântico",
        "location": "Cabo Ledo, Bengo",
        "price_per_night": 15000.0,
        "images": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 4.7,
        "amenities": ["Praia Privada", "Restaurante", "Wi-Fi", "Spa"],
        "capacity": 2
    },
    {
        "place_id": "place_kalandula",
        "name": "Cataratas de Kalandula",
        "type": "atrativo",
        "description": "Uma das maiores quedas d'água de África com 105 metros de altura",
        "location": "Malanje",
        "price_per_night": 800.0,
        "images": ["https://images.unsplash.com/photo-1503614472-8c93d56e92ce?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "rating": 5.0,
        "amenities": ["Vista Panorâmica", "Trilhas", "Piquenique", "Guia Local"],
        "capacity": 30
    }
]

@router.get("/places")
async def get_tourist_places(request: Request, type: Optional[str] = None):
    await get_current_user(request)
    db = await get_db()

    count = await db.tourist_places.count_documents({})
    if count == 0:
        await db.tourist_places.insert_many([{**p} for p in SAMPLE_PLACES])

    query = {"type": type} if type else {}
    places = await db.tourist_places.find(query, {"_id": 0}).to_list(100)
    return places

@router.get("/places/{place_id}")
async def get_tourist_place(request: Request, place_id: str):
    await get_current_user(request)
    db = await get_db()

    place = await db.tourist_places.find_one({"place_id": place_id}, {"_id": 0})
    if not place:
        raise HTTPException(status_code=404, detail="Local turístico não encontrado")
    return place

@router.post("/bookings")
async def create_booking(request: Request, booking_data: dict):
    user_id = await get_current_user(request)
    db = await get_db()

    place = await db.tourist_places.find_one({"place_id": booking_data.get("place_id")}, {"_id": 0})
    if not place:
        raise HTTPException(status_code=404, detail="Local não encontrado")

    check_in_date = datetime.fromisoformat(booking_data["check_in"].replace('Z', '+00:00'))
    check_out_date = datetime.fromisoformat(booking_data["check_out"].replace('Z', '+00:00'))
    nights = (check_out_date - check_in_date).days

    if nights <= 0:
        raise HTTPException(status_code=400, detail="Data de check-out deve ser posterior ao check-in")

    total_price = place["price_per_night"] * nights
    booking_id = f"booking_{uuid.uuid4().hex[:10]}"

    booking_doc = {
        "booking_id": booking_id,
        "user_id": user_id,
        "place_id": booking_data["place_id"],
        "place_name": place["name"],
        "place_type": place["type"],
        "check_in": booking_data["check_in"],
        "check_out": booking_data["check_out"],
        "guests": booking_data.get("guests", 1),
        "nights": nights,
        "price_per_night": place["price_per_night"],
        "total_price": total_price,
        "payment_method": booking_data.get("payment_method", "transferencia"),
        "status": "pendente_pagamento",
        "payment_status": "pendente",
        "special_requests": booking_data.get("special_requests"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.bookings.insert_one(booking_doc)
    return {k: v for k, v in booking_doc.items() if k != "_id"}

@router.get("/bookings")
async def get_bookings(request: Request):
    user_id = await get_current_user(request)
    db = await get_db()
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return bookings
