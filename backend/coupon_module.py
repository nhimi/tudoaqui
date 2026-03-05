"""
Sistema Avançado de Cupons - TudoAqui
Cupons universais para todos os módulos (Tuendi, Restaurantes, etc.)
Tipos: percentual, valor fixo, entrega grátis
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/coupons", tags=["coupons"])

class CouponCreate(BaseModel):
    code: str = Field(min_length=3, max_length=20)
    type: str = Field(default="percent")  # percent, fixed, free_delivery
    value: float = Field(gt=0)  # percent (0-100) or fixed amount in Kz
    max_discount_kz: Optional[float] = 5000
    min_order_kz: Optional[float] = 0
    max_uses: int = Field(default=100, gt=0)
    max_uses_per_user: int = Field(default=1, gt=0)
    applicable_to: str = Field(default="all")  # all, tuendi, restaurants, tourism
    description: str = ""
    valid_from: Optional[str] = None
    valid_until: str
    tier_required: Optional[str] = None  # bronze, silver, gold, platinum, vip

class CouponApply(BaseModel):
    code: str
    order_type: str  # tuendi, restaurant, tourism
    order_amount: float

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

@router.post("/create")
async def create_coupon(request: Request, data: CouponCreate):
    """Admin: criar cupom"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Apenas administradores")
    
    existing = await db.coupons.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Código já existe")
    
    coupon_id = f"coupon_{uuid.uuid4().hex[:10]}"
    coupon_doc = {
        "coupon_id": coupon_id,
        "code": data.code.upper(),
        "type": data.type,
        "value": data.value,
        "max_discount_kz": data.max_discount_kz,
        "min_order_kz": data.min_order_kz,
        "max_uses": data.max_uses,
        "max_uses_per_user": data.max_uses_per_user,
        "uses_count": 0,
        "applicable_to": data.applicable_to,
        "description": data.description,
        "valid_from": data.valid_from or datetime.now(timezone.utc).isoformat(),
        "valid_until": data.valid_until,
        "tier_required": data.tier_required,
        "active": True,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    coupon_doc.pop("_id", None)
    return coupon_doc

@router.get("/available")
async def list_available_coupons(request: Request, order_type: Optional[str] = None):
    """Listar cupons disponíveis para o utilizador"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_tier = user.get("tier", "bronze") if user else "bronze"
    
    tier_order = ["bronze", "silver", "gold", "platinum", "vip"]
    user_tier_idx = tier_order.index(user_tier) if user_tier in tier_order else 0
    
    query = {"active": True}
    if order_type:
        query["applicable_to"] = {"$in": [order_type, "all"]}
    
    coupons = await db.coupons.find(query, {"_id": 0}).to_list(50)
    
    now = datetime.now(timezone.utc)
    valid_coupons = []
    for c in coupons:
        try:
            valid_until = datetime.fromisoformat(c["valid_until"].replace("Z", "+00:00"))
            if valid_until.tzinfo is None:
                valid_until = valid_until.replace(tzinfo=timezone.utc)
            if valid_until < now:
                continue
        except:
            continue
        
        if c.get("uses_count", 0) >= c.get("max_uses", 100):
            continue
        
        req_tier = c.get("tier_required")
        if req_tier:
            req_idx = tier_order.index(req_tier) if req_tier in tier_order else 0
            if user_tier_idx < req_idx:
                continue
        
        # Check user's personal usage
        user_uses = await db.coupon_usage.count_documents({
            "coupon_id": c["coupon_id"], "user_id": user_id
        })
        c["user_uses"] = user_uses
        c["can_use"] = user_uses < c.get("max_uses_per_user", 1)
        valid_coupons.append(c)
    
    return {"coupons": valid_coupons}

@router.post("/apply")
async def apply_coupon(request: Request, data: CouponApply):
    """Aplicar cupom a um pedido"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    coupon = await db.coupons.find_one(
        {"code": data.code.upper(), "active": True}, {"_id": 0}
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom não encontrado ou inativo")
    
    # Validate expiry
    now = datetime.now(timezone.utc)
    valid_until = datetime.fromisoformat(coupon["valid_until"].replace("Z", "+00:00"))
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    if valid_until < now:
        raise HTTPException(status_code=400, detail="Cupom expirado")
    
    # Validate usage
    if coupon.get("uses_count", 0) >= coupon.get("max_uses", 100):
        raise HTTPException(status_code=400, detail="Cupom esgotado")
    
    user_uses = await db.coupon_usage.count_documents({
        "coupon_id": coupon["coupon_id"], "user_id": user_id
    })
    if user_uses >= coupon.get("max_uses_per_user", 1):
        raise HTTPException(status_code=400, detail="Você já usou este cupom o máximo de vezes")
    
    # Validate applicable module
    if coupon["applicable_to"] not in ["all", data.order_type]:
        raise HTTPException(status_code=400, detail=f"Cupom não aplicável a {data.order_type}")
    
    # Validate min order
    if data.order_amount < coupon.get("min_order_kz", 0):
        raise HTTPException(status_code=400, detail=f"Pedido mínimo: {coupon['min_order_kz']} Kz")
    
    # Validate tier
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    tier_order = ["bronze", "silver", "gold", "platinum", "vip"]
    if coupon.get("tier_required"):
        user_tier = user.get("tier", "bronze") if user else "bronze"
        user_idx = tier_order.index(user_tier) if user_tier in tier_order else 0
        req_idx = tier_order.index(coupon["tier_required"]) if coupon["tier_required"] in tier_order else 0
        if user_idx < req_idx:
            raise HTTPException(status_code=403, detail=f"Requer tier {coupon['tier_required']} ou superior")
    
    # Calculate discount
    if coupon["type"] == "percent":
        discount = data.order_amount * coupon["value"] / 100
        discount = min(discount, coupon.get("max_discount_kz", 99999))
    elif coupon["type"] == "fixed":
        discount = min(coupon["value"], data.order_amount)
    elif coupon["type"] == "free_delivery":
        discount = coupon["value"]  # delivery fee amount
    else:
        discount = 0
    
    discount = round(discount, 2)
    
    # Record usage
    await db.coupon_usage.insert_one({
        "coupon_id": coupon["coupon_id"],
        "user_id": user_id,
        "order_type": data.order_type,
        "order_amount": data.order_amount,
        "discount": discount,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.coupons.update_one(
        {"coupon_id": coupon["coupon_id"]},
        {"$inc": {"uses_count": 1}}
    )
    
    return {
        "valid": True,
        "code": coupon["code"],
        "type": coupon["type"],
        "discount": discount,
        "final_amount": max(0, data.order_amount - discount),
        "description": coupon.get("description", "")
    }

@router.get("/validate/{code}")
async def validate_coupon(request: Request, code: str, order_type: str = "all", amount: float = 0):
    """Validar cupom sem aplicar"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    coupon = await db.coupons.find_one(
        {"code": code.upper(), "active": True}, {"_id": 0}
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    now = datetime.now(timezone.utc)
    valid_until = datetime.fromisoformat(coupon["valid_until"].replace("Z", "+00:00"))
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    if valid_until < now:
        raise HTTPException(status_code=400, detail="Cupom expirado")
    
    if coupon.get("uses_count", 0) >= coupon.get("max_uses", 100):
        raise HTTPException(status_code=400, detail="Cupom esgotado")
    
    user_uses = await db.coupon_usage.count_documents({
        "coupon_id": coupon["coupon_id"], "user_id": user_id
    })
    
    if coupon["type"] == "percent":
        discount = amount * coupon["value"] / 100 if amount else 0
        discount = min(discount, coupon.get("max_discount_kz", 99999))
    elif coupon["type"] == "fixed":
        discount = min(coupon["value"], amount) if amount else coupon["value"]
    else:
        discount = coupon["value"]
    
    return {
        "valid": True,
        "code": coupon["code"],
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": round(discount, 2),
        "applicable_to": coupon["applicable_to"],
        "min_order_kz": coupon.get("min_order_kz", 0),
        "description": coupon.get("description", ""),
        "can_use": user_uses < coupon.get("max_uses_per_user", 1),
        "tier_required": coupon.get("tier_required")
    }

@router.delete("/{coupon_id}")
async def deactivate_coupon(request: Request, coupon_id: str):
    """Admin: desativar cupom"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Apenas administradores")
    
    result = await db.coupons.update_one(
        {"coupon_id": coupon_id},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    return {"message": "Cupom desativado"}

@router.get("/admin/all")
async def admin_list_coupons(request: Request):
    """Admin: listar todos os cupons"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Apenas administradores")
    
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"coupons": coupons}
