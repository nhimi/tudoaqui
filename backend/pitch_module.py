"""
TudoAqui - Gerador de Apresentação/Pitch Deck
Exportação em HTML para impressão PDF
"""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from datetime import datetime

router = APIRouter(prefix="/pitch", tags=["pitch"])

COMPANY_INFO = {
    "name": "Sincesoft - Sinceridade Service",
    "nif": "2403104787",
    "address": "Ave. Hoji ya Henda 132, Vila Alice, Rangel - Luanda, Angola",
    "product": "TudoAqui",
    "tagline": "O Super App de Angola",
    "team": [
        {"name": "João Maria Nhimi", "role": "Fundador & CEO"},
        {"name": "Miguel da Costa", "role": "Conselheiro Estratégico"},
        {"name": "Eliseu Costa", "role": "Director Técnico / CTO"},
        {"name": "Ansty Cavango", "role": "Contabilidade & Finanças / CFO"},
        {"name": "Patruska Victor", "role": "Marketing & Comunicação / CMO"},
        {"name": "João Malonda", "role": "Marketing & Crescimento"}
    ]
}

@router.get("/data")
async def get_pitch_data():
    """Dados completos da apresentação"""
    return {
        "company": COMPANY_INFO,
        "market": {
            "angola_population": 35_000_000,
            "luanda_population": 9_000_000,
            "internet_penetration": 0.33,
            "smartphone_penetration": 0.28,
            "tam": {"value": 4_800_000_000, "label": "TAM - Mercado Total Endereçável", "description": "Serviços digitais Angola + PALOP + Brasil (mobilidade, delivery, turismo, imóveis)"},
            "sam": {"value": 680_000_000, "label": "SAM - Mercado Acessível", "description": "Super apps urbanos em Angola (Luanda, Benguela, Huambo, Lobito, Cabinda)"},
            "som": {"value": 45_000_000, "label": "SOM - Mercado Obtível (2 anos)", "description": "Quota capturável com operação em Luanda e expansão para 3 províncias"}
        },
        "revenue_model": [
            {"stream": "Comissão Tuendi (corridas)", "rate": "15-20%", "projected_year1": 120_000_000},
            {"stream": "Comissão Restaurantes", "rate": "18-25%", "projected_year1": 85_000_000},
            {"stream": "Comissão Turismo/Imóveis", "rate": "5-10%", "projected_year1": 25_000_000},
            {"stream": "Subscrição Parceiros Premium", "rate": "15.000 Kz/mês", "projected_year1": 36_000_000},
            {"stream": "Publicidade In-App", "rate": "CPM/CPC", "projected_year1": 18_000_000},
            {"stream": "Serviços Financeiros (Carteira)", "rate": "1-2%", "projected_year1": 12_000_000}
        ],
        "costs_year1": {
            "development": {"amount": 85_000_000, "description": "Equipa dev (6 eng.), infraestrutura cloud, licenças"},
            "marketing": {"amount": 120_000_000, "description": "Aquisição utilizadores, branding, campanhas digitais"},
            "operations": {"amount": 45_000_000, "description": "Suporte, escritório, logística, equipamentos"},
            "legal": {"amount": 15_000_000, "description": "Licenças, compliance, propriedade intelectual, INACOM"},
            "partnerships": {"amount": 25_000_000, "description": "Onboarding parceiros, incentivos, formação"},
            "contingency": {"amount": 30_000_000, "description": "Reserva estratégica (10%)"}
        },
        "funding": {
            "round": "Série A",
            "target": 500_000_000,
            "target_usd": 580_000,
            "pre_money_valuation": 2_500_000_000,
            "equity_offered": "15-20%",
            "use_of_funds": [
                {"category": "Desenvolvimento Produto", "percent": 27, "amount": 135_000_000},
                {"category": "Marketing & Aquisição", "percent": 35, "amount": 175_000_000},
                {"category": "Operações & Equipa", "percent": 18, "amount": 90_000_000},
                {"category": "Expansão Regional", "percent": 10, "amount": 50_000_000},
                {"category": "Legal & Compliance", "percent": 5, "amount": 25_000_000},
                {"category": "Reserva", "percent": 5, "amount": 25_000_000}
            ]
        },
        "roadmap": [
            {
                "phase": "Fase 1 - MVP & Lançamento",
                "timeline": "Mês 1-3",
                "status": "completed",
                "items": [
                    "Desenvolvimento core: Tuendi, Restaurantes, Auth",
                    "Sistema de pagamento simulado (Multicaixa, Unitel Money)",
                    "Testes internos e beta privado",
                    "Registo legal e licenças INACOM"
                ],
                "cost": 45_000_000,
                "milestone": "App funcional com 3 módulos core"
            },
            {
                "phase": "Fase 2 - Beta Público",
                "timeline": "Mês 4-6",
                "status": "in_progress",
                "items": [
                    "Lançamento beta em Luanda (1000 utilizadores)",
                    "Onboarding 50 restaurantes parceiros",
                    "Integração gateway de pagamento real",
                    "Sistema de cupons e referral para crescimento"
                ],
                "cost": 65_000_000,
                "milestone": "5.000 utilizadores, 50 parceiros"
            },
            {
                "phase": "Fase 3 - Crescimento",
                "timeline": "Mês 7-12",
                "status": "planned",
                "items": [
                    "Marketing agressivo (TV, rádio, digital)",
                    "Expansão para Benguela e Huambo",
                    "Módulos Turismo e Imóveis completos",
                    "Parcerias com operadoras (Unitel, Movicel)"
                ],
                "cost": 180_000_000,
                "milestone": "50.000 utilizadores, 300 parceiros"
            },
            {
                "phase": "Fase 4 - Escala Nacional",
                "timeline": "Ano 2",
                "status": "planned",
                "items": [
                    "Cobertura em 8 províncias de Angola",
                    "Serviços financeiros (microcrédito, seguros)",
                    "API aberta para desenvolvedores terceiros",
                    "Preparação para expansão PALOP"
                ],
                "cost": 150_000_000,
                "milestone": "200.000 utilizadores, 1.000 parceiros"
            },
            {
                "phase": "Fase 5 - Expansão Regional",
                "timeline": "Ano 3-4",
                "status": "planned",
                "items": [
                    "Lançamento em Moçambique e Cabo Verde",
                    "Adaptação para mercado brasileiro (piloto)",
                    "Série B ou partnership estratégico",
                    "Meta: Super App líder da África lusófona"
                ],
                "cost": 300_000_000,
                "milestone": "1M+ utilizadores, presença em 3 países"
            }
        ],
        "legal": [
            {"item": "Registo Comercial", "entity": "Ministério da Justiça", "status": "required", "cost": 500_000},
            {"item": "Licença INACOM", "entity": "Instituto Angolano das Comunicações", "status": "required", "cost": 2_000_000},
            {"item": "Licença BNA (Serviços de Pagamento)", "entity": "Banco Nacional de Angola", "status": "required", "cost": 5_000_000},
            {"item": "Protecção de Dados (LGPD Angola)", "entity": "APD Angola", "status": "required", "cost": 1_500_000},
            {"item": "NIF Empresa", "entity": "AGT", "status": "active", "cost": 0},
            {"item": "Registo de Marca", "entity": "IAPI", "status": "required", "cost": 800_000},
            {"item": "Seguro de Responsabilidade Civil", "entity": "Seguradora", "status": "required", "cost": 3_000_000},
            {"item": "Alvará Comercial", "entity": "Governo Provincial", "status": "required", "cost": 1_200_000}
        ],
        "partnerships": [
            {"partner": "Operadoras Móveis", "names": "Unitel, Movicel, Africell", "benefit": "Pagamento via saldo, SMS marketing, dados gratuitos para app"},
            {"partner": "Bancos", "names": "BAI, BFA, BIC, Atlântico", "benefit": "Integração pagamentos, microcrédito, contas digitais"},
            {"partner": "Restaurantes & Cadeias", "names": "Grupos de restauração em Luanda", "benefit": "Delivery, visibilidade, gestão de pedidos"},
            {"partner": "Imobiliárias", "names": "Agências imobiliárias de Luanda", "benefit": "Listagem de imóveis, leads qualificados"},
            {"partner": "Turismo", "names": "MINHOTUR, hotéis, operadores turísticos", "benefit": "Reservas online, promoção turismo interno"},
            {"partner": "Governo", "names": "MINTIC, INACOM, Startup Angola", "benefit": "Regulamentação favorável, incentivos fiscais, acesso a programas"}
        ],
        "marketing_strategy": [
            {"phase": "Pré-lançamento (Mês 1-2)", "budget_percent": 10, "activities": ["Teasers redes sociais", "Landing page com lista de espera", "Parcerias com influencers angolanos"]},
            {"phase": "Lançamento (Mês 3-4)", "budget_percent": 30, "activities": ["Campanha 'TudoAqui, Tudo Fácil'", "Código TUENDI20 (20% OFF)", "Evento de lançamento em Luanda", "TV (TPA, TV Zimbo) + Rádio (LAC, RNA)"]},
            {"phase": "Crescimento (Mês 5-9)", "budget_percent": 40, "activities": ["Google Ads + Meta Ads Angola", "Programa de referral agressivo", "Parcerias com universidades", "Sponsorship de eventos"]},
            {"phase": "Consolidação (Mês 10-12)", "budget_percent": 20, "activities": ["Retenção: streak diário, cupons", "Programas de fidelidade tier", "PR e media coverage", "Expansão boca-a-boca"]}
        ],
        "testing_strategy": [
            {"phase": "Alpha (interno)", "timeline": "Mês 1-2", "scope": "Testes unitários, integração, equipa interna (20 pessoas)"},
            {"phase": "Beta Fechado", "timeline": "Mês 3", "scope": "200 utilizadores convidados, feedback estruturado, bug bounty"},
            {"phase": "Beta Público", "timeline": "Mês 4-5", "scope": "1.000 utilizadores em Luanda, A/B testing, métricas de performance"},
            {"phase": "Soft Launch", "timeline": "Mês 6", "scope": "Lançamento gradual, monitorização 24/7, suporte dedicado"},
            {"phase": "QA Contínuo", "timeline": "Ongoing", "scope": "Testes automatizados, CI/CD, monitorização de uptime 99.9%"}
        ],
        "projections": {
            "year1": {"users": 50_000, "partners": 300, "revenue": 296_000_000, "costs": 320_000_000, "net": -24_000_000},
            "year2": {"users": 200_000, "partners": 1_000, "revenue": 890_000_000, "costs": 520_000_000, "net": 370_000_000},
            "year3": {"users": 500_000, "partners": 3_000, "revenue": 2_100_000_000, "costs": 980_000_000, "net": 1_120_000_000}
        },
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/export", response_class=HTMLResponse)
async def export_pitch_html():
    """Exportar apresentação como HTML (para impressão PDF)"""
    data = (await get_pitch_data())
    
    team_html = ""
    for m in data["company"]["team"]:
        team_html += f'<div class="team-card"><h4>{m["name"]}</h4><p>{m["role"]}</p></div>'
    
    roadmap_html = ""
    for r in data["roadmap"]:
        status_class = "completed" if r["status"] == "completed" else "in-progress" if r["status"] == "in_progress" else "planned"
        roadmap_html += f'''
        <div class="roadmap-item {status_class}">
            <h4>{r["phase"]}</h4><span class="timeline">{r["timeline"]}</span>
            <ul>{"".join(f"<li>{i}</li>" for i in r["items"])}</ul>
            <p class="cost">Investimento: {r["cost"]:,.0f} Kz</p>
        </div>'''
    
    revenue_html = ""
    total_rev = 0
    for r in data["revenue_model"]:
        total_rev += r["projected_year1"]
        revenue_html += f'<tr><td>{r["stream"]}</td><td>{r["rate"]}</td><td class="num">{r["projected_year1"]:,.0f} Kz</td></tr>'
    revenue_html += f'<tr class="total"><td><strong>TOTAL ANO 1</strong></td><td></td><td class="num"><strong>{total_rev:,.0f} Kz</strong></td></tr>'
    
    costs_html = ""
    total_cost = 0
    for k, v in data["costs_year1"].items():
        total_cost += v["amount"]
        costs_html += f'<tr><td>{v["description"]}</td><td class="num">{v["amount"]:,.0f} Kz</td></tr>'
    costs_html += f'<tr class="total"><td><strong>TOTAL CUSTOS ANO 1</strong></td><td class="num"><strong>{total_cost:,.0f} Kz</strong></td></tr>'
    
    legal_html = ""
    for l in data["legal"]:
        legal_html += f'<tr><td>{l["item"]}</td><td>{l["entity"]}</td><td class="num">{l["cost"]:,.0f} Kz</td></tr>'
    
    html = f"""<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"><title>TudoAqui - Apresentação Série A</title>
<style>
@page {{ margin: 1.5cm; size: A4; }}
body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }}
.cover {{ text-align: center; padding: 80px 0; page-break-after: always; }}
.cover h1 {{ font-size: 48px; color: #D62828; margin: 0; }}
.cover .tagline {{ font-size: 24px; color: #666; margin: 10px 0 30px; }}
.cover .round {{ background: #D62828; color: white; padding: 12px 40px; border-radius: 30px; font-size: 18px; display: inline-block; }}
.cover .company {{ margin-top: 40px; color: #999; font-size: 14px; }}
h2 {{ color: #D62828; border-bottom: 3px solid #D62828; padding-bottom: 8px; margin-top: 40px; font-size: 22px; }}
h3 {{ color: #333; font-size: 18px; }}
table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }}
th {{ background: #f5f5f5; font-weight: 600; }}
.num {{ text-align: right; font-family: monospace; }}
.total td {{ border-top: 2px solid #D62828; font-weight: bold; }}
.team-grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0; }}
.team-card {{ background: #f8f8f8; padding: 15px; border-radius: 8px; text-align: center; }}
.team-card h4 {{ margin: 0 0 4px; color: #D62828; font-size: 14px; }}
.team-card p {{ margin: 0; color: #666; font-size: 12px; }}
.roadmap-item {{ background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ccc; }}
.roadmap-item.completed {{ border-left-color: #0D9488; }}
.roadmap-item.in-progress {{ border-left-color: #FCBF49; }}
.roadmap-item.planned {{ border-left-color: #9333EA; }}
.roadmap-item h4 {{ margin: 0; font-size: 15px; }}
.timeline {{ color: #999; font-size: 12px; }}
.roadmap-item ul {{ margin: 8px 0; padding-left: 20px; }}
.roadmap-item li {{ font-size: 13px; margin: 3px 0; }}
.cost {{ font-weight: bold; color: #D62828; font-size: 13px; margin: 5px 0 0; }}
.market-box {{ background: linear-gradient(135deg, #D62828, #D62828dd); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 10px 0; }}
.market-box .value {{ font-size: 32px; font-weight: 900; }}
.market-box .label {{ font-size: 14px; opacity: 0.9; }}
.market-grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }}
.highlight {{ background: #FCBF49; color: #1a1a1a; padding: 15px 20px; border-radius: 8px; font-weight: bold; text-align: center; margin: 15px 0; }}
.footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }}
@media print {{ .page-break {{ page-break-before: always; }} }}
</style>
</head>
<body>

<div class="cover">
<h1>TudoAqui</h1>
<p class="tagline">O Super App de Angola</p>
<div class="round">Ronda Série A - {data['funding']['target']:,.0f} Kz (~${data['funding']['target_usd']:,.0f} USD)</div>
<p class="company">{COMPANY_INFO['name']}<br>NIF: {COMPANY_INFO['nif']}<br>{COMPANY_INFO['address']}<br><br>{datetime.utcnow().strftime('%B %Y')}</p>
</div>

<h2>O Problema</h2>
<p>Angola enfrenta uma <strong>fragmentação massiva de serviços digitais</strong>. Os cidadãos precisam de múltiplos apps para mobilidade, alimentação, turismo e imóveis. A maioria das soluções existentes são importadas, caras e não adaptadas à realidade angolana — sem suporte a Multicaixa Express, Unitel Money, ou pagamentos em Kwanzas.</p>
<div class="highlight">35 milhões de angolanos sem um super app local. 9 milhões só em Luanda.</div>

<h2>A Solução: TudoAqui</h2>
<p><strong>TudoAqui</strong> é o primeiro super app angolano que unifica mobilidade (Tuendi), delivery de comida, turismo, imóveis e serviços financeiros numa única plataforma, com pagamentos locais (Multicaixa Express, Unitel Money, BAI Paga) e sistema de fidelização gamificado.</p>

<h2>Mercado</h2>
<div class="market-grid">
<div class="market-box"><div class="value">$4.8B</div><div class="label">TAM - Serviços digitais<br>Angola + PALOP + Brasil</div></div>
<div class="market-box" style="background:linear-gradient(135deg,#0D9488,#0D9488dd)"><div class="value">$680M</div><div class="label">SAM - Super apps urbanos<br>Angola</div></div>
<div class="market-box" style="background:linear-gradient(135deg,#9333EA,#9333EAdd)"><div class="value">$45M</div><div class="label">SOM - Capturável em 2 anos<br>Luanda + 3 províncias</div></div>
</div>

<div class="page-break"></div>
<h2>Modelo de Receita</h2>
<table><thead><tr><th>Fonte de Receita</th><th>Taxa</th><th>Projecção Ano 1</th></tr></thead><tbody>{revenue_html}</tbody></table>

<h2>Estrutura de Custos (Ano 1)</h2>
<table><thead><tr><th>Categoria</th><th>Valor</th></tr></thead><tbody>{costs_html}</tbody></table>

<div class="page-break"></div>
<h2>Roadmap de Desenvolvimento</h2>
{roadmap_html}

<div class="page-break"></div>
<h2>Projecções Financeiras (3 Anos)</h2>
<table>
<thead><tr><th>Métrica</th><th>Ano 1</th><th>Ano 2</th><th>Ano 3</th></tr></thead>
<tbody>
<tr><td>Utilizadores</td><td class="num">50.000</td><td class="num">200.000</td><td class="num">500.000</td></tr>
<tr><td>Parceiros</td><td class="num">300</td><td class="num">1.000</td><td class="num">3.000</td></tr>
<tr><td>Receita</td><td class="num">296M Kz</td><td class="num">890M Kz</td><td class="num">2.1B Kz</td></tr>
<tr><td>Custos</td><td class="num">320M Kz</td><td class="num">520M Kz</td><td class="num">980M Kz</td></tr>
<tr class="total"><td>Resultado Líquido</td><td class="num" style="color:red">-24M Kz</td><td class="num" style="color:green">+370M Kz</td><td class="num" style="color:green">+1.12B Kz</td></tr>
</tbody>
</table>
<p><em>Break-even projectado no mês 14. ROI de 3x no Ano 3.</em></p>

<h2>Série A - Uso dos Fundos</h2>
<table>
<thead><tr><th>Categoria</th><th>%</th><th>Valor</th></tr></thead>
<tbody>
{"".join(f'<tr><td>{u["category"]}</td><td class="num">{u["percent"]}%</td><td class="num">{u["amount"]:,.0f} Kz</td></tr>' for u in data['funding']['use_of_funds'])}
<tr class="total"><td><strong>TOTAL SÉRIE A</strong></td><td class="num"><strong>100%</strong></td><td class="num"><strong>{data['funding']['target']:,.0f} Kz</strong></td></tr>
</tbody>
</table>
<p>Valorização Pre-Money: <strong>{data['funding']['pre_money_valuation']:,.0f} Kz</strong> | Equity oferecido: <strong>{data['funding']['equity_offered']}</strong></p>

<div class="page-break"></div>
<h2>Legalidade & Compliance</h2>
<table><thead><tr><th>Requisito</th><th>Entidade</th><th>Custo Est.</th></tr></thead><tbody>{legal_html}</tbody></table>

<h2>Parcerias Estratégicas</h2>
<table><thead><tr><th>Tipo</th><th>Alvos</th><th>Benefício</th></tr></thead>
<tbody>{"".join(f'<tr><td><strong>{p["partner"]}</strong></td><td>{p["names"]}</td><td>{p["benefit"]}</td></tr>' for p in data['partnerships'])}</tbody></table>

<h2>Estratégia de Marketing</h2>
<table><thead><tr><th>Fase</th><th>Budget</th><th>Actividades</th></tr></thead>
<tbody>{"".join(f'<tr><td><strong>{m["phase"]}</strong></td><td class="num">{m["budget_percent"]}%</td><td>{"<br>".join(m["activities"])}</td></tr>' for m in data['marketing_strategy'])}</tbody></table>

<h2>Fases de Teste</h2>
<table><thead><tr><th>Fase</th><th>Período</th><th>Âmbito</th></tr></thead>
<tbody>{"".join(f'<tr><td><strong>{t["phase"]}</strong></td><td>{t["timeline"]}</td><td>{t["scope"]}</td></tr>' for t in data['testing_strategy'])}</tbody></table>

<div class="page-break"></div>
<h2>Equipa</h2>
<div class="team-grid">{team_html}</div>

<div class="highlight" style="margin-top:40px;font-size:20px;">
TudoAqui — O Super App que Angola precisa.<br>
<span style="font-size:14px;font-weight:normal;">Série A: {data['funding']['target']:,.0f} Kz (~${data['funding']['target_usd']:,.0f} USD) por {data['funding']['equity_offered']} equity</span>
</div>

<div class="footer">
<p><strong>{COMPANY_INFO['name']}</strong> | NIF: {COMPANY_INFO['nif']}<br>
{COMPANY_INFO['address']}<br>
Contacto: João Maria Nhimi (Fundador & CEO)<br>
Documento gerado em {datetime.utcnow().strftime('%d/%m/%Y')}</p>
</div>

</body></html>"""
    
    return HTMLResponse(content=html)
