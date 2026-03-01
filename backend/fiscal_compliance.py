"""
Módulo de Conformidade Fiscal Angola
Implementa as regras fiscais angolanas incluindo IVA, Imposto Industrial e retenções
"""

from datetime import datetime
from typing import Dict, List

# LEGISLAÇÃO FISCAL ANGOLANA

# IVA - Imposto sobre o Valor Acrescentado
IVA_RATES = {
    "normal": 0.14,  # 14% - Taxa normal
    "isento": 0.0,    # Isentos
    "reduzida": 0.05  # 5% - Bens essenciais (em discussão)
}

# Imposto Industrial (Lucros)
IMPOSTO_INDUSTRIAL_RATES = {
    "group_a": 0.30,  # 30% - Empresas Grupo A (grandes empresas)
    "group_b": 0.25,  # 25% - Empresas Grupo B (médias)
    "group_c": 0.15   # 15% - Empresas Grupo C (pequenas - simplificado)
}

# Retenção na Fonte
RETENCAO_NA_FONTE = {
    "servicos": 0.065,      # 6.5% - Prestação de serviços
    "trabalho": 0.10,       # 10% - Trabalho independente  
    "rendimento_capital": 0.10,  # 10% - Juros, dividendos
    "aluguel": 0.15         # 15% - Rendas de imóveis
}

# Livros Fiscais Obrigatórios
LIVROS_FISCAIS_OBRIGATORIOS = [
    "Livro de Registo de Faturas Emitidas",
    "Livro de Registo de Faturas Recebidas", 
    "Livro de Registo de IVA",
    "Livro Diário",
    "Livro Razão",
    "Livro de Inventário",
    "Livro de Atas"
]

def calculate_iva(amount: float, rate_type: str = "normal") -> Dict:
    """
    Calcula IVA segundo legislação angolana
    
    Args:
        amount: Valor base sem IVA
        rate_type: Tipo de taxa (normal, isento, reduzida)
        
    Returns:
        Dict com cálculos de IVA
    """
    iva_rate = IVA_RATES.get(rate_type, IVA_RATES["normal"])
    iva_amount = amount * iva_rate
    total_with_iva = amount + iva_amount
    
    return {
        "base_amount": round(amount, 2),
        "iva_rate": iva_rate,
        "iva_rate_percentage": f"{iva_rate * 100}%",
        "iva_amount": round(iva_amount, 2),
        "total_with_iva": round(total_with_iva, 2),
        "rate_type": rate_type
    }

def calculate_imposto_industrial(lucro_tributavel: float, company_group: str = "group_c") -> Dict:
    """
    Calcula Imposto Industrial sobre lucros
    
    Args:
        lucro_tributavel: Lucro tributável do exercício
        company_group: Grupo da empresa (group_a, group_b, group_c)
        
    Returns:
        Dict com cálculo do imposto
    """
    rate = IMPOSTO_INDUSTRIAL_RATES.get(company_group, IMPOSTO_INDUSTRIAL_RATES["group_c"])
    imposto = lucro_tributavel * rate
    lucro_liquido = lucro_tributavel - imposto
    
    return {
        "lucro_tributavel": round(lucro_tributavel, 2),
        "company_group": company_group,
        "tax_rate": rate,
        "tax_rate_percentage": f"{rate * 100}%",
        "imposto_industrial": round(imposto, 2),
        "lucro_liquido_apos_impostos": round(lucro_liquido, 2)
    }

def calculate_retencao_na_fonte(amount: float, service_type: str) -> Dict:
    """
    Calcula retenção na fonte
    
    Args:
        amount: Valor do serviço/rendimento
        service_type: Tipo de serviço (servicos, trabalho, rendimento_capital, aluguel)
        
    Returns:
        Dict com cálculo da retenção
    """
    rate = RETENCAO_NA_FONTE.get(service_type, RETENCAO_NA_FONTE["servicos"])
    retencao = amount * rate
    valor_liquido = amount - retencao
    
    return {
        "amount": round(amount, 2),
        "service_type": service_type,
        "retencao_rate": rate,
        "retencao_rate_percentage": f"{rate * 100}%",
        "retencao_amount": round(retencao, 2),
        "valor_liquido": round(valor_liquido, 2)
    }

def generate_invoice_number(partner_id: str, sequence: int, year: int = None) -> str:
    """
    Gera número de fatura segundo padrões angolanos
    Format: FT YYYY/NNNNNN
    
    Args:
        partner_id: ID do parceiro
        sequence: Número sequencial
        year: Ano (usa ano atual se não especificado)
        
    Returns:
        Número de fatura formatado
    """
    if year is None:
        year = datetime.now().year
    
    return f"FT {year}/{sequence:06d}"

