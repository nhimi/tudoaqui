import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MapPin, ArrowRight, TrendingUp, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Taxi() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    pickup: '',
    destination: ''
  });

  const handleCompare = async () => {
    if (!formData.pickup || !formData.destination) {
      toast.error('Preencha origem e destino');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/rides/compare?pickup_lat=-8.8383&pickup_lng=13.2344&dest_lat=-8.8500&dest_lng=13.2500`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) throw new Error('Erro ao comparar preços');

      const data = await response.json();
      setProviders(data.providers);
      setStep('compare');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = async (provider) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickup_address: formData.pickup,
          pickup_lat: -8.8383,
          pickup_lng: 13.2344,
          destination_address: formData.destination,
          destination_lat: -8.8500,
          destination_lng: 13.2500,
          provider: provider.name
        })
      });

      if (!response.ok) throw new Error('Erro ao solicitar corrida');

      toast.success(`Corrida solicitada com ${provider.name}!`);
      navigate('/orders');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div 
          className="h-48 bg-gradient-to-br from-[#D62828] to-[#D62828]/80 px-6 pt-12 pb-6 relative overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1724131138554-810b877451b3?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply'
          }}
        >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="taxi-page-title">Solicitar Taxi</h1>
            <p className="text-white/90 text-sm">Compare preços e escolha o melhor</p>
          </div>
        </div>

        <div className="px-6 -mt-8">
          {step === 'input' && (
            <Card className="p-6 bg-white border-black/5 rounded-2xl shadow-lg mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pickup" className="text-[#1A1A1A] font-semibold">Origem</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D62828]" size={20} />
                    <Input
                      id="pickup"
                      data-testid="taxi-pickup-input"
                      placeholder="Onde está?"
                      className="pl-11 h-12 border-gray-200 focus:border-[#D62828]"
                      value={formData.pickup}
                      onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="destination" className="text-[#1A1A1A] font-semibold">Destino</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FCBF49]" size={20} />
                    <Input
                      id="destination"
                      data-testid="taxi-destination-input"
                      placeholder="Para onde vai?"
                      className="pl-11 h-12 border-gray-200 focus:border-[#D62828]"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  data-testid="taxi-compare-btn"
                  onClick={handleCompare}
                  disabled={loading}
                  className="w-full h-12 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-lg btn-shadow mt-2"
                >
                  {loading ? 'A comparar...' : 'Comparar Preços'}
                  <TrendingUp className="ml-2" size={20} />
                </Button>
              </div>
            </Card>
          )}

          {step === 'compare' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1A1A1A]" data-testid="comparison-results-title">Resultados</h2>
                <Button
                  data-testid="back-to-input-btn"
                  onClick={() => setStep('input')}
                  variant="ghost"
                  className="text-[#D62828]"
                >
                  Voltar
                </Button>
              </div>

              {providers.map((provider, idx) => (
                <Card
                  key={idx}
                  data-testid={`provider-card-${idx}`}
                  className="p-5 bg-white border-black/5 rounded-xl shadow-sm hover-lift cursor-pointer"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-[#1A1A1A] text-lg">{provider.name}</h3>
                        {idx === 0 && (
                          <span className="bg-[#2A9D8F] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            Melhor Preço
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {provider.eta}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={14} className="fill-[#FCBF49] text-[#FCBF49]" />
                          {provider.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#D62828]">{provider.price} Kz</div>
                      <ArrowRight className="text-gray-400 ml-auto mt-1" size={20} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 border-none rounded-2xl text-white mt-6">
            <h3 className="font-bold text-lg mb-2">Dica</h3>
            <p className="text-sm opacity-90">
              Os preços variam de acordo com a demanda. Reserve com antecedência para melhores tarifas!
            </p>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}