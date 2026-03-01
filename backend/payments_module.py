"""
Módulo de Pagamentos por Transferência Bancária
Sistema temporário com código de confirmação
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import random
import string

router = APIRouter(prefix="/payments", tags=["payments"])

# Dados bancários de exemplo para transferência
BANK_ACCOUNTS = {
    "multicaixa": {
        "bank": "Banco BAI",
        "account_name": "TudoAqui Marketplace LDA",
        "iban": "AO06 0040 0000 8574 3210 1018 7",
        "account_number": "857432101018",
        "nif": "5417892301",
        "swift": "BAIAAOLU"
    },
    "bai_paga": {
        "bank": "Banco BAI",
        "account_name": "TudoAqui Marketplace LDA",
        "iban": "AO06 0040 0000 8574 3210 1018 7",
        "account_number": "857432101018",
        "nif": "5417892301",
        "swift": "BAIAAOLU"
    },
    "unitel_money": {
        "bank": "Unitel Money",
        "account_name": "TudoAqui Marketplace",
        "phone": "+244 923 456 789",
        "nif": "5417892301"
    },
    "transferencia": {
        "bank": "Banco BAI",
        "account_name": "TudoAqui Marketplace LDA",
        "iban": "AO06 0040 0000 8574 3210 1018 7",
        "account_number": "857432101018",
        "nif": "5417892301",
        "swift": "BAIAAOLU"
    }
}

def generate_confirmation_code():
    """Gerar código de confirmação único de 8 caracteres"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

@router.get("/bank-accounts")
async def get_bank_accounts(request: Request):
    """Obter dados bancários para transferência"""
    await get_current_user(request)
    return {"bank_accounts": BANK_ACCOUNTS}

@router.post("/create")
async def create_payment(request: Request, payment_data: dict):
    """Criar pagamento pendente e gerar código de confirmação"""
    user_id = await get_current_user(request)
    db = await get_db()

    amount = payment_data.get("amount", 0)
    payment_method = payment_data.get("payment_method", "transferencia")
    reference_type = payment_data.get("reference_type", "order")
    reference_id = payment_data.get("reference_id", "")
    description = payment_data.get("description", "")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Valor inválido")

    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    confirmation_code = generate_confirmation_code()

    bank_info = BANK_ACCOUNTS.get(payment_method, BANK_ACCOUNTS["transferencia"])

    payment_doc = {
        "payment_id": payment_id,
        "user_id": user_id,
        "amount": amount,
        "payment_method": payment_method,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "description": description,
        "confirmation_code": confirmation_code,
        "status": "pendente",
        "bank_info": bank_info,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "confirmed_at": None,
        "expires_at": None
    }

    await db.payments.insert_one(payment_doc)

    return {
        "payment_id": payment_id,
        "confirmation_code": confirmation_code,
        "amount": amount,
        "status": "pendente",
        "bank_info": bank_info,
        "message": f"Faça a transferência de {amount} Kz e use o código {confirmation_code} para confirmar"
    }

@router.post("/confirm")
async def confirm_payment(request: Request, confirm_data: dict):
    """Confirmar pagamento com código de confirmação"""
    user_id = await get_current_user(request)
    db = await get_db()

    payment_id = confirm_data.get("payment_id", "")
    confirmation_code = confirm_data.get("confirmation_code", "")

    payment = await db.payments.find_one(
        {"payment_id": payment_id, "user_id": user_id},
        {"_id": 0}
    )

    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    if payment["status"] != "pendente":
        raise HTTPException(status_code=400, detail=f"Pagamento já está {payment['status']}")

    if payment["confirmation_code"] != confirmation_code.upper().strip():
        raise HTTPException(status_code=400, detail="Código de confirmação inválido")

    now = datetime.now(timezone.utc).isoformat()

    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {"status": "confirmado", "confirmed_at": now}}
    )

    # Update the referenced entity status
    ref_type = payment.get("reference_type")
    ref_id = payment.get("reference_id")

    if ref_type == "order" and ref_id:
        await db.orders.update_one(
            {"order_id": ref_id},
            {"$set": {"status": "pago", "payment_status": "confirmado", "payment_id": payment_id}}
        )
    elif ref_type == "booking" and ref_id:
        await db.bookings.update_one(
            {"booking_id": ref_id},
            {"$set": {"status": "pago", "payment_status": "confirmado", "payment_id": payment_id}}
        )

    return {
        "payment_id": payment_id,
        "status": "confirmado",
        "confirmed_at": now,
        "message": "Pagamento confirmado com sucesso!"
    }

@router.get("/my-payments")
async def get_my_payments(request: Request, status: Optional[str] = None):
    """Listar pagamentos do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()

    query = {"user_id": user_id}
    if status:
        query["status"] = status

    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"payments": payments}

@router.get("/{payment_id}")
async def get_payment(request: Request, payment_id: str):
    """Obter detalhes de um pagamento"""
    user_id = await get_current_user(request)
    db = await get_db()

    payment = await db.payments.find_one(
        {"payment_id": payment_id, "user_id": user_id},
        {"_id": 0}
    )

    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    return payment

@router.get("/partner/pending")
async def get_partner_pending_payments(request: Request):
    """Parceiro: ver pagamentos pendentes de verificação"""
    user_id = await get_current_user(request)
    db = await get_db()

    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros")

    payments = await db.payments.find(
        {"status": "confirmado"},
        {"_id": 0}
    ).sort("confirmed_at", -1).to_list(50)

    return {"payments": payments}

@router.post("/partner/verify")
async def partner_verify_payment(request: Request, verify_data: dict):
    """Parceiro: verificar pagamento recebido"""
    user_id = await get_current_user(request)
    db = await get_db()

    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros")

    payment_id = verify_data.get("payment_id")
    action = verify_data.get("action", "approve")

    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    new_status = "verificado" if action == "approve" else "rejeitado"

    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "status": new_status,
            "verified_by": partner["partner_id"],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {"payment_id": payment_id, "status": new_status, "message": f"Pagamento {new_status}"}
