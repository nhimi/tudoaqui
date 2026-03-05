"""
Exportação de Relatórios - TudoAqui
PDF + CSV para admin, parceiros e utilizadores
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
import csv
import io

router = APIRouter(prefix="/reports", tags=["reports"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

def format_kz(amount):
    return f"{amount:,.0f} Kz"

def get_date_range(period: str):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=30)
    return start.isoformat(), now.isoformat()

@router.get("/admin/sales/csv")
async def admin_sales_csv(request: Request, period: str = "month"):
    """Admin: exportar relatório de vendas CSV"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("role") not in ["admin", "super_admin", "financas"]:
        raise HTTPException(status_code=403, detail="Acesso restrito")
    
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5000)
    
    rides = await db.tuendi_rides.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5000)
    
    deliveries = await db.tuendi_deliveries.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Tipo", "ID", "Data", "Cliente", "Descrição", "Valor (Kz)", "Status", "Método Pagamento"])
    
    for o in orders:
        writer.writerow([
            "Pedido", o.get("order_id", ""), o.get("created_at", "")[:10],
            o.get("user_id", ""), o.get("restaurant_name", ""),
            o.get("total", 0), o.get("status", ""), o.get("payment_method", "")
        ])
    
    for r in rides:
        writer.writerow([
            "Corrida", r.get("ride_id", ""), r.get("created_at", "")[:10],
            r.get("user_id", ""), f"{r.get('pickup_address','')} → {r.get('destination_address','')}",
            r.get("price", 0), r.get("status", ""), r.get("payment_method", "cash")
        ])
    
    for d in deliveries:
        writer.writerow([
            "Entrega", d.get("delivery_id", ""), d.get("created_at", "")[:10],
            d.get("user_id", ""), f"{d.get('pickup_address','')} → {d.get('destination_address','')}",
            d.get("price", 0), d.get("status", ""), d.get("payment_method", "cash")
        ])
    
    # Summary rows
    total_orders = sum(o.get("total", 0) for o in orders)
    total_rides = sum(r.get("price", 0) for r in rides)
    total_deliveries = sum(d.get("price", 0) for d in deliveries)
    writer.writerow([])
    writer.writerow(["RESUMO", "", "", "", "", "", "", ""])
    writer.writerow(["Total Pedidos", len(orders), "", "", "", total_orders, "", ""])
    writer.writerow(["Total Corridas", len(rides), "", "", "", total_rides, "", ""])
    writer.writerow(["Total Entregas", len(deliveries), "", "", "", total_deliveries, "", ""])
    writer.writerow(["TOTAL GERAL", len(orders) + len(rides) + len(deliveries), "", "", "", total_orders + total_rides + total_deliveries, "", ""])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vendas_{period}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/admin/sales/summary")
async def admin_sales_summary(request: Request, period: str = "month"):
    """Admin: resumo de vendas (JSON)"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("role") not in ["admin", "super_admin", "financas"]:
        raise HTTPException(status_code=403, detail="Acesso restrito")
    
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}}, {"_id": 0}
    ).to_list(5000)
    
    rides = await db.tuendi_rides.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}}, {"_id": 0}
    ).to_list(5000)
    
    deliveries = await db.tuendi_deliveries.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}}, {"_id": 0}
    ).to_list(5000)
    
    total_orders_val = sum(o.get("total", 0) for o in orders)
    total_rides_val = sum(r.get("price", 0) for r in rides)
    total_deliveries_val = sum(d.get("price", 0) for d in deliveries)
    
    iva_rate = 0.14
    total_revenue = total_orders_val + total_rides_val + total_deliveries_val
    
    # Status breakdown
    order_status = {}
    for o in orders:
        s = o.get("status", "unknown")
        order_status[s] = order_status.get(s, 0) + 1
    
    return {
        "period": period,
        "start_date": start_date[:10],
        "end_date": end_date[:10],
        "orders": {"count": len(orders), "total": total_orders_val, "status": order_status},
        "rides": {"count": len(rides), "total": total_rides_val},
        "deliveries": {"count": len(deliveries), "total": total_deliveries_val},
        "total_revenue": total_revenue,
        "iva_14": round(total_revenue * iva_rate, 2),
        "revenue_after_iva": round(total_revenue * (1 - iva_rate), 2),
        "total_transactions": len(orders) + len(rides) + len(deliveries)
    }

@router.get("/partner/sales/csv")
async def partner_sales_csv(request: Request, period: str = "month"):
    """Parceiro: exportar relatório de vendas CSV"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros")
    
    partner_id = partner["partner_id"]
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"partner_id": partner_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID Pedido", "Data", "Cliente", "Itens", "Subtotal (Kz)", "Taxa Entrega (Kz)", "Total (Kz)", "Status", "Pagamento"])
    
    for o in orders:
        items = ", ".join([f"{i.get('name','')} x{i.get('quantity',1)}" for i in o.get("items", [])])
        writer.writerow([
            o.get("order_id", ""), o.get("created_at", "")[:10],
            o.get("user_id", ""), items,
            o.get("subtotal", 0), o.get("delivery_fee", 0),
            o.get("total", 0), o.get("status", ""), o.get("payment_method", "")
        ])
    
    total = sum(o.get("total", 0) for o in orders)
    writer.writerow([])
    writer.writerow(["TOTAL", "", "", "", "", "", total, "", ""])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vendas_parceiro_{period}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/partner/sales/summary")
