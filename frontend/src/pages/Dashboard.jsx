import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Car, UtensilsCrossed, MapPin, Building2, Bell, Shield, BarChart3, Briefcase, Gift, Ticket, Flame, CreditCard, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useWebSocket';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);
  const { unreadCount, notifications: wsNotifications, connected: wsConnected } = useNotifications(user?.user_id);

  useEffect(() => {
    if (wsNotifications.length > 0) {
      const latest = wsNotifications[0];
      toast.info(latest.title, { description: latest.message });
    }
  }, [wsNotifications]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/streak/checkin`, { method: 'POST', credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setStreak(d);
          if (d.is_new_day && d.points_earned > 0) {
            toast.success(`Streak! +${d.points_earned} pontos (x${d.multiplier})`);
          }
        }
      })
      .catch(() => {});
  }, []);

  const quickActions = [
    { title: 'Tuendi', description: 'Viagens e entregas', icon: Car, color: '#0D9488', path: '/tuendi', testId: 'dashboard-tuendi-card' },
    { title: 'Pedir Comida', description: 'Restaurantes', icon: UtensilsCrossed, color: '#FCBF49', path: '/restaurants', testId: 'dashboard-food-card' },
    { title: 'Turismo', description: 'Hotéis e resorts', icon: MapPin, color: '#2A9D8F', path: '/tourism', testId: 'dashboard-tourism-card' },
    { title: 'Imóveis', description: 'Casas e apartamentos', icon: Building2, color: '#9333EA', path: '/properties', testId: 'dashboard-properties-card' }
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.admin_role;
  const isPartner = user?.is_partner;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div 
          className="bg-gradient-to-br from-[#D62828] to-[#D62828]/80 px-6 pt-12 pb-20 rounded-b-[2rem] relative overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1743172140481-5c7044dd23d6?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'multiply'
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-white" data-testid="dashboard-greeting">
                Olá, {user?.name?.split(' ')[0] || 'Amigo'}!
              </h1>
              <div className="flex gap-2">
                <button onClick={() => navigate('/notifications')} className="relative w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition" data-testid="notifications-btn">
                  <Bell size={20} className="text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FCBF49] text-[#1A1A1A] text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                {isAdmin && (
                  <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition" data-testid="admin-btn">
                    <Shield size={20} className="text-white" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-white/90 text-sm">O que precisa hoje?</p>
            
            {/* Streak Badge */}
            {streak && streak.current_streak > 0 && (
              <div data-testid="streak-badge" className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl">
                <Flame size={18} className="text-orange-300" />
                <span className="text-white font-bold text-sm">{streak.current_streak} dias</span>
                {streak.multiplier > 1 && <span className="text-[#FCBF49] font-black text-xs">x{streak.multiplier}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 -mt-12">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {quickActions.map((action, idx) => (
              <Card key={idx} data-testid={action.testId} onClick={() => navigate(action.path)}
                className="p-5 hover-lift cursor-pointer bg-white border-black/5 rounded-xl shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${action.color}15` }}>
                  <action.icon size={22} style={{ color: action.color }} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-sm mb-0.5">{action.title}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </Card>
            ))}
          </div>

          {/* Quick Tools */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button onClick={() => navigate('/coupons')} data-testid="coupons-link" className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Ticket size={18} className="text-emerald-600" /></div>
              <span className="text-xs font-semibold text-gray-700">Cupons</span>
            </button>
            <button onClick={() => navigate('/payments')} data-testid="payments-link" className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center"><CreditCard size={18} className="text-teal-600" /></div>
              <span className="text-xs font-semibold text-gray-700">Pagar</span>
            </button>
            <button onClick={() => navigate('/referral')} data-testid="referral-link" className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><Gift size={18} className="text-purple-600" /></div>
              <span className="text-xs font-semibold text-gray-700">Convidar</span>
            </button>
            <button onClick={() => navigate('/reports')} data-testid="reports-link" className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover-lift">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><FileSpreadsheet size={18} className="text-gray-600" /></div>
              <span className="text-xs font-semibold text-gray-700">Relatórios</span>
            </button>
          </div>

          {/* Promo Card */}
          <Card className="p-5 bg-gradient-to-br from-[#FCBF49] to-[#FCBF49]/80 border-none rounded-2xl text-[#1A1A1A]">
            <h3 className="font-bold text-lg mb-1">Promoção Especial!</h3>
            <p className="text-sm mb-3 opacity-90">
              Primeira corrida com 20% de desconto. Use o código <span className="font-bold">TUENDI20</span>
            </p>
            <Button data-testid="promo-cta-btn" onClick={() => navigate('/tuendi')}
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white font-semibold h-10 rounded-lg"
            >Pedir Tuendi</Button>
          </Card>

          {/* Partner / Admin Cards */}
          <Card className="p-5 bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 border-none rounded-2xl text-white mt-4">
            <h3 className="font-bold text-lg mb-1">Tem um Negócio?</h3>
            <p className="text-sm mb-3 opacity-90">Torne-se parceiro TudoAqui</p>
            <Button data-testid="become-partner-btn"
              onClick={() => navigate(isPartner ? '/partner/dashboard' : '/partner/register')}
              className="bg-white text-[#9333EA] hover:bg-white/90 font-semibold h-10 rounded-lg"
            >{isPartner ? 'Dashboard Parceiro' : 'Tornar-se Parceiro'}</Button>
          </Card>

          {/* Role-based Quick Links */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card data-testid="my-orders-link" onClick={() => navigate('/orders')} className="p-4 bg-white border-black/5 rounded-xl shadow-sm hover-lift cursor-pointer flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D62828]/10 rounded-lg flex items-center justify-center"><Briefcase size={20} className="text-[#D62828]" /></div>
              <div><p className="font-bold text-sm text-[#1A1A1A]">Meus Pedidos</p><p className="text-xs text-gray-500">Histórico</p></div>
            </Card>
            {isPartner && (
              <Card data-testid="partner-analytics-link" onClick={() => navigate('/partner/analytics')} className="p-4 bg-white border-black/5 rounded-xl shadow-sm hover-lift cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-lg flex items-center justify-center"><BarChart3 size={20} className="text-[#2A9D8F]" /></div>
                <div><p className="font-bold text-sm text-[#1A1A1A]">Analytics</p><p className="text-xs text-gray-500">Vendas</p></div>
              </Card>
            )}
            {isAdmin && (
              <Card data-testid="admin-reports-link" onClick={() => navigate('/reports')} className="p-4 bg-white border-black/5 rounded-xl shadow-sm hover-lift cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A1A1A]/10 rounded-lg flex items-center justify-center"><FileSpreadsheet size={20} className="text-[#1A1A1A]" /></div>
                <div><p className="font-bold text-sm text-[#1A1A1A]">Relatórios Admin</p><p className="text-xs text-gray-500">Exportar</p></div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}