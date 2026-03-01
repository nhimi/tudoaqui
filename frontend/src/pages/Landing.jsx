import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, UtensilsCrossed, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Car,
      title: 'Taxi com Comparação',
      description: 'Compare preços entre vários provedores e escolha o melhor',
      color: '#D62828'
    },
    {
      icon: UtensilsCrossed,
      title: 'Entrega de Comida',
      description: 'Restaurantes locais com entrega rápida',
      color: '#FCBF49'
    },
    {
      icon: MapPin,
      title: 'Locais Turísticos',
      description: 'Descubra e reserve atracões em Angola',
      color: '#1A1A1A'
    },
    {
      icon: CreditCard,
      title: 'Pagamentos Locais',
      description: 'Multicaixa, Unitel Money, BAI Paga',
      color: '#2A9D8F'
    }
  ];

  return (
    <div className="mobile-container">
      <div 
        className="min-h-screen bg-gradient-to-br from-[#F7F5F0] via-[#F7F5F0] to-[#FCBF49]/20 relative overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1562859422-29f5c0f4b24d?crop=entropy&cs=srgb&fm=jpg&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#F7F5F0]"></div>
        
        <div className="relative z-10 px-6 pt-16 pb-32">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
              TudoAqui
            </h1>
            <p className="text-xl text-white/90 font-medium">Tudo que precisa, num só lugar</p>
            <p className="text-sm text-white/70 mt-2">Desenvolvido por Sincesoft-Sinceridade Service</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-6 hover-lift"
                data-testid={`feature-${idx}`}
              >
                <feature.icon size={32} style={{ color: feature.color }} strokeWidth={2} />
                <h3 className="font-bold text-[#1A1A1A] mt-3 mb-1 text-base">{feature.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              data-testid="landing-get-started-btn"
              onClick={() => navigate('/login')}
              className="w-full h-14 text-lg font-bold bg-[#D62828] hover:bg-[#D62828]/90 text-white rounded-xl btn-shadow"
            >
              Começar Agora
              <ArrowRight className="ml-2" size={20} />
            </Button>
            
            <p className="text-center text-white/80 text-sm">
              Já tem conta?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-[#FCBF49] font-semibold hover:underline"
                data-testid="landing-login-link"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}