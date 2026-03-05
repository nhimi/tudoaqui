"""
Unified Wallet Module - Carteira Unificada TudoAqui
Sistema central de pagamentos para todos os módulos
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/wallet", tags=["Wallet"])

# ==================== MODELS ====================

class WalletTopUp(BaseModel):
    amount: int = Field(ge=100)
    payment_method: str = "transfer"  # transfer, multicaixa, card
    reference: str

class WalletTransfer(BaseModel):
    to_user_id: str
    amount: int = Field(ge=100)
    description: Optional[str] = None

class WalletPayment(BaseModel):
    amount: int = Field(ge=1)
    order_type: str  # tuendi, restaurant, tourism, property
    order_id: str
    description: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

async def get_current_user_id(request: Request) -> str:
    """Get current user ID from request using server auth"""
    from server import get_current_user
    return await get_current_user(request)

async def get_or_create_wallet(db, user_id: str) -> dict:
    """Get or create user wallet"""
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    if not wallet:
        wallet = {
            "wallet_id": f"wallet_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "balance": 0,
            "pending_balance": 0,
            "total_deposited": 0,
            "total_spent": 0,
            "currency": "AOA",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await db.wallets.insert_one(wallet)
        wallet.pop("_id", None)
    
    return wallet

async def add_wallet_transaction(db, user_id: str, txn_type: str, amount: int, description: str, reference: str = None, order_type: str = None, order_id: str = None):
    """Add a wallet transaction"""
    txn = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "type": txn_type,  # deposit, withdraw, payment, refund, transfer_in, transfer_out, reward, cashback
        "amount": amount,
        "description": description,
        "reference": reference,
        "order_type": order_type,
        "order_id": order_id,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat()
    }
    await db.wallet_transactions.insert_one(txn)
    txn.pop("_id", None)
    return txn

# ==================== API ENDPOINTS ====================

@router.get("")
async def get_wallet(request: Request):
    """Get user wallet with recent transactions"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    wallet = await get_or_create_wallet(db, user_id)
    
    # Get recent transactions
    transactions = await db.wallet_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(30).to_list(30)
    
    # Get spending by category (last 30 days)
    from datetime import timedelta
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "type": "payment",
            "created_at": {"$gte": thirty_days_ago}
        }},
        {"$group": {
            "_id": "$order_type",
            "total": {"$sum": "$amount"}
        }}
    ]
    
    spending_by_category = {}
    async for doc in db.wallet_transactions.aggregate(pipeline):
        spending_by_category[doc["_id"] or "other"] = abs(doc["total"])
    
    return {
        "wallet": wallet,
        "transactions": transactions,
        "spending_summary": {
            "by_category": spending_by_category,
            "total_30_days": sum(spending_by_category.values())
        }
    }

@router.get("/balance")
async def get_balance(request: Request):
    """Get wallet balance only"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    wallet = await get_or_create_wallet(db, user_id)
    
    return {
        "balance": wallet["balance"],
        "pending_balance": wallet.get("pending_balance", 0),
        "currency": wallet.get("currency", "AOA")
    }

@router.post("/topup")
async def topup_wallet(request: Request, data: WalletTopUp):
    """Add money to wallet"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    wallet = await get_or_create_wallet(db, user_id)
    
    # Update wallet balance
    await db.wallets.update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "balance": data.amount,
                "total_deposited": data.amount
            },
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        }
    )
    
    # Record transaction
    txn = await add_wallet_transaction(
        db, user_id, "deposit", data.amount,
        f"Carregamento via {data.payment_method}",
        reference=data.reference
    )
    
    # Get updated wallet
    updated_wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    # Add points for deposit (1 point per 100 Kz)
    points_earned = data.amount // 100
    if points_earned > 0:
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"points": points_earned}}
        )
    
    return {
        "message": f"Carteira carregada com sucesso! +{points_earned} pontos",
        "wallet": updated_wallet,
        "transaction": txn,
        "points_earned": points_earned
    }

