"""
Módulo Admin - Gestão do sistema com roles hierárquicos
Admin: CEO, Admin, Suporte, Finanças
User: Normal, Premium
Partner: Básico, Premium, Enterprise
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import uuid
import os

router = APIRouter(prefix="/admin", tags=["admin"])

# Role definitions
ADMIN_ROLES = {
    "ceo": {"name": "CEO", "level": 4, "permissions": ["all"]},
    "admin": {"name": "Administrador", "level": 3, "permissions": ["manage_users", "manage_partners", "manage_config", "view_analytics", "manage_payments"]},
    "suporte": {"name": "Suporte", "level": 2, "permissions": ["view_users", "view_partners", "manage_tickets", "view_analytics"]},
    "financas": {"name": "Finanças", "level": 1, "permissions": ["view_analytics", "manage_payments", "view_reports", "manage_fiscal"]}
}

USER_ROLES = {
    "normal": {"name": "Normal", "level": 1},
    "premium": {"name": "Premium", "level": 2}
}

PARTNER_ROLES = {
    "basico": {"name": "Básico", "level": 1},
    "premium": {"name": "Premium", "level": 2},
    "enterprise": {"name": "Enterprise", "level": 3}
}

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

async def require_admin(request: Request, min_level: int = 1):
    """Verificar se utilizador é admin com nível mínimo"""
    user_id = await get_current_user(request)
    db = await get_db()
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    admin_role = user.get("admin_role")
    if not admin_role or admin_role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    if ADMIN_ROLES[admin_role]["level"] < min_level:
        raise HTTPException(status_code=403, detail="Nível de permissão insuficiente")
    
    return user_id, admin_role

# ============ SYSTEM CONFIG ============

@router.get("/config")
async def get_system_config(request: Request):
    """Obter configuração do sistema"""
    user_id, role = await require_admin(request)
    db = await get_db()
    
    config = await db.system_config.find_one({"config_id": "main"}, {"_id": 0})
    if not config:
        config = {
            "config_id": "main",
            "app_name": "TudoAqui",
            "developer": "Sincesoft-Sinceridade Service",
            "version": "1.0.0",
            "about": {
                "description": "TudoAqui é um marketplace completo para Angola, conectando utilizadores a serviços de taxi, restaurantes, turismo e imóveis.",
                "mission": "Facilitar o acesso a serviços essenciais em Angola através da tecnologia.",
                "founded_year": 2026
            },
            "contacts": {
                "email": "info@tudoaqui.ao",
                "phone": "+244 923 000 000",
                "whatsapp": "+244 923 000 000",
                "address": "Luanda, Angola",
                "social": {
                    "facebook": "https://facebook.com/tudoaqui",
                    "instagram": "https://instagram.com/tudoaqui",
                    "linkedin": ""
                }
            },
            "api_configs": {
                "google_maps_key": "",
                "multicaixa_api_key": "",
                "multicaixa_merchant_id": "",
                "unitelmoney_api_key": "",
                "bai_paga_api_key": "",
                "sms_api_key": ""
            },
            "payment_settings": {
                "bank_accounts": {
                    "primary": {
                        "bank": "Banco BAI",
                        "account_name": "TudoAqui Marketplace LDA",
                        "iban": "AO06 0040 0000 8574 3210 1018 7",
                        "account_number": "857432101018",
                        "nif": "5417892301"
                    }
                },
                "commission_rates": {"basico": 0.15, "premium": 0.10, "enterprise": 0.05},
                "payment_direct_to_partner": True
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.system_config.insert_one(config)
    
    # Hide sensitive API keys for non-CEO/admin
    if ADMIN_ROLES[role]["level"] < 3:
        if "api_configs" in config:
            config["api_configs"] = {k: ("***" if v else "") for k, v in config.get("api_configs", {}).items()}
    
    return config

@router.put("/config")
async def update_system_config(request: Request, config_data: dict):
    """Atualizar configuração do sistema"""
    user_id, role = await require_admin(request, min_level=3)
    db = await get_db()
    
    config_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    config_data["updated_by"] = user_id
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": config_data},
        upsert=True
    )
    
    return {"message": "Configuração atualizada com sucesso"}

@router.put("/config/about")
async def update_about(request: Request, about_data: dict):
    """Atualizar informações sobre a empresa"""
    await require_admin(request, min_level=2)
    db = await get_db()
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": {"about": about_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Informações atualizadas"}

@router.put("/config/contacts")
async def update_contacts(request: Request, contact_data: dict):
    """Atualizar contactos"""
    await require_admin(request, min_level=2)
    db = await get_db()
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": {"contacts": contact_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Contactos atualizados"}

@router.put("/config/apis")
async def update_api_configs(request: Request, api_data: dict):
    """Atualizar configurações de APIs"""
    await require_admin(request, min_level=3)
    db = await get_db()
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": {"api_configs": api_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "APIs atualizadas"}

@router.put("/config/payments")
async def update_payment_settings(request: Request, payment_data: dict):
    """Atualizar configurações de pagamento"""
    await require_admin(request, min_level=3)
    db = await get_db()
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": {"payment_settings": payment_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Configurações de pagamento atualizadas"}

# ============ USER MANAGEMENT ============

@router.get("/users")
async def list_users(request: Request, role: Optional[str] = None, page: int = 1, limit: int = 20):
    """Listar utilizadores"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if role:
        query["admin_role"] = role
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@router.put("/users/{user_id}/role")
async def assign_admin_role(request: Request, user_id: str, role_data: dict):
    """Atribuir role de admin a utilizador"""
    _, admin_role = await require_admin(request, min_level=3)
    db = await get_db()
    
    new_role = role_data.get("admin_role")
    if new_role and new_role not in ADMIN_ROLES:
        raise HTTPException(status_code=400, detail=f"Role inválido. Use: {', '.join(ADMIN_ROLES.keys())}")
    
    # CEO cannot be changed except by another CEO
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    if target.get("admin_role") == "ceo" and admin_role != "ceo":
        raise HTTPException(status_code=403, detail="Apenas CEO pode alterar outro CEO")
    
    update_fields = {}
    if new_role:
        update_fields["admin_role"] = new_role
    elif "admin_role" in role_data and role_data["admin_role"] is None:
        update_fields["admin_role"] = None
    
    if update_fields:
        await db.users.update_one({"user_id": user_id}, {"$set": update_fields})
    
    return {"user_id": user_id, "admin_role": new_role, "message": f"Role atualizado para {new_role or 'nenhum'}"}