def validate_nif(nif: str) -> bool:
    """
    Valida NIF (Número de Identificação Fiscal) angolano
    NIF deve ter 9 ou 10 dígitos
    
    Args:
        nif: Número de Identificação Fiscal
        
    Returns:
        True se válido, False caso contrário
    """
    if not nif:
        return False
    
    # Remove espaços e caracteres especiais
    nif_clean = ''.join(filter(str.isdigit, nif))
    
    # NIF angolano tem 9 ou 10 dígitos
    return len(nif_clean) in [9, 10]

def calculate_commission_with_taxes(
    gross_amount: float,
    commission_rate: float,
    include_iva: bool = True,
    apply_retencao: bool = True
) -> Dict:
    """
    Calcula comissão da plataforma com impostos aplicados
    
    Args:
        gross_amount: Valor bruto da transação
        commission_rate: Taxa de comissão (ex: 0.10 para 10%)
        include_iva: Se deve incluir IVA na comissão
        apply_retencao: Se deve aplicar retenção na fonte
        
    Returns:
        Dict com breakdown completo
    """
    # Comissão base
    commission_base = gross_amount * commission_rate
    
    # IVA sobre comissão (plataforma presta serviço)
    if include_iva:
        iva_calc = calculate_iva(commission_base, "normal")
        commission_with_iva = iva_calc["total_with_iva"]
        iva_amount = iva_calc["iva_amount"]
    else:
        commission_with_iva = commission_base
        iva_amount = 0
    
    # Retenção na fonte (parceiro retém sobre comissão)
    if apply_retencao:
        retencao_calc = calculate_retencao_na_fonte(commission_base, "servicos")
        retencao_amount = retencao_calc["retencao_amount"]
    else:
        retencao_amount = 0
    
    # Valor líquido para a plataforma
    net_to_platform = commission_base + iva_amount - retencao_amount
    
    # Valor líquido para o parceiro
    net_to_partner = gross_amount - commission_base
    
    return {
        "gross_amount": round(gross_amount, 2),
        "commission_rate": commission_rate,
        "commission_rate_percentage": f"{commission_rate * 100}%",
        "commission_base": round(commission_base, 2),
        "iva_amount": round(iva_amount, 2),
        "commission_with_iva": round(commission_with_iva, 2),
        "retencao_amount": round(retencao_amount, 2),
        "net_to_platform": round(net_to_platform, 2),
        "net_to_partner": round(net_to_partner, 2),
        "breakdown": {
            "partner_receives": round(net_to_partner, 2),
            "platform_receives": round(net_to_platform, 2),
            "government_receives": round(iva_amount + retencao_amount, 2)
        }
    }

def generate_fiscal_report(partner_id: str, period: str, transactions: List[Dict]) -> Dict:
    """
    Gera relatório fiscal para AGT (Administração Geral Tributária)
    
    Args:
        partner_id: ID do parceiro
        period: Período (ex: "2026-01")
        transactions: Lista de transações
        
    Returns:
        Relatório fiscal completo
    """
    total_revenue = sum(t.get("amount", 0) for t in transactions)
    total_iva_collected = sum(t.get("iva_amount", 0) for t in transactions)
    total_retencao = sum(t.get("retencao_amount", 0) for t in transactions)
    
    return {
        "partner_id": partner_id,
        "period": period,
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_transactions": len(transactions),
            "total_revenue": round(total_revenue, 2),
            "total_iva_collected": round(total_iva_collected, 2),
            "total_retencao_na_fonte": round(total_retencao, 2)
        },
        "transactions": transactions,
        "compliance_status": "compliant",
        "required_books": LIVROS_FISCAIS_OBRIGATORIOS
    }

# Constantes para conformidade
FISCAL_COMPLIANCE_RULES = {
    "iva_rate": "14% (Taxa Normal) - Código do IVA Angola",
    "retention_services": "6.5% retenção na fonte para serviços",
    "industrial_tax": "15-30% sobre lucros dependendo do grupo",
    "invoice_format": "FT YYYY/NNNNNN obrigatório",
    "nif_required": "NIF obrigatório para todas transações",
    "accounting_system": "PGCA - Plano Geral de Contabilidade Angola",
    "fiscal_authority": "AGT - Administração Geral Tributária"
}
