"""
WebSocket Module - Real-time tracking, chat and notifications
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Dict, Set
import json
import uuid
import os
import asyncio
import random
import math

router = APIRouter(tags=["websocket"])


async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class ConnectionManager:
    """Manages WebSocket connections per user"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.ride_tracking: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[user_id].discard(ws)

    async def track_ride(self, websocket: WebSocket, ride_id: str):
        if ride_id not in self.ride_tracking:
            self.ride_tracking[ride_id] = set()
        self.ride_tracking[ride_id].add(websocket)

    def untrack_ride(self, websocket: WebSocket, ride_id: str):
        if ride_id in self.ride_tracking:
            self.ride_tracking[ride_id].discard(websocket)

    async def broadcast_ride_update(self, ride_id: str, message: dict):
        if ride_id in self.ride_tracking:
            dead = []
            for ws in self.ride_tracking[ride_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.ride_tracking[ride_id].discard(ws)


manager = ConnectionManager()


def simulate_driver_position(base_lat, base_lng, dest_lat, dest_lng, progress):
    """Simulate driver moving from base to destination"""
    lat = base_lat + (dest_lat - base_lat) * progress
    lng = base_lng + (dest_lng - base_lng) * progress
    lat += random.uniform(-0.001, 0.001)
    lng += random.uniform(-0.001, 0.001)
    return round(lat, 6), round(lng, 6)


@router.websocket("/ws/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: str):
    """WebSocket for real-time notifications"""
    await manager.connect(websocket, user_id)
    db = await get_db()

    try:
        unread = await db.notifications.count_documents({"user_id": user_id, "read": False})
        await websocket.send_json({
            "type": "init",
            "unread_count": unread
        })

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("action") == "mark_read":
                notif_id = msg.get("notification_id")
                if notif_id:
                    await db.notifications.update_one(
                        {"notification_id": notif_id, "user_id": user_id},
                        {"$set": {"read": True}}
                    )
                    unread = await db.notifications.count_documents({"user_id": user_id, "read": False})
                    await websocket.send_json({
                        "type": "unread_update",
                        "unread_count": unread
                    })

            elif msg.get("action") == "mark_all_read":
                await db.notifications.update_many(
                    {"user_id": user_id, "read": False},
                    {"$set": {"read": True}}
                )
                await websocket.send_json({
                    "type": "unread_update",
                    "unread_count": 0
                })

            elif msg.get("action") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@router.websocket("/ws/ride/{ride_id}")
async def ws_ride_tracking(websocket: WebSocket, ride_id: str):
    """WebSocket for real-time ride tracking with simulated driver position"""
    await websocket.accept()
    db = await get_db()

    ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        await websocket.send_json({"type": "error", "message": "Corrida nao encontrada"})
        await websocket.close()
        return

    await manager.track_ride(websocket, ride_id)
    progress = 0.0

    try:
        await websocket.send_json({
            "type": "ride_state",
            "ride": {k: v for k, v in ride.items() if k != "_id"},
            "driver_position": None
        })

        pickup_lat = ride.get("pickup_lat", -8.8383)
        pickup_lng = ride.get("pickup_lng", 13.2344)
        dest_lat = ride.get("dest_lat", -8.85)
        dest_lng = ride.get("dest_lng", 13.25)

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=2.0)
                msg = json.loads(data)

                if msg.get("action") == "cancel":
                    await db.rides.update_one(
                        {"ride_id": ride_id},
                        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    await websocket.send_json({"type": "ride_cancelled"})
                    break

                elif msg.get("action") == "ping":
                    await websocket.send_json({"type": "pong"})

            except asyncio.TimeoutError:
                pass

            ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
            if not ride or ride.get("status") in ["completed", "cancelled", "concluido", "cancelado"]:
                await websocket.send_json({
                    "type": "ride_ended",
                    "status": ride.get("status") if ride else "cancelled"
                })
                break

            status = ride.get("status", "")
            if status in ["accepted", "aceite", "arriving", "in_progress", "em_andamento"]:
                if status in ["accepted", "aceite"]:
                    driver_lat, driver_lng = simulate_driver_position(
                        pickup_lat - 0.01, pickup_lng - 0.01,
                        pickup_lat, pickup_lng,
                        min(1.0, progress)
                    )
                else:
                    driver_lat, driver_lng = simulate_driver_position(
                        pickup_lat, pickup_lng,
                        dest_lat, dest_lng,
                        min(1.0, progress)
                    )

                progress += random.uniform(0.02, 0.06)

                await websocket.send_json({
                    "type": "position_update",
                    "driver_position": {"lat": driver_lat, "lng": driver_lng},
                    "status": status,
                    "progress": min(1.0, progress),
                    "eta_minutes": max(1, int((1 - min(1.0, progress)) * ride.get("estimated_duration", 15)))
                })

    except WebSocketDisconnect:
        pass
    finally:
        manager.untrack_ride(websocket, ride_id)


@router.websocket("/ws/chat/{ride_id}")
async def ws_chat(websocket: WebSocket, ride_id: str):
    """WebSocket for real-time chat during ride"""
    await websocket.accept()
    db = await get_db()

    ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        await websocket.send_json({"type": "error", "message": "Corrida nao encontrada"})
        await websocket.close()
        return

    messages = await db.ride_chat.find(
        {"ride_id": ride_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    await websocket.send_json({
        "type": "chat_history",
        "messages": messages
    })

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("action") == "send_message":
                chat_msg = {
                    "message_id": f"msg_{uuid.uuid4().hex[:10]}",
                    "ride_id": ride_id,
                    "sender_type": msg.get("sender_type", "user"),
                    "sender_name": msg.get("sender_name", ""),
                    "content": msg.get("content", ""),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }

                await db.ride_chat.insert_one(chat_msg)

                await websocket.send_json({
                    "type": "new_message",
                    "message": {k: v for k, v in chat_msg.items() if k != "_id"}
                })

                if msg.get("sender_type") == "user":
                    await asyncio.sleep(1.5)
                    auto_replies = [
                        "Estou a caminho!",
                        "Chego em poucos minutos.",
                        "OK, entendido!",
                        "Sem problema!",
                        "Estou quase a chegar."
                    ]
                    reply = {
                        "message_id": f"msg_{uuid.uuid4().hex[:10]}",
                        "ride_id": ride_id,
                        "sender_type": "driver",
                        "sender_name": ride.get("driver_name", "Motorista"),
                        "content": random.choice(auto_replies),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.ride_chat.insert_one(reply)
                    await websocket.send_json({
                        "type": "new_message",
                        "message": {k: v for k, v in reply.items() if k != "_id"}
                    })

            elif msg.get("action") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass


async def push_notification(user_id: str, title: str, message: str, notif_type: str = "system", reference_id: str = None):
    """Push a real-time notification to a connected user"""
    db = await get_db()

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

    await manager.send_to_user(user_id, {
        "type": "notification",
        "notification": {k: v for k, v in notif_doc.items() if k != "_id"}
    })

    return notif_doc["notification_id"]
