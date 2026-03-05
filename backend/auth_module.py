"""
Auth Module - Sistema de Autenticação e Níveis de Acesso Melhorado
TudoAqui Marketplace
"""

from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import os
import random
import string

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tudoaqui-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# ==================== ENUMS & CONSTANTS ====================

class UserRole:
    USER = "user"
    PARTNER = "partner"
    DRIVER = "driver"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class UserTier:
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    VIP = "vip"

TIER_REQUIREMENTS = {
    UserTier.BRONZE: {"min_points": 0, "min_orders": 0},
    UserTier.SILVER: {"min_points": 500, "min_orders": 5},
    UserTier.GOLD: {"min_points": 2000, "min_orders": 20},
    UserTier.PLATINUM: {"min_points": 5000, "min_orders": 50},
    UserTier.VIP: {"min_points": 15000, "min_orders": 100},
}

TIER_BENEFITS = {
    UserTier.BRONZE: {
        "discount_percent": 0,
        "free_delivery": False,
        "priority_support": False,
        "exclusive_offers": False,
        "cashback_percent": 0
    },
    UserTier.SILVER: {
        "discount_percent": 2,
        "free_delivery": False,
        "priority_support": False,
        "exclusive_offers": True,
        "cashback_percent": 1
    },
    UserTier.GOLD: {
        "discount_percent": 5,
        "free_delivery": True,
        "priority_support": False,
        "exclusive_offers": True,
        "cashback_percent": 2
    },
    UserTier.PLATINUM: {
        "discount_percent": 10,
        "free_delivery": True,
        "priority_support": True,
        "exclusive_offers": True,
        "cashback_percent": 3
    },
    UserTier.VIP: {
        "discount_percent": 15,
        "free_delivery": True,
        "priority_support": True,
        "exclusive_offers": True,
        "cashback_percent": 5
    },
}

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    preferred_language: Optional[str] = "pt"
    notification_settings: Optional[dict] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

