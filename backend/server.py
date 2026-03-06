from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from partners_module import router as partners_router
from accounting_module import router as accounting_router
from payments_module import router as payments_router
from tourism_router import router as tourism_router
from properties_router import router as properties_router
from admin_module import router as admin_router
from notifications_module import router as notifications_router
from referral_module import router as referral_router
from tuendi_module import router as tuendi_router
from auth_module import router as auth_router
from wallet_module import router as wallet_router
from coupon_module import router as coupon_router
from streak_module import router as streak_router
from reports_module import router as reports_router
from pitch_module import router as pitch_router
from rides_module import router as rides_router
from restaurants_module import router as restaurants_router
from fiscal_compliance import (
    calculate_iva, calculate_commission_with_taxes,
    calculate_retencao_na_fonte, calculate_imposto_industrial,
    validate_nif, FISCAL_COMPLIANCE_RULES, IVA_RATES
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
app.state.db = db
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tudoaqui-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def get_current_user(request: Request) -> str:
    # Try JWT access_token first (primary auth system)
    access_token = request.cookies.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]
    
    if access_token:
        try:
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                return user_id
        except JWTError:
            pass
    
    # Fallback to session_token (legacy/Google OAuth sessions)
    session_token = request.cookies.get("session_token")
    if session_token:
        session_doc = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        if session_doc:
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at >= datetime.now(timezone.utc):
                return session_doc["user_id"]
            else:
                await db.user_sessions.delete_one({"session_token": session_token})
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# Auth routes handled by auth_module.py (register, login, session, me, logout, profile, etc.)


# ============ BACKWARD COMPAT ROUTES ============
# Keep old /api/tourist-places, /api/bookings, /api/properties, /api/property-inquiries
# Frontend still calls these paths

@api_router.get("/tourist-places")
async def get_tourist_places_compat(request: Request, type: Optional[str] = None):
    await get_current_user(request)
    count = await db.tourist_places.count_documents({})
    if count == 0:
        from tourism_router import SAMPLE_PLACES
        await db.tourist_places.insert_many([{**p} for p in SAMPLE_PLACES])
    query = {"type": type} if type else {}
    return await db.tourist_places.find(query, {"_id": 0}).to_list(100)

@api_router.get("/tourist-places/{place_id}")
async def get_tourist_place_compat(request: Request, place_id: str):
    await get_current_user(request)
    place = await db.tourist_places.find_one({"place_id": place_id}, {"_id": 0})
    if not place:
        raise HTTPException(status_code=404, detail="Local turístico não encontrado")
    return place

@api_router.post("/bookings")
async def create_booking_compat(request: Request, booking_data: dict):
    user_id = await get_current_user(request)
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
        "booking_id": booking_id, "user_id": user_id,
        "place_id": booking_data["place_id"], "place_name": place["name"],
        "place_type": place["type"], "check_in": booking_data["check_in"],
        "check_out": booking_data["check_out"], "guests": booking_data.get("guests", 1),
        "nights": nights, "price_per_night": place["price_per_night"],
        "total_price": total_price, "payment_method": booking_data.get("payment_method", "transferencia"),
        "status": "pendente_pagamento", "payment_status": "pendente",
        "special_requests": booking_data.get("special_requests"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    return {k: v for k, v in booking_doc.items() if k != "_id"}

@api_router.get("/bookings")
async def get_bookings_compat(request: Request):
    user_id = await get_current_user(request)
    return await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/properties")
async def get_properties_compat(request: Request, type: Optional[str] = None, transaction: Optional[str] = None):
    await get_current_user(request)
    count = await db.properties.count_documents({})
    if count == 0:
        from properties_router import SAMPLE_PROPERTIES
        await db.properties.insert_many([{**p} for p in SAMPLE_PROPERTIES])
    query = {}
    if type: query["type"] = type
    if transaction: query["transaction_type"] = transaction
    return await db.properties.find(query, {"_id": 0}).to_list(100)

@api_router.get("/properties/{property_id}")
async def get_property_compat(request: Request, property_id: str):
    await get_current_user(request)
    prop = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return prop

@api_router.post("/property-inquiries")
async def create_inquiry_compat(request: Request, inquiry_data: dict):
    user_id = await get_current_user(request)
    prop = await db.properties.find_one({"property_id": inquiry_data.get("property_id")}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    inquiry_id = f"inquiry_{uuid.uuid4().hex[:10]}"
    inquiry_doc = {
        "inquiry_id": inquiry_id, "user_id": user_id,
        "property_id": inquiry_data["property_id"], "property_title": prop["title"],
        "property_price": prop["price"], "message": inquiry_data.get("message", ""),
        "phone": inquiry_data.get("phone", ""), "status": "enviado",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.property_inquiries.insert_one(inquiry_doc)
    return {k: v for k, v in inquiry_doc.items() if k != "_id"}

@api_router.get("/property-inquiries")
async def get_inquiries_compat(request: Request):
    user_id = await get_current_user(request)
    return await db.property_inquiries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/fiscal/iva-calculate")
async def fiscal_iva_calculate(request: Request, amount: float, rate_type: str = "normal"):
    """Calcular IVA sobre um valor"""
    await get_current_user(request)
    return calculate_iva(amount, rate_type)

@api_router.get("/fiscal/commission-calculate")
async def fiscal_commission_calculate(
    request: Request, amount: float, commission_rate: float = 0.10,
    include_iva: bool = True, apply_retencao: bool = True
):
    """Calcular comissão com impostos"""
    await get_current_user(request)
    return calculate_commission_with_taxes(amount, commission_rate, include_iva, apply_retencao)

@api_router.get("/fiscal/rules")
async def fiscal_rules(request: Request):
    """Obter regras fiscais angolanas"""
    await get_current_user(request)
    return {
        "rules": FISCAL_COMPLIANCE_RULES,
        "iva_rates": IVA_RATES
    }

@api_router.post("/fiscal/validate-nif")
async def fiscal_validate_nif(request: Request, data: dict):
    """Validar NIF angolano"""
    await get_current_user(request)
    nif = data.get("nif", "")
    is_valid = validate_nif(nif)
    return {"nif": nif, "is_valid": is_valid}

@api_router.get("/user/tier")
async def get_user_tier(request: Request):
    """Obter tier do utilizador atual"""
    user_id = await get_current_user(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    current_tier = user.get("user_tier", "normal")
    return {
        "user_id": user_id,
        "current_tier": current_tier,
        "name": user.get("name", ""),
        "email": user.get("email", "")
    }

@api_router.get("/settings/iva")
async def get_public_iva_settings(request: Request):
    """Obter configurações de IVA (público para checkout)"""
    await get_current_user(request)
    config = await db.system_config.find_one({"config_id": "main"}, {"_id": 0})
    iva = config.get("iva_settings", {"enabled": False, "rate": 14.0}) if config else {"enabled": False, "rate": 14.0}
    return iva

app.include_router(api_router)
app.include_router(partners_router, prefix="/api")
app.include_router(accounting_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(tourism_router, prefix="/api")
app.include_router(properties_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(referral_router, prefix="/api")
app.include_router(tuendi_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(wallet_router, prefix="/api")
app.include_router(coupon_router, prefix="/api")
app.include_router(streak_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(pitch_router, prefix="/api")
app.include_router(rides_router, prefix="/api")
app.include_router(restaurants_router, prefix="/api")

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