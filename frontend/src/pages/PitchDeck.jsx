import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, Download, Users, Building2, TrendingUp, Target, Shield, 
  Handshake, Megaphone, FlaskConical, DollarSign, Scale, MapPin,
  ChevronRight, Flame, Car, UtensilsCrossed, Smartphone, CreditCard,
  Globe, Award, Zap, CheckCircle, Clock, ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NAV_SECTIONS = [
  { id: 'problema', label: 'Problema', icon: Target },
  { id: 'solucao', label: 'Solução', icon: Zap },
  { id: 'mercado', label: 'Mercado', icon: Globe },
  { id: 'produto', label: 'Produto', icon: Smartphone },
  { id: 'receita', label: 'Receita', icon: DollarSign },
  { id: 'roadmap', label: 'Roadmap', icon: MapPin },
  { id: 'custos', label: 'Custos', icon: TrendingUp },
  { id: 'equipa', label: 'Equipa', icon: Users },
  { id: 'legal', label: 'Legal', icon: Scale },
  { id: 'parcerias', label: 'Parcerias', icon: Handshake },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'testes', label: 'Testes', icon: FlaskConical },
  { id: 'funding', label: 'Série A', icon: Award },
];

const fmtKz = (v) => `${(v || 0).toLocaleString('pt-AO')} Kz`;
const fmtM = (v) => v >= 1_000_000_000 ? `${(v/1_000_000_000).toFixed(1)}B Kz` : `${(v/1_000_000).toFixed(0)}M Kz`;