# ==================== HELPER FUNCTIONS ====================

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def generate_reset_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def calculate_user_tier(points: int, orders: int) -> str:
    """Calculate user tier based on points and orders"""
    current_tier = UserTier.BRONZE
    for tier, requirements in TIER_REQUIREMENTS.items():
        if points >= requirements["min_points"] and orders >= requirements["min_orders"]:
            current_tier = tier
    return current_tier

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token"""
    db = request.app.state.db
    
    # Try cookie first
    token = request.cookies.get("access_token")
    
    # Try Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return user

async def require_role(request: Request, required_roles: List[str]) -> dict:
    """Require specific role(s) for access"""
    user = await get_current_user(request)
    user_role = user.get("role", UserRole.USER)
    
    if user_role not in required_roles:
        raise HTTPException(status_code=403, detail="Acesso não autorizado para este recurso")
    
    return user

# ==================== API ENDPOINTS ====================

@router.post("/register")
async def register(request: Request, response: Response, user_data: UserRegister):
    """Register a new user"""
    db = request.app.state.db
    
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    verification_code = generate_verification_code()
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email.lower(),
        "password": get_password_hash(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": UserRole.USER,
        "roles": [UserRole.USER],  # Support multiple roles
        "tier": UserTier.BRONZE,
        "points": 100,  # Welcome bonus
        "total_orders": 0,
        "total_spent": 0,
        "wallet_balance": 0,
        "email_verified": False,
        "phone_verified": False,
        "verification_code": verification_code,
        "profile": {
            "address": None,
            "city": "Luanda",
            "province": "Luanda",
            "birth_date": None,
            "gender": None,
            "avatar": None,
            "preferred_language": "pt"
        },
        "notification_settings": {
            "push": True,
            "email": True,
            "sms": False,
            "promotions": True,
            "order_updates": True
        },
        "referral_code": f"TUDO{user_id[-6:].upper()}",
        "referred_by": None,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create welcome notification
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "title": "Bem-vindo ao TudoAqui! 🎉",
        "message": f"Olá {user_data.name}! Você ganhou 100 pontos de boas-vindas. Explore nossos serviços!",
        "type": "welcome",
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Generate token
    access_token = create_access_token(data={
        "user_id": user_id,
        "email": user_data.email.lower(),
        "role": UserRole.USER
    })
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7  # 7 days
    )
    
    response.set_cookie(
        key="user_id",
        value=user_id,
        httponly=False,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7
    )
    
    # Remove sensitive data
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    user_doc.pop("verification_code", None)
    
    return {
        "message": "Conta criada com sucesso!",
        "user": user_doc,
        "token": access_token
    }

@router.post("/login")
async def login(request: Request, response: Response, login_data: UserLogin):
    """Login user"""
    db = request.app.state.db
    
    user = await db.users.find_one({"email": login_data.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Conta desativada. Contacte o suporte.")
    
    # Update last login and recalculate tier
    new_tier = calculate_user_tier(user.get("points", 0), user.get("total_orders", 0))
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "last_login": datetime.utcnow().isoformat(),
            "tier": new_tier
        }}
    )
    
    access_token = create_access_token(data={
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user.get("role", UserRole.USER)
    })
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7
    )
    
    response.set_cookie(
        key="user_id",
        value=user["user_id"],
        httponly=False,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7
    )
    
    user.pop("password", None)
    user.pop("_id", None)
    user.pop("verification_code", None)
    user["tier"] = new_tier
    
    return {
        "message": "Login efetuado com sucesso!",
        "user": user,
        "token": access_token
    }

@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie("access_token")
    response.delete_cookie("user_id")
    return {"message": "Logout efetuado com sucesso"}

@router.get("/me")
async def get_me(request: Request):
    """Get current user profile"""
    user = await get_current_user(request)
    db = request.app.state.db
    
    # Recalculate tier
    new_tier = calculate_user_tier(user.get("points", 0), user.get("total_orders", 0))
    if new_tier != user.get("tier"):
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"tier": new_tier}}
        )
        user["tier"] = new_tier
    
    # Get tier benefits
    tier_benefits = TIER_BENEFITS.get(user.get("tier", UserTier.BRONZE), TIER_BENEFITS[UserTier.BRONZE])
    
    # Get next tier info
    current_tier_index = list(TIER_REQUIREMENTS.keys()).index(user.get("tier", UserTier.BRONZE))
    next_tier = None
    points_to_next = 0
    
    if current_tier_index < len(TIER_REQUIREMENTS) - 1:
        next_tier_key = list(TIER_REQUIREMENTS.keys())[current_tier_index + 1]
        next_tier = {
            "name": next_tier_key,
            "requirements": TIER_REQUIREMENTS[next_tier_key]
        }
        points_to_next = max(0, TIER_REQUIREMENTS[next_tier_key]["min_points"] - user.get("points", 0))
    
    # Get unread notifications count
    unread_count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "read": False
    })
    
    return {
        "user": user,
        "tier_info": {
            "current_tier": user.get("tier", UserTier.BRONZE),
            "benefits": tier_benefits,
            "next_tier": next_tier,
            "points_to_next": points_to_next,
            "progress_percent": min(100, (user.get("points", 0) / max(1, TIER_REQUIREMENTS.get(next_tier["name"] if next_tier else UserTier.VIP, {}).get("min_points", 1))) * 100) if next_tier else 100
        },
        "unread_notifications": unread_count
    }

@router.patch("/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    """Update user profile"""
    user = await get_current_user(request)
    db = request.app.state.db
    
    update_data = {}
    if profile_data.name:
        update_data["name"] = profile_data.name
    if profile_data.phone:
        update_data["phone"] = profile_data.phone
    
    # Profile sub-document updates
    profile_updates = {}
    if profile_data.address:
        profile_updates["profile.address"] = profile_data.address
    if profile_data.city:
        profile_updates["profile.city"] = profile_data.city
    if profile_data.province:
        profile_updates["profile.province"] = profile_data.province
    if profile_data.birth_date:
        profile_updates["profile.birth_date"] = profile_data.birth_date
    if profile_data.gender:
        profile_updates["profile.gender"] = profile_data.gender
    if profile_data.preferred_language:
        profile_updates["profile.preferred_language"] = profile_data.preferred_language
    if profile_data.notification_settings:
        for key, value in profile_data.notification_settings.items():
            profile_updates[f"notification_settings.{key}"] = value
    
    update_data.update(profile_updates)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    
    return {"message": "Perfil atualizado", "user": updated_user}

@router.post("/change-password")
async def change_password(request: Request, data: ChangePassword):
    """Change user password"""
    db = request.app.state.db
    user = await get_current_user(request)
    
    # Get user with password
    user_with_pass = await db.users.find_one({"user_id": user["user_id"]})
    
    if not verify_password(data.current_password, user_with_pass["password"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "password": get_password_hash(data.new_password),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {"message": "Senha alterada com sucesso"}

@router.post("/forgot-password")
async def forgot_password(request: Request, data: PasswordReset):
    """Request password reset"""
    db = request.app.state.db
    
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        # Don't reveal if email exists
        return {"message": "Se o email existir, você receberá instruções para redefinir a senha"}
    
    reset_token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    await db.password_resets.insert_one({
        "user_id": user["user_id"],
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.utcnow().isoformat()
    })
    
    # In production, send email here
    # For now, return token in response (remove in production)
    return {
        "message": "Instruções enviadas para o email",
        "reset_token": reset_token  # Remove in production
    }

@router.post("/reset-password")
async def reset_password(request: Request, data: PasswordResetConfirm):
    """Reset password with token"""
    db = request.app.state.db
    
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    })
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    if datetime.fromisoformat(reset_doc["expires_at"]) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expirado")
    
    await db.users.update_one(
        {"user_id": reset_doc["user_id"]},
        {"$set": {
            "password": get_password_hash(data.new_password),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Senha redefinida com sucesso"}

@router.post("/verify-email")
async def verify_email(request: Request, data: dict):
    """Verify email with code"""
    db = request.app.state.db
    user = await get_current_user(request)
    
    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Código não fornecido")
    
    user_doc = await db.users.find_one({"user_id": user["user_id"]})
    
    if user_doc.get("verification_code") != code:
        raise HTTPException(status_code=400, detail="Código inválido")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "email_verified": True,
            "verification_code": None
        },
        "$inc": {"points": 50}}  # Bonus for verification
    )
    
    return {"message": "Email verificado com sucesso! +50 pontos"}

@router.get("/roles")
async def get_user_roles(request: Request):
    """Get user roles and permissions"""
    user = await get_current_user(request)
    
    roles = user.get("roles", [user.get("role", UserRole.USER)])
    
    permissions = {
        "can_access_admin": UserRole.ADMIN in roles or UserRole.SUPER_ADMIN in roles,
        "can_manage_partners": UserRole.ADMIN in roles or UserRole.SUPER_ADMIN in roles,
        "can_drive": UserRole.DRIVER in roles,
        "is_partner": UserRole.PARTNER in roles,
        "is_user": UserRole.USER in roles
    }
    
    return {
        "roles": roles,
        "primary_role": user.get("role", UserRole.USER),
        "permissions": permissions
    }

@router.post("/add-role")
async def add_user_role(request: Request, data: dict):
    """Add role to user (admin only)"""
    admin = await require_role(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN])
    db = request.app.state.db
    
    target_user_id = data.get("user_id")
    new_role = data.get("role")
    
    if new_role not in [UserRole.USER, UserRole.PARTNER, UserRole.DRIVER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Role inválido")
    
    # Only super_admin can add admin role
    if new_role == UserRole.ADMIN and admin.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Apenas super admin pode adicionar admins")
    
    await db.users.update_one(
        {"user_id": target_user_id},
        {"$addToSet": {"roles": new_role}}
    )
    
    return {"message": f"Role {new_role} adicionado ao usuário"}

# ==================== POINTS & REWARDS ====================

@router.get("/points")
async def get_points_info(request: Request):
    """Get user points and rewards info"""
    user = await get_current_user(request)
    db = request.app.state.db
    
    # Get points history
    points_history = await db.points_transactions.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "current_points": user.get("points", 0),
        "tier": user.get("tier", UserTier.BRONZE),
        "tier_benefits": TIER_BENEFITS.get(user.get("tier", UserTier.BRONZE)),
        "points_history": points_history,
        "available_rewards": [
            {"id": "delivery_free", "name": "Entrega Grátis", "points": 200, "type": "discount"},
            {"id": "10_percent", "name": "10% Desconto", "points": 500, "type": "discount"},
            {"id": "20_percent", "name": "20% Desconto", "points": 1000, "type": "discount"},
            {"id": "wallet_500", "name": "500 Kz na Carteira", "points": 1500, "type": "cashback"},
            {"id": "wallet_1000", "name": "1000 Kz na Carteira", "points": 2500, "type": "cashback"},
        ]
    }

@router.post("/points/redeem")
async def redeem_points(request: Request, data: dict):
    """Redeem points for rewards"""
    user = await get_current_user(request)
    db = request.app.state.db
    
    reward_id = data.get("reward_id")
    
    rewards_map = {
        "delivery_free": {"points": 200, "value": 500, "type": "coupon"},
        "10_percent": {"points": 500, "value": 10, "type": "discount_percent"},
        "20_percent": {"points": 1000, "value": 20, "type": "discount_percent"},
        "wallet_500": {"points": 1500, "value": 500, "type": "wallet"},
        "wallet_1000": {"points": 2500, "value": 1000, "type": "wallet"},
    }
    
    reward = rewards_map.get(reward_id)
    if not reward:
        raise HTTPException(status_code=400, detail="Recompensa inválida")
    
    if user.get("points", 0) < reward["points"]:
        raise HTTPException(status_code=400, detail="Pontos insuficientes")
    
    # Deduct points
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"points": -reward["points"]}}
    )
    
    # Record transaction
    await db.points_transactions.insert_one({
        "transaction_id": f"pt_{uuid.uuid4().hex[:10]}",
        "user_id": user["user_id"],
        "type": "redeem",
        "amount": -reward["points"],
        "description": f"Resgate: {reward_id}",
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Create reward based on type
    if reward["type"] == "wallet":
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"wallet_balance": reward["value"]}}
        )
        return {"message": f"{reward['value']} Kz adicionados à carteira!"}
    else:
        coupon_code = f"TUDO{uuid.uuid4().hex[:6].upper()}"
        await db.user_coupons.insert_one({
            "coupon_id": f"coup_{uuid.uuid4().hex[:10]}",
            "user_id": user["user_id"],
            "code": coupon_code,
            "type": reward["type"],
            "value": reward["value"],
            "used": False,
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "created_at": datetime.utcnow().isoformat()
        })
        return {"message": "Cupom criado!", "coupon_code": coupon_code}
