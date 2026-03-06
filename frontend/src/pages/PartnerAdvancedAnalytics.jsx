import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Users,
  Wallet, BarChart3, Clock, CalendarDays, Crown, ArrowUpRight, ArrowDownRight,
  ShoppingBag, Percent, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#D62828', '#2A9D8F', '#FCBF49', '#9333EA', '#0D9488', '#F97316'];

export default function PartnerAdvancedAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/analytics/advanced`, { credentials: 'include' });
      if (res.status === 404) { navigate('/partner/register'); return; }
      if (!res.ok) throw new Error('Erro ao carregar analytics');
      setData(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FCBF49] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
        <Card className="p-8 text-center bg-[#1A1A1A] border-white/10 rounded-xl">
          <p className="text-gray-400">Registe-se como parceiro para ver analytics</p>
          <Button onClick={() => navigate('/partner/register')} className="mt-4 bg-[#FCBF49] text-[#1A1A1A]" data-testid="register-partner-btn">
            Registar como Parceiro
          </Button>
        </Card>
      </div>
    );
  }

  const { partner, tier_info, kpis, charts, top_services, recent_transactions } = data;

  const KpiCard = ({ label, value, icon: Icon, color, bgColor, growth, prefix = '' }) => (
    <Card className="p-4 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
        {growth !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{prefix}{typeof value === 'number' ? value.toLocaleString('pt-AO') : value}</p>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-AO') : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0F0F0F] border-b border-white/5 px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => navigate('/partner/dashboard')} variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5" data-testid="back-btn">
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white" data-testid="analytics-title">Analytics Avancado</h1>
                <span className="px-2 py-0.5 bg-[#FCBF49]/20 text-[#FCBF49] text-xs font-bold rounded-full uppercase">
                  {tier_info?.name || 'Basico'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{partner?.business_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          <KpiCard label="Receita Total" value={fmtKz(kpis?.total_revenue)} icon={DollarSign} color="text-emerald-400" bgColor="bg-emerald-500/10" growth={kpis?.revenue_growth_pct} />
          <KpiCard label="Receita Liquida" value={fmtKz(kpis?.net_revenue)} icon={TrendingUp} color="text-[#2A9D8F]" bgColor="bg-[#2A9D8F]/10" />
          <KpiCard label="Total Pedidos" value={kpis?.total_orders || 0} icon={ShoppingBag} color="text-[#FCBF49]" bgColor="bg-[#FCBF49]/10" growth={kpis?.orders_growth_pct} />
          <KpiCard label="Ticket Medio" value={fmtKz(kpis?.avg_order_value)} icon={Activity} color="text-purple-400" bgColor="bg-purple-500/10" />
          <KpiCard label="Saldo Carteira" value={fmtKz(kpis?.wallet_balance)} icon={Wallet} color="text-[#D62828]" bgColor="bg-[#D62828]/10" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#1A1A1A] border border-white/5 p-1 rounded-xl" data-testid="analytics-tabs">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white text-gray-400 rounded-lg">
              <BarChart3 size={16} className="mr-2" />Visao Geral
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white text-gray-400 rounded-lg">
              <TrendingUp size={16} className="mr-2" />Receita
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#FCBF49] data-[state=active]:text-[#1A1A1A] text-gray-400 rounded-lg">
              <Clock size={16} className="mr-2" />Atividade
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#9333EA] data-[state=active]:text-white text-gray-400 rounded-lg">
              <CalendarDays size={16} className="mr-2" />Transacoes
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Revenue Chart */}
              <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="monthly-chart">
                <h3 className="text-white font-bold mb-4">Receita Mensal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.monthly_revenue?.slice(0, 6).reverse() || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#2A9D8F" radius={[4, 4, 0, 0]} name="Receita" />
                      <Bar dataKey="commission" fill="#D62828" radius={[4, 4, 0, 0]} name="Comissao" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Commission Breakdown */}
              <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="commission-card">
                <h3 className="text-white font-bold mb-4">Distribuicao Financeira</h3>
                <div className="h-64" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Receita Liquida', value: kpis?.net_revenue || 0 },
                          { name: 'Comissoes', value: kpis?.total_commission || 0 },
                          { name: 'Levantamentos', value: kpis?.total_payouts || 0 }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((idx) => (
                          <Cell key={idx} fill={COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {[
                    { label: 'Liquida', color: '#D62828' },
                    { label: 'Comissoes', color: '#2A9D8F' },
                    { label: 'Levantamentos', color: '#FCBF49' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Services & Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl lg:col-span-2" data-testid="top-services">
                <h3 className="text-white font-bold mb-4">Servicos Principais</h3>
                {(top_services || []).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Nenhum servico registrado</p>
                ) : (
                  <div className="space-y-3">
                    {top_services.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${COLORS[idx]}20`, color: COLORS[idx] }}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{s.title}</p>
                            <p className="text-gray-500 text-xs">{s.views || 0} visualizacoes</p>
                          </div>
                        </div>
                        <span className="text-[#2A9D8F] font-bold text-sm">{fmtKz(s.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5 bg-gradient-to-br from-[#9333EA]/20 to-[#9333EA]/5 border-[#9333EA]/20 rounded-xl" data-testid="tier-card">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={20} className="text-[#FCBF49]" />
                  <h3 className="text-white font-bold">Plano {tier_info?.name}</h3>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Comissao</span>
                    <span className="text-white font-bold">{((partner?.commission_rate || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Servicos</span>
                    <span className="text-white font-bold">{kpis?.active_services}/{kpis?.total_services}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {(tier_info?.features || []).map((f, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-[#2A9D8F] mt-0.5 shrink-0">&#10003;</span>{f}
                    </li>
                  ))}
                </ul>
                {partner?.tier !== 'enterprise' && (
                  <Button className="w-full bg-[#9333EA] hover:bg-[#9333EA]/90 text-white" data-testid="upgrade-btn">
                    Fazer Upgrade
                  </Button>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="daily-chart">
              <h3 className="text-white font-bold mb-4">Receita Diaria (ultimos 30 dias)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.daily_revenue?.reverse() || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#2A9D8F" fill="url(#colorRevenue)" name="Receita" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="revenue-trend">
              <h3 className="text-white font-bold mb-4">Tendencia de Pedidos</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.monthly_revenue?.slice(0, 6).reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="orders" stroke="#FCBF49" strokeWidth={2} dot={{ r: 4 }} name="Pedidos" />
                    <Line type="monotone" dataKey="net" stroke="#2A9D8F" strokeWidth={2} dot={{ r: 4 }} name="Receita Liquida" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="hourly-chart">
                <h3 className="text-white font-bold mb-4">Distribuicao por Hora</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.hourly_distribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="hour" stroke="#666" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" fill="#FCBF49" radius={[3, 3, 0, 0]} name="Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="weekday-chart">
                <h3 className="text-white font-bold mb-4">Distribuicao por Dia da Semana</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.weekday_distribution || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" stroke="#666" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="day" type="category" stroke="#666" tick={{ fontSize: 12 }} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" fill="#9333EA" radius={[0, 4, 4, 0]} name="Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="p-5 bg-[#1A1A1A] border-white/5 rounded-xl" data-testid="transactions-list">
              <h3 className="text-white font-bold mb-4">Transacoes Recentes</h3>
              {(recent_transactions || []).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Nenhuma transacao registrada</p>
              ) : (
                <div className="space-y-2">
                  {recent_transactions.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition-colors" data-testid={`txn-${idx}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          t.type === 'credit' ? 'bg-emerald-500/10' : t.type === 'commission' ? 'bg-orange-500/10' : 'bg-red-500/10'
                        }`}>
                          <DollarSign size={18} className={
                            t.type === 'credit' ? 'text-emerald-400' : t.type === 'commission' ? 'text-orange-400' : 'text-red-400'
                          } />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{t.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                              t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                              t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'
                            }`}>{t.status}</span>
                            <p className="text-gray-500 text-xs">
                              {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-AO') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        t.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {t.type === 'credit' ? '+' : '-'}{fmtKz(Math.abs(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