@router.post("/pay")
async def make_payment(request: Request, data: WalletPayment):
    """Make a payment from wallet"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    wallet = await get_or_create_wallet(db, user_id)
    
    if wallet["balance"] < data.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Deduct from wallet
    await db.wallets.update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "balance": -data.amount,
                "total_spent": data.amount
            },
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        }
    )
    
    # Record transaction
    txn = await add_wallet_transaction(
        db, user_id, "payment", -data.amount,
        data.description or f"Pagamento {data.order_type}",
        order_type=data.order_type,
        order_id=data.order_id
    )
    
    # Add points for payment (1 point per 50 Kz spent)
    points_earned = data.amount // 50
    if points_earned > 0:
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"points": points_earned, "total_orders": 1, "total_spent": data.amount}}
        )
    
    updated_wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "message": "Pagamento efetuado com sucesso!",
        "wallet": updated_wallet,
        "transaction": txn,
        "points_earned": points_earned
    }

@router.post("/transfer")
async def transfer_funds(request: Request, data: WalletTransfer):
    """Transfer funds to another user"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    if user_id == data.to_user_id:
        raise HTTPException(status_code=400, detail="Não pode transferir para si mesmo")
    
    # Check recipient exists
    recipient = await db.users.find_one({"user_id": data.to_user_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinatário não encontrado")
    
    wallet = await get_or_create_wallet(db, user_id)
    
    if wallet["balance"] < data.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Deduct from sender
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": -data.amount}}
    )
    
    # Add to recipient
    recipient_wallet = await get_or_create_wallet(db, data.to_user_id)
    await db.wallets.update_one(
        {"user_id": data.to_user_id},
        {"$inc": {"balance": data.amount}}
    )
    
    # Record transactions
    await add_wallet_transaction(
        db, user_id, "transfer_out", -data.amount,
        f"Transferência para {recipient['name']}",
        reference=data.to_user_id
    )
    
    sender = await db.users.find_one({"user_id": user_id})
    await add_wallet_transaction(
        db, data.to_user_id, "transfer_in", data.amount,
        f"Transferência de {sender['name']}",
        reference=user_id
    )
    
    # Notify recipient
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": data.to_user_id,
        "title": "Transferência Recebida! 💰",
        "message": f"Você recebeu {data.amount} Kz de {sender['name']}",
        "type": "wallet",
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    })
    
    updated_wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "message": f"Transferência de {data.amount} Kz enviada com sucesso!",
        "wallet": updated_wallet
    }

@router.post("/refund")
async def process_refund(request: Request, data: dict):
    """Process a refund to wallet (internal use)"""
    db = request.app.state.db
    user_id = data.get("user_id")
    amount = data.get("amount")
    reason = data.get("reason", "Reembolso")
    order_id = data.get("order_id")
    
    if not user_id or not amount:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    
    await get_or_create_wallet(db, user_id)
    
    # Add refund to wallet
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": amount}}
    )
    
    # Record transaction
    txn = await add_wallet_transaction(
        db, user_id, "refund", amount,
        reason,
        order_id=order_id
    )
    
    # Notify user
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "title": "Reembolso Processado! 💰",
        "message": f"Você recebeu um reembolso de {amount} Kz. Motivo: {reason}",
        "type": "wallet",
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    })
    
    return {"message": "Reembolso processado", "transaction": txn}

@router.get("/transactions")
async def get_transactions(request: Request, limit: int = 50, offset: int = 0, type: str = None):
    """Get wallet transactions with filters"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    query = {"user_id": user_id}
    if type:
        query["type"] = type
    
    transactions = await db.wallet_transactions.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.wallet_transactions.count_documents(query)
    
    return {
        "transactions": transactions,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/stats")
async def get_wallet_stats(request: Request):
    """Get wallet statistics"""
    db = request.app.state.db
    user_id = await get_current_user_id(request)
    
    wallet = await get_or_create_wallet(db, user_id)
    
    # Monthly spending
    from datetime import timedelta
    now = datetime.utcnow()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    month_payments = await db.wallet_transactions.find({
        "user_id": user_id,
        "type": "payment",
        "created_at": {"$gte": first_day_of_month.isoformat()}
    }).to_list(1000)
    
    monthly_spent = sum(abs(p["amount"]) for p in month_payments)
    
    # Category breakdown
    category_spending = {}
    for p in month_payments:
        cat = p.get("order_type", "other")
        category_spending[cat] = category_spending.get(cat, 0) + abs(p["amount"])
    
    return {
        "balance": wallet["balance"],
        "total_deposited": wallet.get("total_deposited", 0),
        "total_spent": wallet.get("total_spent", 0),
        "monthly_spent": monthly_spent,
        "category_breakdown": category_spending,
        "transactions_count": await db.wallet_transactions.count_documents({"user_id": user_id})
    }
