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

@router.get("/user-tier")
async def get_user_tier(request: Request):
    """Obter tier do utilizador atual"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    current_tier = user.get("user_tier", "normal")
    tier_info = USER_TIERS.get(current_tier, USER_TIERS["normal"])
    
    return {
        "user_id": user_id,
        "current_tier": current_tier,
        "tier_info": tier_info,
        "available_tiers": USER_TIERS
    }

@router.post("/user-tier/upgrade")
async def upgrade_user_tier(request: Request, tier_data: dict):
    """Fazer upgrade do tier do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    new_tier = tier_data.get("tier")
    if new_tier not in USER_TIERS:
        raise HTTPException(status_code=400, detail="Tier inválido")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    current_tier = user.get("user_tier", "normal")
    if current_tier == new_tier:
        raise HTTPException(status_code=400, detail="Já possui este tier")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"user_tier": new_tier, "tier_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "user_id": user_id,
        "new_tier": new_tier,
        "tier_info": USER_TIERS[new_tier],
        "message": f"Upgrade para {USER_TIERS[new_tier]['name']} realizado com sucesso!"
    }

@router.post("/approve/{partner_id}")
async def approve_partner(request: Request, partner_id: str):
    """Aprovar parceiro (admin)"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"partner_id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    await db.partners.update_one(
        {"partner_id": partner_id},
        {"$set": {"status": "active", "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"partner_id": partner_id, "status": "active", "message": "Parceiro aprovado com sucesso"}

@router.get("/analytics")
async def get_partner_analytics(request: Request):
    """Analytics detalhado do parceiro"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    pid = partner["partner_id"]
    
    # Services stats
    total_services = await db.service_listings.count_documents({"partner_id": pid})
    active_services = await db.service_listings.count_documents({"partner_id": pid, "status": "active"})
    
    # Transactions
    transactions = await db.transactions.find({"partner_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    total_revenue = sum(t["amount"] for t in transactions if t.get("type") == "credit")
    total_commission = sum(t["amount"] for t in transactions if t.get("type") == "commission")
    
    # Monthly breakdown (simulated from transactions)
    monthly_data = {}
    for t in transactions:
        month = t.get("created_at", "")[:7]
        if month not in monthly_data:
            monthly_data[month] = {"revenue": 0, "orders": 0}
        if t.get("type") == "credit":
            monthly_data[month]["revenue"] += t["amount"]
            monthly_data[month]["orders"] += 1
    
    # Reviews avg
    services = await db.service_listings.find({"partner_id": pid}, {"_id": 0}).to_list(100)
    
    return {
        "partner": partner,
        "services": {"total": total_services, "active": active_services},
        "revenue": {
            "total": total_revenue,
            "commission_paid": total_commission,
            "net": total_revenue - total_commission,
            "wallet_balance": partner.get("wallet_balance", 0)
        },
        "monthly": monthly_data,
        "transactions": transactions[:20],
        "tier_info": PARTNER_TIERS.get(partner.get("tier", "basico"), {})
    }

@router.put("/bank-details")
async def update_partner_bank_details(request: Request, bank_data: dict):
    """Parceiro atualiza seus dados bancários para receber pagamentos"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    await db.partners.update_one(
        {"partner_id": partner["partner_id"]},
        {"$set": {
            "bank_details": bank_data,
            "bank_details_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Dados bancários atualizados", "bank_details": bank_data}

@router.get("/bank-details")
async def get_partner_bank_details(request: Request):
    """Obter dados bancários do parceiro"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    return {"bank_details": partner.get("bank_details", {}), "partner_id": partner["partner_id"]}


# ============ DOCUMENT VERIFICATION ============

@router.post("/documents/upload")
async def upload_document(request: Request, doc_data: dict):
    """Upload documento para verificação (base64)"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    doc_type = doc_data.get("doc_type")  # bi, nif, alvara
    doc_base64 = doc_data.get("file_data", "")
    doc_name = doc_data.get("file_name", "documento")
    
    valid_types = ["bi", "nif", "alvara", "outro"]
    if doc_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Use: {', '.join(valid_types)}")
    
    if not doc_base64:
        raise HTTPException(status_code=400, detail="Ficheiro obrigatório")
    
    doc_id = f"doc_{uuid.uuid4().hex[:10]}"
    doc_doc = {
        "document_id": doc_id,
        "partner_id": partner["partner_id"],
        "user_id": user_id,
        "doc_type": doc_type,
        "file_name": doc_name,
        "file_data": doc_base64,
        "status": "pendente",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
        "reviewed_by": None,
        "rejection_reason": None
    }
    
    await db.partner_documents.insert_one(doc_doc)
    
    return {"document_id": doc_id, "status": "pendente", "message": "Documento enviado para análise"}

@router.get("/documents")
async def get_my_documents(request: Request):
    """Obter documentos do parceiro"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    docs = await db.partner_documents.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0, "file_data": 0}  # Exclude base64 from listing
    ).sort("uploaded_at", -1).to_list(50)
    
    return {"documents": docs}

@router.get("/documents/{doc_id}")
async def get_document(request: Request, doc_id: str):
    """Obter documento com dados (para preview)"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    doc = await db.partner_documents.find_one({"document_id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    return doc

# ============ PARTNER MENU MANAGEMENT ============

@router.get("/menu-items")
async def get_partner_menu_items(request: Request):
    """Parceiro: listar itens do menu"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    # Get restaurant linked to this partner
    restaurant = await db.restaurants.find_one({"partner_id": partner["partner_id"]}, {"_id": 0})
    if not restaurant:
        # Auto-create restaurant for partner
        rest_id = f"rest_{uuid.uuid4().hex[:8]}"
        restaurant = {
            "restaurant_id": rest_id,
            "partner_id": partner["partner_id"],
            "name": partner["business_name"],
            "description": f"Restaurante gerido por {partner['business_name']}",
            "cuisine_type": "Angolana",
            "rating": 0.0,
            "review_count": 0,
            "delivery_time": "30-45 min",
            "delivery_fee": 500,
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.restaurants.insert_one(restaurant)
    
    menu_items = await db.menu_items.find(
        {"restaurant_id": restaurant["restaurant_id"]},
        {"_id": 0}
    ).to_list(200)
    
    return {"restaurant": {k: v for k, v in restaurant.items() if k != "_id"}, "menu_items": menu_items}

@router.post("/menu-items")
async def create_menu_item(request: Request, item_data: dict):
    """Parceiro: adicionar item ao menu"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    restaurant = await db.restaurants.find_one({"partner_id": partner["partner_id"]}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado. Aceda primeiro à lista de menu.")
    
    item_id = f"item_{uuid.uuid4().hex[:8]}"
    item_doc = {
        "item_id": item_id,
        "restaurant_id": restaurant["restaurant_id"],
        "partner_id": partner["partner_id"],
        "name": item_data.get("name", ""),
        "description": item_data.get("description", ""),
        "price": float(item_data.get("price", 0)),
        "category": item_data.get("category", "Principal"),
        "image": item_data.get("image", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=srgb&fm=jpg&q=85"),
        "available": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.menu_items.insert_one(item_doc)
    return {k: v for k, v in item_doc.items() if k != "_id"}

@router.put("/menu-items/{item_id}")
async def update_menu_item(request: Request, item_id: str, item_data: dict):
    """Parceiro: editar item do menu"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    item = await db.menu_items.find_one({"item_id": item_id, "partner_id": partner["partner_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    update_fields = {}
    for field in ["name", "description", "price", "category", "image", "available"]:
        if field in item_data:
            update_fields[field] = item_data[field]
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.menu_items.update_one({"item_id": item_id}, {"$set": update_fields})
    
    updated = await db.menu_items.find_one({"item_id": item_id}, {"_id": 0})
    return updated

@router.delete("/menu-items/{item_id}")
async def delete_menu_item(request: Request, item_id: str):
    """Parceiro: remover item do menu"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    result = await db.menu_items.delete_one({"item_id": item_id, "partner_id": partner["partner_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    return {"message": "Item removido com sucesso"}

# ============ PARTNER ORDER MANAGEMENT ============

@router.get("/incoming-orders")
async def get_incoming_orders(request: Request, status: str = None):
    """Parceiro: ver pedidos recebidos"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    restaurant = await db.restaurants.find_one({"partner_id": partner["partner_id"]}, {"_id": 0})
    if not restaurant:
        return {"orders": [], "total": 0}
    
    query = {"restaurant_id": restaurant["restaurant_id"]}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {"orders": orders, "total": len(orders)}

@router.patch("/incoming-orders/{order_id}")
async def update_incoming_order(request: Request, order_id: str, status_data: dict):
    """Parceiro: atualizar status do pedido"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    
    new_status = status_data.get("status")
    valid = ["confirmado", "preparando", "a_caminho", "entregue", "cancelado"]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use: {', '.join(valid)}")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": new_status, "status_updated_at": now},
         "$push": {"status_history": {"status": new_status, "updated_at": now, "updated_by": user_id}}}
    )
    
    # Create notification for customer
    from notifications_module import create_notification
    status_labels = {"confirmado": "confirmado", "preparando": "em preparação", "a_caminho": "a caminho", "entregue": "entregue", "cancelado": "cancelado"}
    await create_notification(
        order["user_id"],
        f"Pedido {new_status.replace('_', ' ')}",
        f"O seu pedido em {order.get('restaurant_name', '')} está {status_labels.get(new_status, new_status)}",
        "order_status",
        order_id
    )
    
    return {"order_id": order_id, "status": new_status, "message": f"Pedido atualizado para {new_status}"}
