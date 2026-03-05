"""
Sistema de Streak Diário - TudoAqui
Recompensas por uso consecutivo do app
Multiplicadores: dia 3 = 2x, dia 7 = 3x, dia 14 = 5x, dia 30 = 10x
"""

from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/streak", tags=["streak"])

STREAK_MILESTONES = [
    {"days": 3, "multiplier": 2, "bonus_points": 50, "label": "3 dias seguidos!"},
    {"days": 7, "multiplier": 3, "bonus_points": 150, "label": "1 semana!"},
    {"days": 14, "multiplier": 5, "bonus_points": 400, "label": "2 semanas!"},
    {"days": 30, "multiplier": 10, "bonus_points": 1000, "label": "1 mês!"},
]

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

async def check_and_update_streak(db, user_id: str):
    """Check and update user's daily streak. Called on login/activity."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    streak_doc = await db.user_streaks.find_one({"user_id": user_id}, {"_id": 0})
    
    if not streak_doc:
        streak_doc = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_check_in": today,
            "total_check_ins": 1,
            "points_earned_today": 0,
            "multiplier": 1,
            "milestones_claimed": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_streaks.insert_one(streak_doc)
        streak_doc.pop("_id", None)
        return streak_doc, False
    
    last_check = streak_doc.get("last_check_in", "")
    
    if last_check == today:
        return streak_doc, False
    
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    if last_check == yesterday:
        new_streak = streak_doc.get("current_streak", 0) + 1
    else:
        new_streak = 1
    
    longest = max(streak_doc.get("longest_streak", 0), new_streak)
    
    # Calculate current multiplier
    multiplier = 1
    for m in STREAK_MILESTONES:
        if new_streak >= m["days"]:
            multiplier = m["multiplier"]
    
    update = {
        "current_streak": new_streak,
        "longest_streak": longest,
        "last_check_in": today,
        "total_check_ins": streak_doc.get("total_check_ins", 0) + 1,
        "points_earned_today": 0,
        "multiplier": multiplier,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_streaks.update_one(
        {"user_id": user_id},
        {"$set": update}
    )
    
    # Check for milestone bonus
    bonus_awarded = False
    claimed = streak_doc.get("milestones_claimed", [])
    for m in STREAK_MILESTONES:
        if new_streak == m["days"] and m["days"] not in claimed:
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"points": m["bonus_points"]}}
            )
            await db.user_streaks.update_one(
                {"user_id": user_id},
                {"$push": {"milestones_claimed": m["days"]}}
            )
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
                "user_id": user_id,
                "title": f"Streak {m['label']}",
                "message": f"Parabéns! {new_streak} dias consecutivos! +{m['bonus_points']} pontos bónus! Multiplicador: {m['multiplier']}x",
                "type": "streak_milestone",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            bonus_awarded = True
            break
    
    update["milestones_claimed"] = claimed
    if bonus_awarded:
        for m in STREAK_MILESTONES:
            if new_streak == m["days"]:
                update["milestones_claimed"].append(m["days"])
                break
    
    return {**streak_doc, **update}, True

@router.get("/")
async def get_streak(request: Request):
    """Obter informações do streak do utilizador"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    streak_doc, is_new_day = await check_and_update_streak(db, user_id)
    
    # Calculate next milestone
    current = streak_doc.get("current_streak", 0)
    next_milestone = None
    for m in STREAK_MILESTONES:
        if current < m["days"]:
            next_milestone = {
                "days": m["days"],
                "days_remaining": m["days"] - current,
                "bonus_points": m["bonus_points"],
                "multiplier": m["multiplier"],
                "label": m["label"]
            }
            break
    
    return {
        "current_streak": streak_doc.get("current_streak", 0),
        "longest_streak": streak_doc.get("longest_streak", 0),
        "multiplier": streak_doc.get("multiplier", 1),
        "total_check_ins": streak_doc.get("total_check_ins", 0),
        "is_new_day": is_new_day,
        "next_milestone": next_milestone,
        "milestones": STREAK_MILESTONES,
        "milestones_claimed": streak_doc.get("milestones_claimed", [])
    }

@router.post("/checkin")
async def daily_checkin(request: Request):
    """Check-in diário para manter streak"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    streak_doc, is_new_day = await check_and_update_streak(db, user_id)
    
    # Award daily check-in points (base 10, multiplied by streak)
    base_points = 10
    multiplier = streak_doc.get("multiplier", 1)
    points = base_points * multiplier
    
    if is_new_day:
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"points": points}}
        )
        await db.user_streaks.update_one(
            {"user_id": user_id},
            {"$inc": {"points_earned_today": points}}
        )
        return {
            "message": f"Check-in! +{points} pontos (x{multiplier})",
            "points_earned": points,
            "multiplier": multiplier,
            "current_streak": streak_doc.get("current_streak", 1),
            "is_new_day": True
        }
    
    return {
        "message": "Já fez check-in hoje!",
        "points_earned": 0,
        "multiplier": multiplier,
        "current_streak": streak_doc.get("current_streak", 1),
        "is_new_day": False
    }

@router.get("/leaderboard")
async def streak_leaderboard(request: Request):
    """Top 10 streaks"""
    await get_current_user(request)
    db = await get_db(request)
    
    streaks = await db.user_streaks.find(
        {}, {"_id": 0, "user_id": 1, "current_streak": 1, "longest_streak": 1}
    ).sort("current_streak", -1).to_list(10)
    
    leaderboard = []
    for s in streaks:
        user = await db.users.find_one(
            {"user_id": s["user_id"]},
            {"_id": 0, "name": 1, "tier": 1}
        )
        if user:
            leaderboard.append({
                "name": user.get("name", "Anónimo"),
                "tier": user.get("tier", "bronze"),
                "current_streak": s.get("current_streak", 0),
                "longest_streak": s.get("longest_streak", 0)
            })
    
    return {"leaderboard": leaderboard}