export default function PitchDeck() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('problema');

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/pitch/data`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportPDF = () => {
    window.open(`${BACKEND_URL}/api/pitch/export`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Carregando apresentação...</div>
    </div>
  );

  if (!data) return null;

  const STATUS_COLORS = { completed: 'bg-emerald-500', in_progress: 'bg-amber-500', planned: 'bg-gray-400' };
  const STATUS_LABELS = { completed: 'Concluído', in_progress: 'Em Curso', planned: 'Planeado' };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 h-14 overflow-x-auto">
          <button onClick={() => navigate(-1)} className="shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center" data-testid="pitch-back-btn">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <span className="text-[#D62828] font-black text-lg shrink-0 mr-2">TudoAqui</span>
          {NAV_SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} data-testid={`nav-${s.id}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${activeSection === s.id ? 'bg-[#D62828] text-white' : 'text-white/50 hover:text-white/80'}`}
            >{s.label}</button>
          ))}
          <Button onClick={exportPDF} size="sm" className="shrink-0 ml-auto bg-white text-[#1A1A1A] hover:bg-white/90 h-8 px-3 text-xs font-bold rounded-full" data-testid="export-pdf-btn">
            <Download size={14} className="mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">

        {/* === COVER === */}
        <div className="text-center py-24" data-testid="pitch-cover">
          <div className="inline-flex items-center gap-2 bg-[#D62828]/20 text-[#D62828] px-4 py-2 rounded-full text-sm font-bold mb-8">
            <Award size={16} /> Ronda Série A
          </div>
          <h1 className="text-6xl sm:text-7xl font-black text-white mb-4">
            Tudo<span className="text-[#D62828]">Aqui</span>
          </h1>
          <p className="text-xl text-white/60 mb-8">O Super App de Angola</p>
          <div className="inline-flex items-center gap-6 text-white/40 text-sm">
            <span>{data.company.name}</span>
            <span>NIF: {data.company.nif}</span>
          </div>
        </div>

        {/* === PROBLEMA === */}
        <section id="problema" className="py-16">
          <SectionTitle icon={Target} title="O Problema" />
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { num: '35M', label: 'Angolanos', sub: 'sem um super app local' },
              { num: '9M', label: 'Em Luanda', sub: 'mercado concentrado' },
              { num: '5+', label: 'Apps diferentes', sub: 'para serviços básicos' }
            ].map((s, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-6 text-center rounded-2xl">
                <p className="text-4xl font-black text-[#D62828]">{s.num}</p>
                <p className="text-white font-bold mt-1">{s.label}</p>
                <p className="text-white/40 text-sm">{s.sub}</p>
              </Card>
            ))}
          </div>
          <Card className="bg-gradient-to-r from-[#D62828]/20 to-transparent border-[#D62828]/30 p-6 mt-6 rounded-2xl">
            <p className="text-white/80 text-lg leading-relaxed">
              Angola enfrenta uma <strong className="text-white">fragmentação massiva de serviços digitais</strong>. 
              Cidadãos precisam de múltiplos apps para mobilidade, alimentação, turismo e imóveis. 
              Soluções existentes são importadas, caras e <strong className="text-white">não suportam pagamentos locais</strong> (Multicaixa, Unitel Money).
            </p>
          </Card>
        </section>

        {/* === SOLUÇÃO === */}
        <section id="solucao" className="py-16">
          <SectionTitle icon={Zap} title="A Solução: TudoAqui" />
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {[
              { icon: Car, title: 'Tuendi', desc: 'Mobilidade: corridas, moto-táxi, entregas', color: '#0D9488' },
              { icon: UtensilsCrossed, title: 'Restaurantes', desc: 'Delivery de comida com menu completo', color: '#FCBF49' },
              { icon: MapPin, title: 'Turismo', desc: 'Hotéis, resorts, experiências angolanas', color: '#2A9D8F' },
              { icon: Building2, title: 'Imóveis', desc: 'Compra, venda e arrendamento', color: '#9333EA' },
              { icon: CreditCard, title: 'Pagamentos', desc: 'Multicaixa, Unitel Money, BAI Paga', color: '#D62828' },
              { icon: Flame, title: 'Fidelização', desc: 'Pontos, streaks, cupons, tiers VIP', color: '#F97316' }
            ].map((m, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}20` }}>
                  <m.icon size={22} style={{ color: m.color }} />
                </div>
                <div>
                  <h3 className="text-white font-bold">{m.title}</h3>
                  <p className="text-white/50 text-sm">{m.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* === MERCADO === */}
        <section id="mercado" className="py-16">
          <SectionTitle icon={Globe} title="Oportunidade de Mercado" />
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { value: '$4.8B', label: data.market.tam.label, desc: data.market.tam.description, gradient: 'from-[#D62828] to-[#D62828]/70' },
              { value: '$680M', label: data.market.sam.label, desc: data.market.sam.description, gradient: 'from-[#0D9488] to-[#0D9488]/70' },
              { value: '$45M', label: data.market.som.label, desc: data.market.som.description, gradient: 'from-[#9333EA] to-[#9333EA]/70' }
            ].map((m, i) => (
              <Card key={i} className={`bg-gradient-to-br ${m.gradient} border-0 p-6 rounded-2xl text-white`}>
                <p className="text-3xl font-black">{m.value}</p>
                <p className="font-bold text-sm mt-2 text-white/90">{m.label}</p>
                <p className="text-xs text-white/60 mt-2">{m.desc}</p>
              </Card>
            ))}
          </div>
          <p className="text-white/40 text-sm mt-4 text-center">Fase 1: Angola | Fase 2: PALOP (Moçambique, Cabo Verde) | Fase 3: Brasil (piloto)</p>
        </section>

        {/* === PRODUTO === */}
        <section id="produto" className="py-16">
          <SectionTitle icon={Smartphone} title="Produto" />
          <Card className="bg-white/5 border-white/10 p-6 rounded-2xl mt-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Funcionalidades Core</h3>
                {['Auth JWT + Google OAuth + Tiers', 'Tuendi: corridas, entregas, chat', 'Restaurantes: menu, carrinho, checkout', 
                  'Turismo: listagens, reservas', 'Imóveis: listagens, inquéritos', 'Carteira digital unificada',
                  'Sistema de pontos e streaks', 'Cupons avançados com tiers', '4 métodos de pagamento locais',
                  'Relatórios CSV com IVA 14%', 'Admin dashboard completo', 'Sistema de parceiros com tiers'
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Stack Tecnológica</h3>
                {[
                  { label: 'Frontend', value: 'React, Tailwind CSS, Shadcn UI' },
                  { label: 'Backend', value: 'FastAPI (Python), MongoDB' },
                  { label: 'Mapas', value: 'Leaflet / React-Leaflet' },
                  { label: 'Auth', value: 'JWT + OAuth 2.0' },
                  { label: 'Pagamentos', value: 'Multicaixa, Unitel Money, BAI Paga' },
                  { label: 'Infraestrutura', value: 'Cloud (AWS/Azure Africa)' }
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-[#FCBF49] text-xs font-bold w-24 shrink-0">{t.label}</span>
                    <span className="text-white/60 text-sm">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* === RECEITA === */}
        <section id="receita" className="py-16">
          <SectionTitle icon={DollarSign} title="Modelo de Receita" />
          <div className="space-y-3 mt-8">
            {data.revenue_model.map((r, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{r.stream}</p>
                  <p className="text-white/40 text-xs">Taxa: {r.rate}</p>
                </div>
                <p className="text-[#FCBF49] font-bold">{fmtM(r.projected_year1)}</p>
              </Card>
            ))}
            <Card className="bg-[#D62828] border-0 p-5 rounded-xl flex items-center justify-between">
              <p className="text-white font-bold text-lg">Total Receita Ano 1</p>
              <p className="text-white font-black text-xl">{fmtM(data.revenue_model.reduce((a, r) => a + r.projected_year1, 0))}</p>
            </Card>
          </div>
        </section>

        {/* === ROADMAP === */}
        <section id="roadmap" className="py-16">
          <SectionTitle icon={MapPin} title="Roadmap" />
          <div className="space-y-4 mt-8">
            {data.roadmap.map((r, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_COLORS[r.status]}`} />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold">{r.phase}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-white/30" />
                      <span className="text-white/40 text-xs">{r.timeline}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]} text-white`}>{STATUS_LABELS[r.status]}</span>
                    </div>
                  </div>
                  <span className="text-[#FCBF49] font-bold text-sm">{fmtM(r.cost)}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-1">
                  {r.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 py-1">
                      <ChevronRight size={12} className="text-white/20" />
                      <span className="text-white/60 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-emerald-400 text-xs mt-3 font-semibold">Meta: {r.milestone}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* === CUSTOS === */}
        <section id="custos" className="py-16">
          <SectionTitle icon={TrendingUp} title="Projecções Financeiras" />
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { year: 'Ano 1', ...data.projections.year1 },
              { year: 'Ano 2', ...data.projections.year2 },
              { year: 'Ano 3', ...data.projections.year3 }
            ].map((y, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl">
                <h3 className="text-white font-bold text-lg mb-4">{y.year}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white/40 text-sm">Utilizadores</span><span className="text-white font-bold">{y.users.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-white/40 text-sm">Parceiros</span><span className="text-white font-bold">{y.partners.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-white/40 text-sm">Receita</span><span className="text-emerald-400 font-bold">{fmtM(y.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-white/40 text-sm">Custos</span><span className="text-red-400 font-bold">{fmtM(y.costs)}</span></div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-white font-bold text-sm">Resultado</span>
                    <span className={`font-black ${y.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{y.net >= 0 ? '+' : ''}{fmtM(y.net)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="bg-[#0D9488]/10 border-[#0D9488]/30 p-4 rounded-xl mt-4 text-center">
            <p className="text-[#0D9488] font-bold">Break-even projectado no mês 14. ROI de 3x no Ano 3.</p>
          </Card>

          <h3 className="text-white font-bold text-lg mt-10 mb-4">Estrutura de Custos (Ano 1)</h3>
          <div className="space-y-2">
            {Object.entries(data.costs_year1).map(([k, v], i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 text-sm">{v.description}</span>
                    <span className="text-white font-bold text-sm">{fmtM(v.amount)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D62828] rounded-full" style={{ width: `${(v.amount / 320_000_000) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === EQUIPA === */}
        <section id="equipa" className="py-16">
          <SectionTitle icon={Users} title="Equipa" />
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {data.company.team.map((m, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D62828] to-[#D62828]/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-black text-lg">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <h4 className="text-white font-bold text-sm">{m.name}</h4>
                <p className="text-[#FCBF49] text-xs font-semibold mt-1">{m.role}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* === LEGAL === */}
        <section id="legal" className="py-16">
          <SectionTitle icon={Scale} title="Legalidade & Compliance" />
          <div className="space-y-2 mt-8">
            {data.legal.map((l, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{l.item}</p>
                  <p className="text-white/40 text-xs">{l.entity}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm font-mono">{l.cost > 0 ? fmtKz(l.cost) : 'Activo'}</p>
                  <span className={`text-xs ${l.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {l.status === 'active' ? 'Activo' : 'Necessário'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* === PARCERIAS === */}
        <section id="parcerias" className="py-16">
          <SectionTitle icon={Handshake} title="Parcerias Estratégicas" />
          <div className="space-y-4 mt-8">
            {data.partnerships.map((p, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl">
                <h3 className="text-[#FCBF49] font-bold text-sm">{p.partner}</h3>
                <p className="text-white font-semibold text-sm mt-1">{p.names}</p>
                <p className="text-white/50 text-xs mt-2">{p.benefit}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* === MARKETING === */}
        <section id="marketing" className="py-16">
          <SectionTitle icon={Megaphone} title="Estratégia de Marketing" />
          <div className="space-y-4 mt-8">
            {data.marketing_strategy.map((m, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm">{m.phase}</h3>
                  <span className="text-[#D62828] font-black text-lg">{m.budget_percent}%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.activities.map((a, j) => (
                    <span key={j} className="bg-white/5 text-white/60 px-3 py-1.5 rounded-lg text-xs">{a}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* === TESTES === */}
        <section id="testes" className="py-16">
          <SectionTitle icon={FlaskConical} title="Fases de Teste" />
          <div className="space-y-3 mt-8">
            {data.testing_strategy.map((t, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-4 rounded-xl flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0D9488]/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[#0D9488] font-black text-sm">{i + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold text-sm">{t.phase}</h4>
                    <span className="text-white/30 text-xs">{t.timeline}</span>
                  </div>
                  <p className="text-white/50 text-xs mt-1">{t.scope}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* === FUNDING === */}
        <section id="funding" className="py-16">
          <SectionTitle icon={Award} title="Série A" />
          <Card className="bg-gradient-to-br from-[#D62828] to-[#D62828]/70 border-0 p-8 rounded-3xl text-center mt-8">
            <p className="text-white/70 text-sm">Estamos a levantar</p>
            <p className="text-5xl font-black text-white mt-2">{fmtM(data.funding.target)}</p>
            <p className="text-white/60 text-sm mt-1">~${data.funding.target_usd.toLocaleString()} USD</p>
            <div className="flex justify-center gap-8 mt-6">
              <div>
                <p className="text-white/50 text-xs">Pre-Money</p>
                <p className="text-white font-bold">{fmtM(data.funding.pre_money_valuation)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Equity</p>
                <p className="text-white font-bold">{data.funding.equity_offered}</p>
              </div>
            </div>
          </Card>

          <h3 className="text-white font-bold mt-8 mb-4">Uso dos Fundos</h3>
          <div className="space-y-3">
            {data.funding.use_of_funds.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-white/40 text-sm w-8">{u.percent}%</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white/70 text-sm">{u.category}</span>
                    <span className="text-white font-bold text-sm">{fmtM(u.amount)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D62828] to-[#FCBF49] rounded-full" style={{ width: `${u.percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === CTA === */}
        <section className="py-20 text-center">
          <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 p-10 rounded-3xl">
            <h2 className="text-4xl font-black text-white mb-4">
              Tudo<span className="text-[#D62828]">Aqui</span>
            </h2>
            <p className="text-white/60 text-lg mb-8">O Super App que Angola precisa.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={exportPDF} className="bg-[#D62828] hover:bg-[#D62828]/90 text-white px-8 h-12 rounded-xl font-bold" data-testid="final-export-btn">
                <Download size={18} className="mr-2" /> Descarregar Apresentação PDF
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 rounded-xl font-bold" data-testid="view-app-btn">
                Ver App Demo <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
            <div className="mt-10 text-white/30 text-sm">
              <p className="font-bold text-white/50">{data.company.name}</p>
              <p>NIF: {data.company.nif} | {data.company.address}</p>
              <p className="mt-2">Contacto: João Maria Nhimi (Fundador & CEO)</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#D62828]/20 rounded-xl flex items-center justify-center">
        <Icon size={20} className="text-[#D62828]" />
      </div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
    </div>
  );
}
