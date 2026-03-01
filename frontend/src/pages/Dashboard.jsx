import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Car, UtensilsCrossed, MapPin, Building2, Bell, Shield, BarChart3, Briefcase } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/notifications/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { unread_count: 0 })
      .then(d => setUnreadNotifs(d.unread_count || 0))
      .catch(() => {});
  }, []);

  const quickActions = [
    {
      title: 'Solicitar Taxi',
      description: 'Compare preços e escolha',
      icon: Car,
      color: '#D62828',
      path: '/taxi',
      testId: 'dashboard-taxi-card'
    },
    {
      title: 'Pedir Comida',
      description: 'Restaurantes próximos',
      icon: UtensilsCrossed,
      color: '#FCBF49',
      path: '/restaurants',
      testId: 'dashboard-food-card'
    },
    {
      title: 'Explorar Turismo',
      description: 'Hotéis, resorts e mais',
      icon: MapPin,
      color: '#2A9D8F',
      path: '/tourism',
      testId: 'dashboard-tourism-card'
    },
    {
      title: 'Encontrar Imóveis',
      description: 'Casas, apartamentos',
      icon: Building2,
      color: '#9333EA',
      path: '/properties',
      testId: 'dashboard-properties-card'
    }
  ];

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div 
          className="bg-gradient-to-br from-[#D62828] to-[#D62828]/80 px-6 pt-12 pb-20 rounded-b-[2rem] relative overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1743172140481-5c7044dd23d6?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply'
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
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FCBF49] text-[#1A1A1A] text-xs font-bold rounded-full flex items-center justify-center">{unreadNotifs}</span>
                  )}
                </button>
                {user?.admin_role && (
                  <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition" data-testid="admin-btn">
                    <Shield size={20} className="text-white" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-white/90 text-sm">O que precisa hoje?</p>
          </div>
        </div>

        <div className="px-6 -mt-12">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {quickActions.map((action, idx) => (
              <Card
                key={idx}
                data-testid={action.testId}
                onClick={() => navigate(action.path)}
                className="p-6 hover-lift cursor-pointer bg-white border-black/5 rounded-xl shadow-sm"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon size={24} style={{ color: action.color }} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-base mb-1">{action.title}</h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-gradient-to-br from-[#FCBF49] to-[#FCBF49]/80 border-none rounded-2xl text-[#1A1A1A]">
            <h3 className="font-bold text-lg mb-2">Promoção Especial!</h3>
            <p className="text-sm mb-4 opacity-90">
              Primeira corrida com 20% de desconto. Use o código <span className="font-bold">TUDOAQUI20</span>
            </p>
            <Button 
              data-testid="promo-cta-btn"
              onClick={() => navigate('/taxi')}
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white font-semibold h-10 rounded-lg"
            >
              Solicitar Agora
            </Button>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 border-none rounded-2xl text-white mt-4">
            <h3 className="font-bold text-lg mb-2">Tem um Negócio?</h3>
            <p className="text-sm mb-4 opacity-90">
              Torne-se parceiro TudoAqui e alcance milhares de clientes em Angola
            </p>
            <Button 
              data-testid="become-partner-btn"
              onClick={() => navigate('/partner/register')}
              className="bg-white text-[#9333EA] hover:bg-white/90 font-semibold h-10 rounded-lg"
            >
              Tornar-se Parceiro
            </Button>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}