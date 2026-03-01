"""
Módulo de Notificações
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import uuid
import os

router = APIRouter(prefix="/notifications", tags=["notifications"])

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

NOTIFICATION_TYPES = {
    "order_status": {"icon": "package", "color": "#2A9D8F"},
    "payment": {"icon": "credit-card", "color": "#D62828"},
    "partner": {"icon": "briefcase", "color": "#FCBF49"},
    "system": {"icon": "bell", "color": "#1A1A1A"},
    "promotion": {"icon": "tag", "color": "#6C63FF"}
}

async def create_notification(user_id: str, title: str, message: str, notif_type: str = "system", reference_id: str = None):
    """Helper para criar notificação (chamado internamente)"""
    db_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = db_client[os.environ['DB_NAME']]
    
    notif_doc = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "reference_id": reference_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    return notif_doc["notification_id"]

@router.get("/")
async def get_notifications(request: Request, unread_only: bool = False, limit: int = 30):
    """Obter notificações do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    unread_count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@router.post("/{notification_id}/read")
async def mark_as_read(request: Request, notification_id: str):
    """Marcar notificação como lida"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user_id},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"notification_id": notification_id, "read": True}

@router.post("/read-all")
async def mark_all_as_read(request: Request):
    """Marcar todas como lidas"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"marked_count": result.modified_count}
