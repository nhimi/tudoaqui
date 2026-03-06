import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Car, UtensilsCrossed, MapPin, Building2, CreditCard, Shield, Smartphone,
  ArrowRight, ChevronDown, Star, Users, TrendingUp, Zap, Gift, Clock,
  CheckCircle, Globe, Flame, Award, MessageCircle, Download, Play,
  Menu, X, ChevronRight, Quote, HelpCircle, BarChart3, Rocket
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATS = [
  { value: '50K+', label: 'Utilizadores Alvo', icon: Users },
  { value: '300+', label: 'Parceiros', icon: Building2 },
  { value: '6', label: 'Módulos', icon: Zap },
  { value: '4', label: 'Pagamentos Locais', icon: CreditCard }
];

const FEATURES = [
  { icon: Car, title: 'Tuendi', desc: 'Corridas, moto-táxi e entregas rápidas em Luanda', color: '#0D9488', tag: 'Mobilidade' },
  { icon: UtensilsCrossed, title: 'Restaurantes', desc: 'Peça comida dos melhores restaurantes com delivery', color: '#FCBF49', tag: 'Delivery' },
  { icon: MapPin, title: 'Turismo', desc: 'Descubra hotéis, resorts e experiências angolanas', color: '#2A9D8F', tag: 'Viagens' },
  { icon: Building2, title: 'Imóveis', desc: 'Compra, venda e arrendamento de propriedades', color: '#9333EA', tag: 'Imobiliário' },
  { icon: CreditCard, title: 'Pagamentos', desc: 'Multicaixa Express, Unitel Money, BAI Paga', color: '#D62828', tag: 'Fintech' },
  { icon: Gift, title: 'Fidelização', desc: 'Pontos, streaks diários, cupons e tiers VIP', color: '#F97316', tag: 'Rewards' }
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Registe-se', desc: 'Crie sua conta gratuita em segundos com email ou Google', icon: Smartphone },
  { step: '02', title: 'Escolha o Serviço', desc: 'Mobilidade, comida, turismo, imóveis — tudo num só lugar', icon: Zap },
  { step: '03', title: 'Pague Localmente', desc: 'Use Multicaixa, Unitel Money, BAI Paga ou transferência', icon: CreditCard },
  { step: '04', title: 'Ganhe Pontos', desc: 'Cada uso acumula pontos para descontos e benefícios VIP', icon: Award }
];

const TESTIMONIALS = [
  { name: 'Ana Luísa M.', role: 'Utilizadora', text: 'Finalmente um app angolano que funciona! Uso o Tuendi todos os dias para ir ao trabalho e pedir comida ao almoço.', stars: 5, city: 'Luanda' },
  { name: 'Pedro C.', role: 'Dono de Restaurante', text: 'Desde que me tornei parceiro TudoAqui, as minhas vendas aumentaram 40%. O sistema de gestão de pedidos é excelente.', stars: 5, city: 'Benguela' },
  { name: 'Maria J.', role: 'Agente Imobiliária', text: 'A plataforma de imóveis trouxe-me 3x mais leads qualificados do que os métodos tradicionais. Recomendo!', stars: 5, city: 'Luanda' }
];

const PLANS = [
  { name: 'Gratuito', price: '0', period: 'sempre', features: ['Todos os módulos', 'Pagamentos locais', 'Suporte básico', 'Pontos e streaks'], cta: 'Começar Grátis', popular: false },
  { name: 'Premium', price: '2.500', period: '/mês', features: ['Tudo do Gratuito', 'Sem taxas de entrega', 'Suporte prioritário', 'Cupons exclusivos', 'Cashback 2%'], cta: 'Experimentar Premium', popular: true },
  { name: 'Parceiro', price: '15.000', period: '/mês', features: ['Dashboard completo', 'Gestão de pedidos', 'Relatórios CSV', 'Listagem prioritária', 'Suporte dedicado'], cta: 'Tornar-se Parceiro', popular: false }
];

const FAQ = [
  { q: 'O TudoAqui é gratuito?', a: 'Sim! A versão base é totalmente gratuita. Oferecemos planos Premium com benefícios extras como entrega grátis e cashback.' },
  { q: 'Quais métodos de pagamento aceitam?', a: 'Aceitamos Multicaixa Express, Unitel Money, BAI Paga e Transferência Bancária. Todos processados de forma segura.' },
  { q: 'Como funciona o sistema de pontos?', a: 'Cada compra gera pontos (1 por cada 50 Kz). Pontos podem ser trocados por descontos. Streaks diários multiplicam os pontos ganhos.' },
  { q: 'Posso ser parceiro/restaurante?', a: 'Sim! Registe-se como parceiro no app. Temos planos a partir de 15.000 Kz/mês com dashboard de gestão completo.' },
  { q: 'O app funciona fora de Luanda?', a: 'Actualmente operamos em Luanda. Planeamos expandir para Benguela, Huambo e Lobito em 2026, e PALOP em 2027.' },
  { q: 'Os meus dados estão seguros?', a: 'Sim. Usamos encriptação JWT, cookies seguros e cumprimos a legislação angolana de protecção de dados (APD).' }
];

