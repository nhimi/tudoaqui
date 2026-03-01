"""
Módulo de Contabilidade baseado no PGCA (Plano Geral de Contabilidade de Angola)
"""

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import os

router = APIRouter(prefix="/accounting", tags=["accounting"])

# Plano de Contas Geral de Angola (PGCA) - Estrutura Principal
CHART_OF_ACCOUNTS = {
    # Classe 1: Meios Monetários
    "11": {"name": "Caixa", "type": "debit", "class": 1},
    "12": {"name": "Depósitos à Ordem", "type": "debit", "class": 1},
    "13": {"name": "Depósitos a Prazo", "type": "debit", "class": 1},
    
    # Classe 2: Terceiros
    "21": {"name": "Clientes", "type": "debit", "class": 2},
    "22": {"name": "Fornecedores", "type": "credit", "class": 2},
    "24": {"name": "Estado e Outros Entes Públicos", "type": "credit", "class": 2},
    "26": {"name": "Outros Devedores e Credores", "type": "debit", "class": 2},
    
    # Classe 3: Existências
    "31": {"name": "Compras", "type": "debit", "class": 3},
    "32": {"name": "Mercadorias", "type": "debit", "class": 3},
    
    # Classe 4: Imobilizações
    "41": {"name": "Investimentos Financeiros", "type": "debit", "class": 4},
    "42": {"name": "Imobilizações Corpóreas", "type": "debit", "class": 4},
    "43": {"name": "Imobilizações Incorpóreas", "type": "debit", "class": 4},
    
    # Classe 5: Capital e Reservas
    "51": {"name": "Capital", "type": "credit", "class": 5},
    "55": {"name": "Reservas", "type": "credit", "class": 5},
    "56": {"name": "Resultados Transitados", "type": "credit", "class": 5},
    "59": {"name": "Resultado Líquido do Exercício", "type": "credit", "class": 5},
    
    # Classe 6: Custos
    "61": {"name": "Custo das Mercadorias Vendidas e Matérias Consumidas", "type": "debit", "class": 6},
    "62": {"name": "Fornecimentos e Serviços Externos", "type": "debit", "class": 6},
    "63": {"name": "Impostos", "type": "debit", "class": 6},
    "64": {"name": "Custos com Pessoal", "type": "debit", "class": 6},
    "65": {"name": "Outros Custos Operacionais", "type": "debit", "class": 6},
    "66": {"name": "Amortizações do Exercício", "type": "debit", "class": 6},
    "68": {"name": "Custos e Perdas Financeiras", "type": "debit", "class": 6},
    "69": {"name": "Custos e Perdas Extraordinárias", "type": "debit", "class": 6},
    
    # Classe 7: Proveitos
    "71": {"name": "Vendas", "type": "credit", "class": 7},
    "72": {"name": "Prestações de Serviços", "type": "credit", "class": 7},
    "75": {"name": "Subsídios à Exploração", "type": "credit", "class": 7},
    "76": {"name": "Outros Proveitos Operacionais", "type": "credit", "class": 7},
    "78": {"name": "Proveitos e Ganhos Financeiros", "type": "credit", "class": 7},
    "79": {"name": "Proveitos e Ganhos Extraordinários", "type": "credit", "class": 7},
    
    # Classe 8: Resultados
    "81": {"name": "Resultado Operacional", "type": "credit", "class": 8},
    "82": {"name": "Resultado Financeiro", "type": "credit", "class": 8},
    "88": {"name": "Resultado Líquido do Exercício", "type": "credit", "class": 8},
}

async def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_current_user(request: Request) -> str:
    from server import get_current_user as base_get_user
    return await base_get_user(request)

@router.get("/chart-of-accounts")
async def get_chart_of_accounts(request: Request):
    """Obter plano de contas"""
    await get_current_user(request)
    
    # Organizar por classe
    classes = {}
    for code, account in CHART_OF_ACCOUNTS.items():
        class_num = account["class"]
        if class_num not in classes:
            classes[class_num] = []
        classes[class_num].append({
            "code": code,
            "name": account["name"],
            "type": account["type"]
        })
    
    return {
        "chart_of_accounts": CHART_OF_ACCOUNTS,
        "by_class": classes,
        "class_names": {
            1: "Meios Monetários",
            2: "Terceiros",
            3: "Existências",
            4: "Imobilizações",
            5: "Capital e Reservas",
            6: "Custos",
            7: "Proveitos",
            8: "Resultados"
        }
    }

