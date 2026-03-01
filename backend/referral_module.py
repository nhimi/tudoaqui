"""
Sistema de Referral - Códigos de convite com recompensas
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
import random
import string

router = APIRouter(prefix="/referral", tags=["referral"])

REWARDS = {
    "referrer": {"type": "discount", "amount": 500, "description": "500 Kz desconto na próxima corrida"},
    "referred": {"type": "percentage", "amount": 20, "description": "20% desconto no primeiro pedido"}
}

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

def generate_referral_code():
    return "TUDO" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.get("/my-code")
async def get_my_referral_code(request: Request):
    """Obter ou criar código de referral do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    referral_code = user.get("referral_code")
    if not referral_code:
        referral_code = generate_referral_code()
        # Ensure uniqueness
        while await db.users.find_one({"referral_code": referral_code}):
            referral_code = generate_referral_code()
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"referral_code": referral_code}}
        )
    
    # Get stats
    total_referrals = await db.referrals.count_documents({"referrer_id": user_id})
    successful_referrals = await db.referrals.count_documents({"referrer_id": user_id, "status": "completed"})
    total_earned = successful_referrals * REWARDS["referrer"]["amount"]
    
    return {
        "referral_code": referral_code,
        "rewards": REWARDS,
        "stats": {
            "total_referrals": total_referrals,
            "successful": successful_referrals,
            "total_earned": total_earned
        },
        "share_message": f"Junta-te ao TudoAqui! Usa o meu código {referral_code} e recebe 20% desconto no teu primeiro pedido. Descarrega já: https://tudoaqui.ao"
    }

@router.post("/apply")
async def apply_referral_code(request: Request, code_data: dict):
    """Aplicar código de referral (para novos utilizadores)"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    code = code_data.get("code", "").upper().strip()
    if not code:
        raise HTTPException(status_code=400, detail="Código obrigatório")
    
    # Check if user already used a referral
    existing = await db.referrals.find_one({"referred_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Já utilizou um código de referral")
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Código de referral inválido")
    
    if referrer["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Não pode usar o próprio código")
    
    referral_id = f"ref_{uuid.uuid4().hex[:10]}"
    referral_doc = {
        "referral_id": referral_id,
        "referrer_id": referrer["user_id"],
        "referrer_name": referrer.get("name", ""),
        "referred_id": user_id,
        "code": code,
        "status": "completed",
        "referrer_reward": REWARDS["referrer"],
        "referred_reward": REWARDS["referred"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.referrals.insert_one(referral_doc)
    
    # Apply rewards
    # Referred user gets discount coupon
    coupon_id = f"coupon_{uuid.uuid4().hex[:8]}"
    await db.coupons.insert_one({
        "coupon_id": coupon_id,
        "user_id": user_id,
        "type": "percentage",
        "amount": REWARDS["referred"]["amount"],
        "description": REWARDS["referred"]["description"],
        "source": "referral",
        "referral_id": referral_id,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Referrer gets discount coupon
    referrer_coupon_id = f"coupon_{uuid.uuid4().hex[:8]}"
    await db.coupons.insert_one({
        "coupon_id": referrer_coupon_id,
        "user_id": referrer["user_id"],
        "type": "discount",
        "amount": REWARDS["referrer"]["amount"],
        "description": REWARDS["referrer"]["description"],
        "source": "referral",
        "referral_id": referral_id,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify referrer
    from notifications_module import create_notification
    await create_notification(
        referrer["user_id"],
        "Novo referral!",
        f"Alguém usou o seu código! Ganhou {REWARDS['referrer']['description']}",
        "promotion",
        referral_id
    )
    
    return {
        "referral_id": referral_id,
        "message": f"Código aplicado! Recebeu {REWARDS['referred']['description']}",
        "coupon_id": coupon_id,
        "reward": REWARDS["referred"]
    }

@router.get("/my-referrals")
async def get_my_referrals(request: Request):
    """Listar referrals feitos pelo utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    referrals = await db.referrals.find({"referrer_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"referrals": referrals}

@router.get("/my-coupons")
async def get_my_coupons(request: Request, unused_only: bool = True):
    """Listar cupões do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    query = {"user_id": user_id}
    if unused_only:
        query["used"] = False
    
    coupons = await db.coupons.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"coupons": coupons}