# ============ DASHBOARD STATS ============

@router.get("/stats")
async def get_admin_stats(request: Request):
    """Estatísticas gerais do sistema"""
    await require_admin(request)
    db = await get_db()
    
    total_users = await db.users.count_documents({})
    total_partners = await db.partners.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_payments = await db.payments.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    total_rides = await db.rides.count_documents({})
    
    confirmed_payments = await db.payments.count_documents({"status": "confirmado"})
    pending_payments = await db.payments.count_documents({"status": "pendente"})
    
    # Revenue from payments
    pipeline = [
        {"$match": {"status": {"$in": ["confirmado", "verificado"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payments.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "users": {"total": total_users},
        "partners": {"total": total_partners},
        "orders": {"total": total_orders},
        "payments": {"total": total_payments, "confirmed": confirmed_payments, "pending": pending_payments},
        "bookings": {"total": total_bookings},
        "rides": {"total": total_rides},
        "revenue": {"total": total_revenue}
    }

@router.get("/roles")
async def get_roles(request: Request):
    """Obter definições de roles"""
    await require_admin(request)
    return {
        "admin_roles": ADMIN_ROLES,
        "user_roles": USER_ROLES,
        "partner_roles": PARTNER_ROLES
    }

# ============ SETUP INITIAL ADMIN ============

@router.post("/setup")
async def setup_admin(request: Request):
    """Configurar primeiro admin (CEO) - só funciona se não existir admin"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    existing_admin = await db.users.find_one({"admin_role": {"$exists": True, "$ne": None}})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Sistema já possui administrador")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"admin_role": "ceo"}}
    )
    
    return {"message": "Configurado como CEO com sucesso!", "admin_role": "ceo"}


# ============ DOCUMENT VERIFICATION (Admin) ============

@router.get("/documents/pending")
async def get_pending_documents(request: Request):
    """Admin: ver documentos pendentes de aprovação"""
    await require_admin(request)
    db = await get_db()
    
    docs = await db.partner_documents.find(
        {"status": "pendente"},
        {"_id": 0, "file_data": 0}
    ).sort("uploaded_at", -1).to_list(100)
    
    # Enrich with partner info
    for doc in docs:
        partner = await db.partners.find_one({"partner_id": doc["partner_id"]}, {"_id": 0})
        doc["business_name"] = partner.get("business_name", "N/A") if partner else "N/A"
    
    return {"documents": docs, "total": len(docs)}

@router.get("/documents/all")
async def get_all_documents(request: Request, status: Optional[str] = None):
    """Admin: ver todos os documentos"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    docs = await db.partner_documents.find(query, {"_id": 0, "file_data": 0}).sort("uploaded_at", -1).to_list(200)
    
    for doc in docs:
        partner = await db.partners.find_one({"partner_id": doc["partner_id"]}, {"_id": 0})
        doc["business_name"] = partner.get("business_name", "N/A") if partner else "N/A"
    
    return {"documents": docs, "total": len(docs)}

@router.post("/documents/{doc_id}/review")
async def review_document(request: Request, doc_id: str, review_data: dict):
    """Admin: aprovar ou rejeitar documento"""
    user_id, role = await require_admin(request, min_level=2)
    db = await get_db()
    
    action = review_data.get("action")  # approve, reject
    reason = review_data.get("reason", "")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Ação inválida. Use: approve ou reject")
    
    doc = await db.partner_documents.find_one({"document_id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    new_status = "aprovado" if action == "approve" else "rejeitado"
    
    await db.partner_documents.update_one(
        {"document_id": doc_id},
        {"$set": {
            "status": new_status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": user_id,
            "rejection_reason": reason if action == "reject" else None
        }}
    )
    
    # If all required docs are approved, activate partner
    if action == "approve":
        all_docs = await db.partner_documents.find({"partner_id": doc["partner_id"]}, {"_id": 0}).to_list(10)
        all_approved = all(d.get("status") == "aprovado" or d.get("document_id") == doc_id for d in all_docs)
        if all_approved and len(all_docs) >= 1:
            await db.partners.update_one(
                {"partner_id": doc["partner_id"]},
                {"$set": {"status": "active", "verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Notify partner
    from notifications_module import create_notification
    await create_notification(
        doc["user_id"],
        f"Documento {new_status}",
        f"O seu documento ({doc['doc_type'].upper()}) foi {new_status}." + (f" Motivo: {reason}" if reason else ""),
        "partner",
        doc_id
    )
    
    return {"document_id": doc_id, "status": new_status}

# ============ IVA TOGGLE ============

@router.get("/iva-settings")
async def get_iva_settings(request: Request):
    """Obter configurações de IVA"""
    await require_admin(request)
    db = await get_db()
    
    config = await db.system_config.find_one({"config_id": "main"}, {"_id": 0})
    iva_settings = config.get("iva_settings", {"enabled": False, "rate": 14.0}) if config else {"enabled": False, "rate": 14.0}
    return iva_settings

@router.put("/iva-settings")
async def update_iva_settings(request: Request, iva_data: dict):
    """Atualizar configurações de IVA"""
    await require_admin(request, min_level=3)
    db = await get_db()
    
    await db.system_config.update_one(
        {"config_id": "main"},
        {"$set": {"iva_settings": iva_data, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "IVA atualizado", "iva_settings": iva_data}

# ============ REPORTS EXPORT ============

@router.get("/reports/sales")
async def get_sales_report(request: Request, period: str = "month"):
    """Relatório de vendas"""
    await require_admin(request)
    db = await get_db()
    
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    if period == "day":
        start = now - timedelta(days=1)
    elif period == "week":
        start = now - timedelta(weeks=1)
    else:
        start = now - timedelta(days=30)
    
    start_iso = start.isoformat()
    
    orders = await db.orders.find({"created_at": {"$gte": start_iso}}, {"_id": 0}).to_list(10000)
    payments = await db.payments.find({"created_at": {"$gte": start_iso}}, {"_id": 0}).to_list(10000)
    
    total_orders = len(orders)
    total_revenue = sum(o.get("total", 0) for o in orders)
    confirmed_payments = [p for p in payments if p.get("status") in ["confirmado", "verificado"]]
    total_paid = sum(p.get("amount", 0) for p in confirmed_payments)
    
    # IVA calculation
    config = await db.system_config.find_one({"config_id": "main"}, {"_id": 0})
    iva_settings = config.get("iva_settings", {"enabled": False, "rate": 14.0}) if config else {"enabled": False, "rate": 14.0}
    iva_amount = total_revenue * (iva_settings["rate"] / 100) if iva_settings["enabled"] else 0
    
    return {
        "period": period,
        "start_date": start_iso,
        "end_date": now.isoformat(),
        "orders": {"total": total_orders, "revenue": total_revenue},
        "payments": {"total": len(payments), "confirmed": len(confirmed_payments), "total_paid": total_paid},
        "iva": {"enabled": iva_settings["enabled"], "rate": iva_settings["rate"], "amount": iva_amount},
        "commission": {"estimated": total_revenue * 0.10},
        "data": {
            "orders": orders[:100],
            "payments": [{"payment_id": p["payment_id"], "amount": p["amount"], "status": p["status"], "created_at": p["created_at"]} for p in payments[:100]]
        }
    }