@router.post("/journal-entry")
async def create_journal_entry(request: Request, entry_data: dict):
    """Criar lançamento contábil (Diário)"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    # Obter parceiro
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros podem fazer lançamentos")
    
    lines = entry_data.get("lines", [])
    
    # Validar débito = crédito
    total_debit = sum(line.get("debit", 0) for line in lines)
    total_credit = sum(line.get("credit", 0) for line in lines)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="Débito e Crédito devem ser iguais")
    
    # Validar contas
    for line in lines:
        if line.get("account_code") not in CHART_OF_ACCOUNTS:
            raise HTTPException(status_code=400, detail=f"Conta {line.get('account_code')} inválida")
    
    entry_id = f"entry_{uuid.uuid4().hex[:10]}"
    
    # Criar lançamento
    entry_doc = {
        "entry_id": entry_id,
        "partner_id": partner["partner_id"],
        "date": entry_data.get("date", datetime.now(timezone.utc).isoformat()),
        "description": entry_data.get("description"),
        "reference": entry_data.get("reference", ""),
        "total_debit": total_debit,
        "total_credit": total_credit,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.journal_entries.insert_one(entry_doc)
    
    # Criar linhas
    for line in lines:
        line_id = f"line_{uuid.uuid4().hex[:8]}"
        line_doc = {
            "line_id": line_id,
            "entry_id": entry_id,
            "partner_id": partner["partner_id"],
            "date": entry_doc["date"],
            "account_code": line["account_code"],
            "account_name": CHART_OF_ACCOUNTS[line["account_code"]]["name"],
            "debit": line.get("debit", 0),
            "credit": line.get("credit", 0),
            "description": line.get("description", entry_data.get("description")),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.journal_lines.insert_one(line_doc)
    
    return {"entry_id": entry_id, "message": "Lançamento registrado com sucesso"}

@router.get("/journal")
async def get_journal(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Livro Diário - Registo cronológico"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros têm acesso")
    
    # Buscar lançamentos
    query = {"partner_id": partner["partner_id"]}
    
    entries = await db.journal_entries.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    
    # Para cada lançamento, buscar linhas
    for entry in entries:
        lines = await db.journal_lines.find(
            {"entry_id": entry["entry_id"]},
            {"_id": 0}
        ).to_list(100)
        entry["lines"] = lines
    
    return {
        "journal": entries,
        "total_entries": len(entries)
    }

@router.get("/ledger/{account_code}")
async def get_ledger(request: Request, account_code: str):
    """Livro Razão - Movimentos por conta"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros têm acesso")
    
    if account_code not in CHART_OF_ACCOUNTS:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    # Buscar todas as movimentações da conta
    lines = await db.journal_lines.find(
        {
            "partner_id": partner["partner_id"],
            "account_code": account_code
        },
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    # Calcular saldo
    balance = 0
    account_type = CHART_OF_ACCOUNTS[account_code]["type"]
    
    for line in lines:
        if account_type == "debit":
            balance += line["debit"] - line["credit"]
        else:
            balance += line["credit"] - line["debit"]
        
        line["balance"] = balance
    
    return {
        "account_code": account_code,
        "account_name": CHART_OF_ACCOUNTS[account_code]["name"],
        "account_type": account_type,
        "movements": lines,
        "current_balance": balance
    }

@router.get("/trial-balance")
async def get_trial_balance(request: Request, date: Optional[str] = None):
    """Balancete - Saldos de todas as contas"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros têm acesso")
    
    # Buscar todas as linhas
    lines = await db.journal_lines.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).to_list(10000)
    
    # Calcular saldos por conta
    accounts_balance = {}
    
    for line in lines:
        code = line["account_code"]
        if code not in accounts_balance:
            accounts_balance[code] = {
                "account_code": code,
                "account_name": CHART_OF_ACCOUNTS[code]["name"],
                "account_type": CHART_OF_ACCOUNTS[code]["type"],
                "class": CHART_OF_ACCOUNTS[code]["class"],
                "total_debit": 0,
                "total_credit": 0,
                "balance": 0
            }
        
        accounts_balance[code]["total_debit"] += line["debit"]
        accounts_balance[code]["total_credit"] += line["credit"]
    
    # Calcular saldos finais
    total_debit_balance = 0
    total_credit_balance = 0
    
    for code, acc in accounts_balance.items():
        if acc["account_type"] == "debit":
            acc["balance"] = acc["total_debit"] - acc["total_credit"]
            if acc["balance"] > 0:
                total_debit_balance += acc["balance"]
        else:
            acc["balance"] = acc["total_credit"] - acc["total_debit"]
            if acc["balance"] > 0:
                total_credit_balance += acc["balance"]
    
    # Ordenar por código de conta
    balances_list = sorted(accounts_balance.values(), key=lambda x: x["account_code"])
    
    return {
        "trial_balance": balances_list,
        "summary": {
            "total_debit_balance": total_debit_balance,
            "total_credit_balance": total_credit_balance,
            "is_balanced": abs(total_debit_balance - total_credit_balance) < 0.01
        },
        "date": date or datetime.now(timezone.utc).isoformat()
    }

@router.get("/balance-sheet")
async def get_balance_sheet(request: Request, date: Optional[str] = None):
    """Balanço - Demonstração da posição financeira"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros têm acesso")
    
    # Obter balancete primeiro
    trial_balance_result = await get_trial_balance(request, date)
    balances = trial_balance_result["trial_balance"]
    
    # Separar em Ativo, Passivo e Capital Próprio
    ativo = {
        "meios_monetarios": [],  # Classe 1
        "terceiros": [],  # Classe 2 (devedores)
        "existencias": [],  # Classe 3
        "imobilizacoes": [],  # Classe 4
        "total": 0
    }
    
    passivo = {
        "terceiros": [],  # Classe 2 (credores)
        "total": 0
    }
    
    capital_proprio = {
        "capital": [],  # Classe 5
        "resultados": [],
        "total": 0
    }
    
    for acc in balances:
        if acc["balance"] == 0:
            continue
        
        class_num = acc["class"]
        
        # ATIVO
        if class_num == 1:  # Meios Monetários
            ativo["meios_monetarios"].append(acc)
            ativo["total"] += acc["balance"]
        elif class_num == 2 and acc["account_type"] == "debit":  # Clientes
            ativo["terceiros"].append(acc)
            ativo["total"] += acc["balance"]
        elif class_num == 3:  # Existências
            ativo["existencias"].append(acc)
            ativo["total"] += acc["balance"]
        elif class_num == 4:  # Imobilizações
            ativo["imobilizacoes"].append(acc)
            ativo["total"] += acc["balance"]
        
        # PASSIVO
        elif class_num == 2 and acc["account_type"] == "credit":  # Fornecedores
            passivo["terceiros"].append(acc)
            passivo["total"] += acc["balance"]
        
        # CAPITAL PRÓPRIO
        elif class_num == 5:
            capital_proprio["capital"].append(acc)
            capital_proprio["total"] += acc["balance"]
    
    # Calcular resultado do exercício (Classe 7 - Classe 6)
    proveitos = sum(acc["balance"] for acc in balances if acc["class"] == 7)
    custos = sum(acc["balance"] for acc in balances if acc["class"] == 6)
    resultado = proveitos - custos
    
    capital_proprio["resultados"].append({
        "account_code": "88",
        "account_name": "Resultado do Exercício",
        "balance": resultado
    })
    capital_proprio["total"] += resultado
    
    total_passivo_capital = passivo["total"] + capital_proprio["total"]
    
    return {
        "balance_sheet": {
            "ativo": ativo,
            "passivo": passivo,
            "capital_proprio": capital_proprio
        },
        "summary": {
            "total_ativo": ativo["total"],
            "total_passivo": passivo["total"],
            "total_capital_proprio": capital_proprio["total"],
            "total_passivo_capital": total_passivo_capital,
            "is_balanced": abs(ativo["total"] - total_passivo_capital) < 0.01
        },
        "date": date or datetime.now(timezone.utc).isoformat()
    }

@router.get("/income-statement")
async def get_income_statement(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Demonstração de Resultados"""
    user_id = await get_current_user(request)
    db = await get_db()
    
    partner = await db.partners.find_one({"user_id": user_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=403, detail="Apenas parceiros têm acesso")
    
    # Obter balancete
    trial_balance_result = await get_trial_balance(request, end_date)
    balances = trial_balance_result["trial_balance"]
    
    # Separar Custos (Classe 6) e Proveitos (Classe 7)
    custos = [acc for acc in balances if acc["class"] == 6 and acc["balance"] > 0]
    proveitos = [acc for acc in balances if acc["class"] == 7 and acc["balance"] > 0]
    
    total_custos = sum(acc["balance"] for acc in custos)
    total_proveitos = sum(acc["balance"] for acc in proveitos)
    resultado_liquido = total_proveitos - total_custos
    
    return {
        "income_statement": {
            "proveitos": proveitos,
            "custos": custos,
            "total_proveitos": total_proveitos,
            "total_custos": total_custos,
            "resultado_liquido": resultado_liquido
        },
        "period": {
            "start_date": start_date,
            "end_date": end_date or datetime.now(timezone.utc).isoformat()
        }
    }
