from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os

router = APIRouter(prefix="/partners", tags=["partners"])

# Tier definitions
PARTNER_TIERS = {
    "basico": {
        "name": "Básico",
        "max_services": 10,
        "commission_rate": 0.15,
        "features": ["Até 10 serviços", "Suporte básico", "Dashboard básico"]
    },
    "premium": {
        "name": "Premium", 
        "max_services": 50,
        "commission_rate": 0.10,
        "features": ["Até 50 serviços", "Analytics avançado", "Suporte prioritário", "Badge Premium"]
    },
    "enterprise": {
        "name": "Enterprise",
        "max_services": -1,  # unlimited
        "commission_rate": 0.05,
        "features": ["Serviços ilimitados", "API Access", "Suporte 24/7", "White label", "Relatórios customizados"]
    }
}

USER_TIERS = {
    "normal": {
        "name": "Normal",
        "price": 0,
        "benefits": ["Acesso a todos os serviços", "Taxa de serviço padrão"]
    },
    "premium": {
        "name": "Premium",
        "price": 5000,  # por mês
        "benefits": ["Sem taxas de serviço", "Descontos exclusivos", "Suporte prioritário", "Acesso antecipado"]
    }
}

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

@router.post("/register")
async def register_partner(request: Request, partner_data: dict):
    """Registrar novo parceiro"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    # Verificar se usuário já é parceiro
    existing = await db.partners.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já é parceiro")
    
    partner_id = f"partner_{uuid.uuid4().hex[:10]}"
    
    partner_doc = {
        "partner_id": partner_id,
        "user_id": user_id,
        "business_name": partner_data.get("business_name"),
        "business_type": partner_data.get("business_type"),
        "tier": "basico",
        "status": "pending",
        "wallet_balance": 0.0,
        "total_revenue": 0.0,
        "commission_rate": PARTNER_TIERS["basico"]["commission_rate"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.partners.insert_one(partner_doc)
    
    # Criar carteira
    wallet_doc = {
        "wallet_id": f"wallet_{uuid.uuid4().hex[:8]}",
        "partner_id": partner_id,
        "balance": 0.0,
        "credit_limit": 0.0,
        "payment_methods": ["multicaixa", "unitel_money", "bai_paga"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.partner_wallets.insert_one(wallet_doc)
    
    return {"partner_id": partner_id, "status": "pending", "message": "Cadastro enviado para aprovação"}

@router.get("/dashboard")
async def get_partner_dashboard(request: Request):
    """Dashboard do parceiro com estatísticas"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    # Estatísticas
    total_services = await db.service_listings.count_documents({"partner_id": partner["partner_id"]})
    active_services = await db.service_listings.count_documents({"partner_id": partner["partner_id"], "status": "active"})
    
    # Transações recentes
    transactions = await db.transactions.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Tier info
    tier_info = PARTNER_TIERS.get(partner["tier"], {})
    
    return {
        "partner": partner,
        "tier_info": tier_info,
        "stats": {
            "total_services": total_services,
            "active_services": active_services,
            "wallet_balance": partner["wallet_balance"],
            "total_revenue": partner["total_revenue"]
        },
        "recent_transactions": transactions
    }

@router.get("/services")
async def get_partner_services(request: Request):
    """Listar serviços do parceiro"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    services = await db.service_listings.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return {"services": services, "max_services": PARTNER_TIERS[partner["tier"]]["max_services"]}

@router.post("/services")
async def create_service(request: Request, service_data: dict):
    """Criar novo serviço"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    # Verificar limites do tier
    current_count = await db.service_listings.count_documents({"partner_id": partner["partner_id"]})
    max_services = PARTNER_TIERS[partner["tier"]]["max_services"]
    
    if max_services != -1 and current_count >= max_services:
        raise HTTPException(status_code=403, detail=f"Limite de {max_services} serviços atingido. Faça upgrade do plano.")
    
    listing_id = f"listing_{uuid.uuid4().hex[:10]}"
    
    listing_doc = {
        "listing_id": listing_id,
        "partner_id": partner["partner_id"],
        "service_type": service_data.get("service_type"),
        "title": service_data.get("title"),
        "description": service_data.get("description"),
        "price": service_data.get("price"),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_listings.insert_one(listing_doc)
    
    return {"listing_id": listing_id, "status": "active"}

@router.get("/wallet")
async def get_wallet(request: Request):
    """Obter informações da carteira"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    wallet = await db.partner_wallets.find_one({"partner_id": partner["partner_id"]}, {"_id": 0})
    
    # Transações recentes
    transactions = await db.transactions.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "wallet": wallet,
        "transactions": transactions
    }

@router.post("/wallet/withdraw")
async def withdraw_funds(request: Request, withdrawal_data: dict):
    """Solicitar saque"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    amount = withdrawal_data.get("amount")
    payment_method = withdrawal_data.get("payment_method")
    
    if amount > partner["wallet_balance"]:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Criar transação de saque
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction_doc = {
        "transaction_id": transaction_id,
        "partner_id": partner["partner_id"],
        "type": "payout",
        "amount": -amount,
        "description": f"Saque via {payment_method}",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    # Atualizar saldo
    await db.partners.update_one(
        {"partner_id": partner["partner_id"]},
        {"$inc": {"wallet_balance": -amount}}
    )
    
    return {"transaction_id": transaction_id, "status": "pending", "message": "Saque em processamento"}

@router.get("/accounting")
async def get_accounting(request: Request, period: str = "current_month"):
    """Relatório de contabilidade"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    # Buscar registros contábeis
    records = await db.accounting_records.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("period", -1).limit(12).to_list(12)
    
    # Calcular totais
    total_revenue = sum(r.get("total_revenue", 0) for r in records)
    total_commission = sum(r.get("commission", 0) for r in records)
    total_net = sum(r.get("net_amount", 0) for r in records)
    
    return {
        "partner_tier": partner["tier"],
        "commission_rate": partner["commission_rate"],
        "summary": {
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "net_amount": total_net
        },
        "records": records
    }

@router.post("/upgrade-tier")
async def upgrade_tier(request: Request, tier_data: dict):
    """Fazer upgrade de plano"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    new_tier = tier_data.get("tier")
    
    if new_tier not in PARTNER_TIERS:
        raise HTTPException(status_code=400, detail="Tier inválido")
    
    # Atualizar tier e taxa de comissão
    await db.partners.update_one(
        {"partner_id": partner["partner_id"]},
        {
            "$set": {
                "tier": new_tier,
                "commission_rate": PARTNER_TIERS[new_tier]["commission_rate"]
            }
        }
    )
    
    return {
        "tier": new_tier,
        "commission_rate": PARTNER_TIERS[new_tier]["commission_rate"],
        "message": f"Upgrade para {PARTNER_TIERS[new_tier]['name']} realizado!"
    }

@router.get("/tiers")
async def get_tiers():
    """Listar todos os tiers disponíveis"""
    return {
        "partner_tiers": PARTNER_TIERS,
        "user_tiers": USER_TIERS
    }
