"""
Módulo de Imóveis (Mixeiro) - Rotas para propriedades e consultas
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/properties", tags=["properties"])

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

SAMPLE_PROPERTIES = [
    {
        "property_id": "prop_talatona_t3",
        "type": "apartamento", "transaction_type": "venda",
        "title": "Apartamento T3 Moderno na Talatona",
        "description": "Apartamento luxuoso com 3 quartos, suite, varanda ampla e vista panorâmica. Condomínio fechado com segurança 24h.",
        "price": 85000000.0, "location": "Talatona, Luanda",
        "bedrooms": 3, "bathrooms": 2, "area": 120.0,
        "images": ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Ar Condicionado", "Varanda", "Garagem", "Piscina do Condomínio", "Segurança 24h"],
        "owner_name": "Imobiliária Premium", "owner_phone": "+244 923 456 789", "status": "disponível"
    },
    {
        "property_id": "prop_benfica_t4",
        "type": "casa", "transaction_type": "aluguel",
        "title": "Vivenda T4 com Piscina - Benfica",
        "description": "Casa espaçosa com 4 quartos, piscina privada, jardim e churrasqueira.",
        "price": 350000.0, "location": "Benfica, Luanda",
        "bedrooms": 4, "bathrooms": 3, "area": 250.0,
        "images": ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Piscina Privada", "Jardim", "Churrasqueira", "Garagem para 2 carros", "Portão Eletrônico"],
        "owner_name": "António Silva", "owner_phone": "+244 912 345 678", "status": "disponível"
    },
    {
        "property_id": "prop_kikuxi",
        "type": "terreno", "transaction_type": "venda",
        "title": "Terreno 500m² - Urbanização Kikuxi",
        "description": "Lote plano murado, pronto para construção. Infraestrutura completa.",
        "price": 12000000.0, "location": "Kikuxi, Talatona",
        "bedrooms": None, "bathrooms": None, "area": 500.0,
        "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Murado", "Documentação Regular", "Água", "Luz", "Esgoto"],
        "owner_name": "Construtora Futuro", "owner_phone": "+244 933 222 111", "status": "disponível"
    },
    {
        "property_id": "prop_ilha_t2",
        "type": "apartamento", "transaction_type": "aluguel",
        "title": "Apartamento T2 Mobilado - Ilha de Luanda",
        "description": "Apartamento totalmente mobilado com vista para o mar. Internet fibra óptica.",
        "price": 180000.0, "location": "Ilha de Luanda",
        "bedrooms": 2, "bathrooms": 1, "area": 80.0,
        "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Mobilado", "Vista Mar", "Internet Fibra", "Ar Condicionado", "Cozinha Equipada"],
        "owner_name": "Maria Costa", "owner_phone": "+244 924 567 890", "status": "disponível"
    },
    {
        "property_id": "prop_comercial",
        "type": "comercial", "transaction_type": "aluguel",
        "title": "Escritório 150m² - Centro de Luanda",
        "description": "Espaço comercial moderno em edifício corporativo.",
        "price": 280000.0, "location": "Maianga, Centro de Luanda",
        "bedrooms": None, "bathrooms": 2, "area": 150.0,
        "images": ["https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Ar Condicionado Central", "Internet", "Estacionamento", "Segurança", "Elevador"],
        "owner_name": "Grupo Empresarial AOA", "owner_phone": "+244 922 111 222", "status": "disponível"
    },
    {
        "property_id": "prop_luxo_t5",
        "type": "casa", "transaction_type": "venda",
        "title": "Vivenda de Luxo T5 - Luanda Sul",
        "description": "Mansão com arquitetura contemporânea, piscina infinity, cinema privado.",
        "price": 250000000.0, "location": "Luanda Sul",
        "bedrooms": 5, "bathrooms": 5, "area": 450.0,
        "images": ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&q=85", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Piscina Infinity", "Cinema Privado", "Domótica", "Garagem 4 carros", "Segurança 24h", "Gerador"],
        "owner_name": "Premium Properties", "owner_phone": "+244 923 999 888", "status": "disponível"
    },
    {
        "property_id": "prop_kilamba",
        "type": "apartamento", "transaction_type": "venda",
        "title": "Apartamento T1 Novo - Kilamba",
        "description": "Apartamento novo nunca habitado, com acabamentos de qualidade.",
        "price": 28000000.0, "location": "Kilamba Kiaxi",
        "bedrooms": 1, "bathrooms": 1, "area": 55.0,
        "images": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Novo", "Elevador", "Estacionamento", "Varanda"],
        "owner_name": "Construtora Kilamba", "owner_phone": "+244 913 444 555", "status": "disponível"
    },
    {
        "property_id": "prop_belas",
        "type": "terreno", "transaction_type": "venda",
        "title": "Terreno 1000m² - Belas",
        "description": "Grande lote em condomínio fechado de luxo. Localização privilegiada.",
        "price": 35000000.0, "location": "Belas",
        "bedrooms": None, "bathrooms": None, "area": 1000.0,
        "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=srgb&fm=jpg&q=85"],
        "features": ["Condomínio Fechado", "Vista Panorâmica", "Infraestrutura Completa", "Segurança"],
        "owner_name": "Belas Residence", "owner_phone": "+244 925 666 777", "status": "disponível"
    }
]

@router.get("/")
async def get_properties(request: Request, type: Optional[str] = None, transaction: Optional[str] = None):
    await get_current_user(request)
    db = await get_db()

    count = await db.properties.count_documents({})
    if count == 0:
        await db.properties.insert_many([{**p} for p in SAMPLE_PROPERTIES])

    query = {}
    if type: query["type"] = type
    if transaction: query["transaction_type"] = transaction
    properties = await db.properties.find(query, {"_id": 0}).to_list(100)
    return properties

@router.get("/{property_id}")
async def get_property(request: Request, property_id: str):
    await get_current_user(request)
    db = await get_db()

    prop = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return prop

@router.post("/inquiries")
async def create_property_inquiry(request: Request, inquiry_data: dict):
    user_id = await get_current_user(request)
    db = await get_db()

    prop = await db.properties.find_one({"property_id": inquiry_data.get("property_id")}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    inquiry_id = f"inquiry_{uuid.uuid4().hex[:10]}"
    inquiry_doc = {
        "inquiry_id": inquiry_id,
        "user_id": user_id,
        "property_id": inquiry_data["property_id"],
        "property_title": prop["title"],
        "property_price": prop["price"],
        "message": inquiry_data.get("message", ""),
        "phone": inquiry_data.get("phone", ""),
        "status": "enviado",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.property_inquiries.insert_one(inquiry_doc)
    return {k: v for k, v in inquiry_doc.items() if k != "_id"}

@router.get("/inquiries/my")
async def get_property_inquiries(request: Request):
    user_id = await get_current_user(request)
    db = await get_db()
    inquiries = await db.property_inquiries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return inquiries