async def partner_sales_summary(request: Request, period: str = "month"):
    """Parceiro: resumo de vendas"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros")
    
    partner_id = partner["partner_id"]
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"partner_id": partner_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).to_list(5000)
    
    total = sum(o.get("total", 0) for o in orders)
    completed = [o for o in orders if o.get("status") in ["entregue", "completo"]]
    
    return {
        "period": period,
        "total_orders": len(orders),
        "completed_orders": len(completed),
        "total_revenue": total,
        "completed_revenue": sum(o.get("total", 0) for o in completed),
        "average_order": round(total / len(orders), 2) if orders else 0,
        "iva_14": round(total * 0.14, 2)
    }

@router.get("/user/history/csv")
async def user_history_csv(request: Request, period: str = "month"):
    """Utilizador: exportar histórico de pedidos CSV"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    rides = await db.tuendi_rides.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    deliveries = await db.tuendi_deliveries.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Tipo", "ID", "Data", "Descrição", "Valor (Kz)", "Status"])
    
    for o in orders:
        writer.writerow([
            "Pedido", o.get("order_id", ""), o.get("created_at", "")[:10],
            o.get("restaurant_name", ""), o.get("total", 0), o.get("status", "")
        ])
    
    for r in rides:
        writer.writerow([
            "Corrida", r.get("ride_id", ""), r.get("created_at", "")[:10],
            f"{r.get('pickup_address','')} → {r.get('destination_address','')}",
            r.get("price", 0), r.get("status", "")
        ])
    
    for d in deliveries:
        writer.writerow([
            "Entrega", d.get("delivery_id", ""), d.get("created_at", "")[:10],
            f"{d.get('pickup_address','')} → {d.get('destination_address','')}",
            d.get("price", 0), d.get("status", "")
        ])
    
    total = (sum(o.get("total", 0) for o in orders) + 
             sum(r.get("price", 0) for r in rides) + 
             sum(d.get("price", 0) for d in deliveries))
    writer.writerow([])
    writer.writerow(["TOTAL GASTO", "", "", "", total, ""])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=historico_{period}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/user/history/summary")
async def user_history_summary(request: Request, period: str = "month"):
    """Utilizador: resumo do histórico"""
    user_id = await get_current_user(request)
    db = await get_db(request)
    
    start_date, end_date = get_date_range(period)
    
    orders = await db.orders.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).to_list(500)
    
    rides = await db.tuendi_rides.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).to_list(500)
    
    deliveries = await db.tuendi_deliveries.find(
        {"user_id": user_id, "created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0}
    ).to_list(500)
    
    return {
        "period": period,
        "orders": {"count": len(orders), "total": sum(o.get("total", 0) for o in orders)},
        "rides": {"count": len(rides), "total": sum(r.get("price", 0) for r in rides)},
        "deliveries": {"count": len(deliveries), "total": sum(d.get("price", 0) for d in deliveries)},
        "total_spent": (sum(o.get("total", 0) for o in orders) +
                       sum(r.get("price", 0) for r in rides) +
                       sum(d.get("price", 0) for d in deliveries)),
        "total_transactions": len(orders) + len(rides) + len(deliveries)
    }
