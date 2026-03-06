"""
Restaurants Module - Restaurantes, menus, pedidos e avaliacoes
Extraido de server.py para melhor organizacao
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(tags=["restaurants"])


async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)


class Restaurant(BaseModel):
    restaurant_id: str
    name: str
    description: str
    image: str
    cuisine_type: str
    rating: float
    delivery_time: str
    delivery_fee: float


class MenuItem(BaseModel):
    item_id: str
    restaurant_id: str
    name: str
    description: str
    price: float
    image: str
    category: str


class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int


class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[OrderItem]
    delivery_address: str
    payment_method: str
    notes: Optional[str] = None


class Order(BaseModel):
    order_id: str
    user_id: str
    restaurant_id: str
    restaurant_name: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    delivery_address: str
    payment_method: str
    status: str
    notes: Optional[str] = None
    created_at: str


# ============ RESTAURANTES ============

@router.get("/restaurants/search")
async def search_restaurants(request: Request, q: Optional[str] = None, cuisine: Optional[str] = None):
    await get_current_user(request)
    db = await get_db()

    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"cuisine_type": {"$regex": q, "$options": "i"}}
        ]
    if cuisine and cuisine != "all":
        query["cuisine_type"] = {"$regex": cuisine, "$options": "i"}

    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(100)

    all_restaurants = await db.restaurants.find({}, {"_id": 0, "cuisine_type": 1}).to_list(100)
    cuisines = list(set(r["cuisine_type"] for r in all_restaurants))

    return {"restaurants": restaurants, "cuisines": cuisines}


@router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(request: Request):
    await get_current_user(request)
    db = await get_db()

    count = await db.restaurants.count_documents({})

    if count == 0:
        sample_restaurants = [
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Restaurante Ilha",
                "description": "Culinaria tradicional angolana com frutos do mar",
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Angolana",
                "rating": 4.7,
                "delivery_time": "30-40 min",
                "delivery_fee": 350.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Mano Grill",
                "description": "Churrasco e carnes grelhadas",
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Churrasco",
                "rating": 4.5,
                "delivery_time": "25-35 min",
                "delivery_fee": 300.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Tupuca Express",
                "description": "Refeicoes rapidas e lanches",
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Fast Food",
                "rating": 4.3,
                "delivery_time": "15-25 min",
                "delivery_fee": 200.0
            },
            {
                "restaurant_id": f"rest_{uuid.uuid4().hex[:8]}",
                "name": "Sabor da Terra",
                "description": "Pratos tradicionais e caseiros",
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "cuisine_type": "Tradicional",
                "rating": 4.8,
                "delivery_time": "35-45 min",
                "delivery_fee": 400.0
            }
        ]

        await db.restaurants.insert_many(sample_restaurants)
        return sample_restaurants

    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(100)
    return restaurants


@router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_restaurant_menu(request: Request, restaurant_id: str):
    await get_current_user(request)
    db = await get_db()

    count = await db.menu_items.count_documents({"restaurant_id": restaurant_id})

    if count == 0:
        sample_items = [
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Muamba de Galinha",
                "description": "Frango cozido com quiabo e dende",
                "price": 2500.0,
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Prato Principal"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Calulu",
                "description": "Peixe seco com vegetais",
                "price": 2800.0,
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Prato Principal"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Funge",
                "description": "Acompanhamento tradicional",
                "price": 500.0,
                "image": "https://images.unsplash.com/photo-1734866689982-2afd07eb149a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Acompanhamentos"
            },
            {
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "restaurant_id": restaurant_id,
                "name": "Sumo Natural",
                "description": "Suco de frutas frescas",
                "price": 800.0,
                "image": "https://images.unsplash.com/photo-1582308281127-44c931038160?crop=entropy&cs=srgb&fm=jpg&q=85",
                "category": "Bebidas"
            }
        ]

        await db.menu_items.insert_many(sample_items)
        return sample_items

    items = await db.menu_items.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(100)
    return items


# ============ PEDIDOS ============

@router.post("/orders", response_model=Order)
async def create_order(request: Request, order_data: OrderCreate):
    user_id = await get_current_user(request)
    db = await get_db()

    restaurant = await db.restaurants.find_one({"restaurant_id": order_data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    subtotal = sum(item.price * item.quantity for item in order_data.items)
    delivery_fee = restaurant["delivery_fee"]

    config = await db.system_config.find_one({"config_id": "main"}, {"_id": 0})
    iva_settings = config.get("iva_settings", {"enabled": False, "rate": 14.0}) if config else {"enabled": False, "rate": 14.0}

    iva_amount = 0
    if iva_settings.get("enabled"):
        iva_amount = round(subtotal * (iva_settings["rate"] / 100), 2)

    total = subtotal + delivery_fee + iva_amount

    order_id = f"order_{uuid.uuid4().hex[:10]}"

    order_doc = {
        "order_id": order_id,
        "user_id": user_id,
        "restaurant_id": order_data.restaurant_id,
        "restaurant_name": restaurant["name"],
        "items": [item.model_dump() for item in order_data.items],
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "iva_amount": iva_amount,
        "iva_rate": iva_settings["rate"] if iva_settings.get("enabled") else 0,
        "total": total,
        "delivery_address": order_data.delivery_address,
        "payment_method": order_data.payment_method,
        "status": "confirmado",
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.orders.insert_one(order_doc)

    return Order(**order_doc)


@router.get("/orders", response_model=List[Order])
async def get_orders(request: Request):
    user_id = await get_current_user(request)
    db = await get_db()

    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

    return orders


@router.patch("/orders/{order_id}/status")
async def update_order_status(request: Request, order_id: str, status_data: dict):
    """Atualizar status do pedido (para tracking)"""
    user_id = await get_current_user(request)
    db = await get_db()

    new_status = status_data.get("status")
    valid_statuses = ["confirmado", "pago", "preparando", "a_caminho", "entregue", "cancelado"]

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status invalido. Use: {', '.join(valid_statuses)}")

    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")

    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": new_status,
            "status_updated_at": datetime.now(timezone.utc).isoformat()
        },
        "$push": {
            "status_history": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": user_id
            }
        }}
    )

    if new_status == "entregue":
        total = order.get("total", 0)
        points_earned = max(1, int(total // 50))

        await db.users.update_one(
            {"user_id": order["user_id"]},
            {"$inc": {"points": points_earned, "total_orders": 1, "total_spent": total}}
        )

        await db.wallet_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:10]}",
            "user_id": order["user_id"],
            "type": "payment",
            "amount": -total,
            "description": f"Pedido {order.get('restaurant_name', '')}",
            "order_type": "restaurant",
            "order_id": order_id,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": order["user_id"],
            "title": "Pedido Entregue!",
            "message": f"Seu pedido de {order.get('restaurant_name', '')} foi entregue. +{points_earned} pontos!",
            "type": "order_delivered",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    return {"order_id": order_id, "status": new_status, "message": f"Status atualizado para {new_status}"}


# ============ AVALIACOES / REVIEWS ============

@router.post("/reviews")
async def create_review(request: Request, review_data: dict):
    """Criar avaliacao de restaurante"""
    user_id = await get_current_user(request)
    db = await get_db()

    restaurant_id = review_data.get("restaurant_id")
    rating = review_data.get("rating", 0)
    comment = review_data.get("comment", "")

    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id obrigatorio")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Avaliacao deve ser entre 1 e 5")

    restaurant = await db.restaurants.find_one({"restaurant_id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurante nao encontrado")

    existing = await db.reviews.find_one({"user_id": user_id, "restaurant_id": restaurant_id})
    if existing:
        await db.reviews.update_one(
            {"user_id": user_id, "restaurant_id": restaurant_id},
            {"$set": {"rating": rating, "comment": comment, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Avaliacao atualizada", "rating": rating}

    review_id = f"review_{uuid.uuid4().hex[:10]}"
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})

    review_doc = {
        "review_id": review_id,
        "user_id": user_id,
        "user_name": user_doc.get("name", "Anonimo") if user_doc else "Anonimo",
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant["name"],
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.reviews.insert_one(review_doc)

    all_reviews = await db.reviews.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.restaurants.update_one(
        {"restaurant_id": restaurant_id},
        {"$set": {"rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )

    return {"review_id": review_id, "message": "Avaliacao enviada", "rating": rating}


@router.get("/reviews/{restaurant_id}")
async def get_restaurant_reviews(request: Request, restaurant_id: str):
    """Obter avaliacoes de um restaurante"""
    await get_current_user(request)
    db = await get_db()

    reviews = await db.reviews.find({"restaurant_id": restaurant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

    avg_rating = 0
    if reviews:
        avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)

    return {
        "reviews": reviews,
        "total": len(reviews),
        "average_rating": avg_rating
    }