const ROADMAP_PUBLIC = [
  { phase: 'Q1 2026', title: 'Lançamento MVP', items: ['App funcional', '3 módulos core', 'Beta em Luanda'], status: 'done' },
  { phase: 'Q2 2026', title: 'Beta Público', items: ['1.000 utilizadores', '50 parceiros', 'Pagamentos reais'], status: 'current' },
  { phase: 'Q3-Q4 2026', title: 'Crescimento', items: ['Marketing TV/Digital', 'Benguela e Huambo', 'Parcerias operadoras'], status: 'next' },
  { phase: '2027', title: 'Expansão PALOP', items: ['Moçambique', 'Cabo Verde', 'Microcrédito'], status: 'future' }
];

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState('');

  const scrollTo = (id) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen overflow-x-hidden">

      {/* === NAV === */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <span className="text-2xl font-black cursor-pointer" onClick={() => scrollTo('hero')}>
            Tudo<span className="text-[#D62828]">Aqui</span>
          </span>
          <div className="hidden md:flex items-center gap-6">
            {['Funcionalidades', 'Como Funciona', 'Preços', 'Equipa', 'FAQ'].map(s => (
              <button key={s} onClick={() => scrollTo(s.toLowerCase().replace(/ /g, '-'))} className="text-sm text-white/60 hover:text-white transition font-medium">
                {s}
              </button>
            ))}
            <button onClick={() => navigate('/pitch')} className="text-sm text-[#FCBF49] hover:text-[#FCBF49]/80 transition font-bold">Investidores</button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-white hover:bg-white/10" data-testid="nav-login-btn">Entrar</Button>
            <Button onClick={() => navigate('/login')} className="bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-xl px-6" data-testid="nav-signup-btn">Começar Grátis</Button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white" data-testid="mobile-menu-btn">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#0A0A0A] border-t border-white/5 px-4 py-4 space-y-2">
            {['Funcionalidades', 'Como Funciona', 'Preços', 'Equipa', 'FAQ'].map(s => (
              <button key={s} onClick={() => scrollTo(s.toLowerCase().replace(/ /g, '-'))} className="block w-full text-left py-2 text-white/70">{s}</button>
            ))}
            <button onClick={() => { setMobileMenu(false); navigate('/pitch'); }} className="block w-full text-left py-2 text-[#FCBF49] font-bold">Investidores</button>
            <Button onClick={() => navigate('/login')} className="w-full bg-[#D62828] text-white mt-2">Começar Grátis</Button>
          </div>
        )}
      </nav>

      {/* === HERO === */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url('https://images.pexels.com/photos/16337695/pexels-photo-16337695.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D62828]/15 text-[#D62828] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Rocket size={16} /> Novo em Angola
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] mb-6" data-testid="hero-title">
              Tudo que
              <br />precisa,
              <br /><span className="text-[#D62828]">num só app.</span>
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-lg leading-relaxed">
              Mobilidade, comida, turismo, imóveis e pagamentos locais. O primeiro super app feito em Angola, para angolanos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/login')} className="bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold h-14 px-8 rounded-xl text-lg" data-testid="hero-cta-btn">
                Começar Grátis <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button onClick={() => navigate('/pitch')} variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-xl text-lg" data-testid="hero-pitch-btn">
                <Play size={18} className="mr-2" /> Ver Apresentação
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-white/40 text-sm">
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-400" /> Gratuito</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-400" /> Pagamentos Locais</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-400" /> 100% Angolano</span>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-72 h-[500px] bg-gradient-to-br from-[#D62828]/20 to-[#9333EA]/20 rounded-[3rem] border border-white/10 p-3">
                <div className="w-full h-full bg-[#1A1A1A] rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden relative">
                  <span className="text-4xl font-black">Tudo<span className="text-[#D62828]">Aqui</span></span>
                  <p className="text-white/40 text-sm mt-2">O Super App de Angola</p>
                  <div className="grid grid-cols-2 gap-3 mt-8 px-6">
                    {[{ i: Car, c: '#0D9488', t: 'Tuendi' }, { i: UtensilsCrossed, c: '#FCBF49', t: 'Comida' }, { i: MapPin, c: '#2A9D8F', t: 'Turismo' }, { i: Building2, c: '#9333EA', t: 'Imóveis' }].map((m, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                        <m.i size={20} style={{ color: m.c }} className="mx-auto" />
                        <p className="text-xs text-white/60 mt-1">{m.t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-8 bg-[#0D9488] text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold animate-bounce">
                <Flame size={14} className="inline mr-1" /> Streak: 7 dias!
              </div>
              <div className="absolute top-20 -left-8 bg-[#FCBF49] text-[#1A1A1A] px-4 py-2 rounded-xl shadow-lg text-sm font-bold">
                <Star size={14} className="inline mr-1" /> +150 pontos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center" data-testid={`stat-${i}`}>
              <s.icon size={24} className="text-[#D62828] mx-auto mb-2" />
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-sm text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === FUNCIONALIDADES === */}
      <section id="funcionalidades" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#D62828] font-bold text-sm uppercase tracking-wider">Funcionalidades</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Tudo num só lugar</h2>
            <p className="text-white/50 mt-4 max-w-2xl mx-auto">Seis módulos integrados com pagamentos locais angolanos e sistema de fidelização gamificado</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Card key={i} data-testid={`feature-${i}`} className="bg-white/[0.03] border-white/5 p-6 rounded-2xl hover:bg-white/[0.06] transition group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${f.color}20` }}>
                    <f.icon size={24} style={{ color: f.color }} />
                  </div>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">{f.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === COMO FUNCIONA === */}
      <section id="como-funciona" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#0D9488] font-bold text-sm uppercase tracking-wider">Como Funciona</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Simples como 1-2-3-4</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="text-center" data-testid={`step-${i}`}>
                <div className="w-16 h-16 bg-[#D62828]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                  <h.icon size={28} className="text-[#D62828]" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#D62828] rounded-full text-white text-xs font-black flex items-center justify-center">{h.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{h.title}</h3>
                <p className="text-white/50 text-sm">{h.desc}</p>
                {i < 3 && <ChevronRight size={20} className="text-white/10 mx-auto mt-4 hidden lg:block rotate-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === TESTEMUNHOS === */}
      <section id="testemunhos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#FCBF49] font-bold text-sm uppercase tracking-wider">Testemunhos</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">O que dizem sobre nós</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} data-testid={`testimonial-${i}`} className="bg-white/[0.03] border-white/5 p-6 rounded-2xl">
                <Quote size={24} className="text-[#FCBF49]/30 mb-4" />
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D62828] to-[#FCBF49] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role} — {t.city}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-3">{[...Array(t.stars)].map((_, j) => <Star key={j} size={14} className="text-[#FCBF49] fill-[#FCBF49]" />)}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === PREÇOS === */}
      <section id="preços" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#9333EA] font-bold text-sm uppercase tracking-wider">Preços</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Planos para todos</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((p, i) => (
              <Card key={i} data-testid={`plan-${i}`} className={`p-6 rounded-2xl relative ${p.popular ? 'bg-gradient-to-br from-[#D62828] to-[#D62828]/80 border-[#D62828]' : 'bg-white/[0.03] border-white/5'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FCBF49] text-[#1A1A1A] text-xs font-bold px-3 py-1 rounded-full">Popular</span>}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-white/40 text-sm"> Kz{p.period}</span>
                </div>
                <div className="space-y-2 mb-6">
                  {p.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <CheckCircle size={14} className={p.popular ? 'text-white/80' : 'text-emerald-400'} />
                      <span className={`text-sm ${p.popular ? 'text-white/80' : 'text-white/60'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => navigate('/login')} className={`w-full h-12 rounded-xl font-bold ${p.popular ? 'bg-white text-[#D62828] hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {p.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === EQUIPA === */}
      <section id="equipa" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#D62828] font-bold text-sm uppercase tracking-wider">Equipa</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Quem está por trás</h2>
            <p className="text-white/50 mt-4">Sincesoft — Sinceridade Service | NIF: 2403104787</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { name: 'João Maria Nhimi', role: 'Fundador & CEO' },
              { name: 'Miguel da Costa', role: 'Conselheiro Estratégico' },
              { name: 'Eliseu Costa', role: 'Director Técnico / CTO' },
              { name: 'Ansty Cavango', role: 'Finanças / CFO' },
              { name: 'Patruska Victor', role: 'Marketing / CMO' },
              { name: 'João Malonda', role: 'Marketing & Crescimento' }
            ].map((m, i) => (
              <Card key={i} data-testid={`team-${i}`} className="bg-white/[0.03] border-white/5 p-5 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D62828] to-[#D62828]/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-black text-lg">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <h4 className="text-white font-bold text-sm">{m.name}</h4>
                <p className="text-[#FCBF49] text-xs font-semibold mt-1">{m.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === ROADMAP === */}
      <section id="roadmap" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#0D9488] font-bold text-sm uppercase tracking-wider">Roadmap</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">O caminho à frente</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            {ROADMAP_PUBLIC.map((r, i) => {
              const colors = { done: 'bg-emerald-500', current: 'bg-[#FCBF49]', next: 'bg-[#D62828]', future: 'bg-white/20' };
              const textColors = { done: 'text-emerald-400', current: 'text-[#FCBF49]', next: 'text-[#D62828]', future: 'text-white/40' };
              return (
                <Card key={i} className="bg-white/[0.03] border-white/5 p-5 rounded-2xl relative">
                  <div className={`w-2 h-2 rounded-full ${colors[r.status]} mb-3`} />
                  <span className={`text-xs font-bold ${textColors[r.status]}`}>{r.phase}</span>
                  <h3 className="text-white font-bold mt-1 mb-3">{r.title}</h3>
                  {r.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 py-1">
                      <ChevronRight size={12} className="text-white/20" />
                      <span className="text-white/50 text-xs">{item}</span>
                    </div>
                  ))}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#FCBF49] font-bold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} data-testid={`faq-${i}`} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-white font-semibold text-sm pr-4">{f.q}</span>
                  <ChevronDown size={18} className={`text-white/30 transition shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-white/50 text-sm leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === BLOG (Preview) === */}
      <section id="blog" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <span className="text-[#D62828] font-bold text-sm uppercase tracking-wider">Blog</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3">Últimas Notícias</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'TudoAqui lança em Luanda!', desc: 'O primeiro super app angolano começa operações na capital com 50 restaurantes parceiros.', date: 'Mar 2026', tag: 'Lançamento' },
              { title: 'Como ganhar pontos e subir de tier', desc: 'Guia completo do sistema de fidelização: streaks, pontos, cupons e benefícios VIP.', date: 'Mar 2026', tag: 'Guia' },
              { title: 'Parceiros: como aumentar vendas 40%', desc: 'Case study dos primeiros restaurantes parceiros e as métricas de crescimento.', date: 'Abr 2026', tag: 'Parceiros' }
            ].map((b, i) => (
              <Card key={i} data-testid={`blog-${i}`} className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-[#D62828]/30 to-[#9333EA]/30 flex items-center justify-center">
                  <BarChart3 size={48} className="text-white/10" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[#D62828] bg-[#D62828]/10 px-2 py-0.5 rounded">{b.tag}</span>
                    <span className="text-xs text-white/30">{b.date}</span>
                  </div>
                  <h3 className="text-white font-bold group-hover:text-[#D62828] transition">{b.title}</h3>
                  <p className="text-white/50 text-sm mt-2">{b.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">Pronto para experimentar?</h2>
          <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">Junte-se a milhares de angolanos que já descobriram o TudoAqui. Registo gratuito, sem compromisso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/login')} className="bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold h-14 px-10 rounded-xl text-lg" data-testid="final-cta-btn">
              Criar Conta Grátis <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button onClick={() => navigate('/pitch')} variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-10 rounded-xl text-lg">
              Apresentação Investidores
            </Button>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-xl font-black">Tudo<span className="text-[#D62828]">Aqui</span></span>
              <p className="text-white/40 text-sm mt-2">O Super App de Angola</p>
              <p className="text-white/30 text-xs mt-1">Sincesoft — Sinceridade Service</p>
              <p className="text-white/30 text-xs">NIF: 2403104787</p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Produto</h4>
              <div className="space-y-2 text-white/40 text-sm">
                <button onClick={() => scrollTo('funcionalidades')} className="block hover:text-white transition">Funcionalidades</button>
                <button onClick={() => scrollTo('preços')} className="block hover:text-white transition">Preços</button>
                <button onClick={() => scrollTo('roadmap')} className="block hover:text-white transition">Roadmap</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Empresa</h4>
              <div className="space-y-2 text-white/40 text-sm">
                <button onClick={() => scrollTo('equipa')} className="block hover:text-white transition">Equipa</button>
                <button onClick={() => navigate('/pitch')} className="block hover:text-white transition">Investidores</button>
                <button onClick={() => scrollTo('blog')} className="block hover:text-white transition">Blog</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Contacto</h4>
              <p className="text-white/40 text-sm">Ave. Hoji ya Henda 132</p>
              <p className="text-white/40 text-sm">Vila Alice, Rangel</p>
              <p className="text-white/40 text-sm">Luanda, Angola</p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-white/30 text-xs">&copy; 2026 TudoAqui by Sincesoft. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-white/30 text-xs">
              <span>Termos de Uso</span><span>Privacidade</span><span>Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
