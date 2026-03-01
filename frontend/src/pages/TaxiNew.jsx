import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, TrendingUp, Clock, Star, CheckCircle, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';
import { AppConnectionManager } from '../components/AppConnectionManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Coordenadas padrão de Luanda
const LUANDA_CENTER = { lat: -8.8383, lng: 13.2344 };

export default function TaxiNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // input, connect-apps, compare, navigation
  const [loading, setLoading] = useState(false);
  const [connectedApps, setConnectedApps] = useState([]);
  const [showAppManager, setShowAppManager] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [route, setRoute] = useState(null);
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    pickupCoords: LUANDA_CENTER,
    destCoords: { lat: -8.8500, lng: 13.2500 }
  });

  useEffect(() => {
    loadConnectedApps();
  }, []);

  const loadConnectedApps = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/taxi/connected-apps`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao carregar apps');
      const data = await response.json();
      setConnectedApps(data.apps || []);
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const handleCompare = async () => {
    if (!formData.pickup || !formData.destination) {
      toast.error('Preencha origem e destino');
      return;
    }

    // Verificar se há apps conectados
    const hasConnectedApps = connectedApps.some(app => app.connected && app.installed);
    
    if (!hasConnectedApps) {
      // Mostrar diálogo pedindo autorização
      setShowAppManager(true);
      return;
    }

    // Continuar com comparação
    await compareRides();
  };

  const compareRides = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/rides/compare?pickup_lat=${formData.pickupCoords.lat}&pickup_lng=${formData.pickupCoords.lng}&dest_lat=${formData.destCoords.lat}&dest_lng=${formData.destCoords.lng}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao comparar preços');
      const data = await response.json();
      
      // Adicionar TudoAqui como opção
      const tudoAquiOption = {
        name: 'TudoAqui GPS',
        price: data.providers[0]?.price * 0.95 || 1500, // 5% mais barato
        eta: '5 min',
        rating: 4.9,
        isTudoAqui: true,
        icon: '🎯'
      };
      
      setProviders([tudoAquiOption, ...data.providers]);
      setStep('compare');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = async (provider) => {
    if (provider.isTudoAqui) {
      // Usar navegação TudoAqui
      await startTudoAquiNavigation();
    } else {
      // Verificar se app está conectado
      const app = connectedApps.find(a => a.app_name === provider.name);
      if (app && app.connected) {
        // Abrir app externo (deep link)
        openExternalApp(provider);
      } else {
        toast.error(`${provider.name} não está conectado. Conecte primeiro.`);
        setShowAppManager(true);
      }
    }
  };

  const startTudoAquiNavigation = async () => {
    setLoading(true);
    try {
      // Obter rota de navegação
      const response = await fetch(
        `${BACKEND_URL}/api/taxi/navigation-route?pickup_lat=${formData.pickupCoords.lat}&pickup_lng=${formData.pickupCoords.lng}&dest_lat=${formData.destCoords.lat}&dest_lng=${formData.destCoords.lng}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao obter rota');
      const routeData = await response.json();
      
      setRoute(routeData);
      setStep('navigation');
      
      // Criar corrida no sistema
      await createRide('TudoAqui GPS', providers.find(p => p.isTudoAqui)?.price || 0);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openExternalApp = async (provider) => {
    // Criar corrida
    await createRide(provider.name, provider.price);
    
    // Deep link para app externo (em mobile real)
    toast.success(`Abrindo ${provider.name}...`);
    
    // Simulação: em produção, seria algo como:
    // window.location.href = `yango://ride?pickup=${formData.pickupCoords.lat},${formData.pickupCoords.lng}&dest=${formData.destCoords.lat},${formData.destCoords.lng}`;
    
    setTimeout(() => {
      navigate('/orders');
    }, 2000);
  };

  const createRide = async (provider, price) => {
    try {
      await fetch(`${BACKEND_URL}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickup_address: formData.pickup,
          pickup_lat: formData.pickupCoords.lat,
          pickup_lng: formData.pickupCoords.lng,
          destination_address: formData.destination,
          destination_lat: formData.destCoords.lat,
          destination_lng: formData.destCoords.lng,
          provider: provider
        })
      });
    } catch (error) {
      console.error('Error creating ride:', error);
    }
  };

  const handleAppConnectionChange = () => {
    loadConnectedApps();
    setShowAppManager(false);
    // Se estava tentando comparar, tentar novamente
    if (step === 'input') {
      compareRides();
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
            <p className="text-white/90 text-sm">Compare e escolha a melhor opção</p>
          </div>
          
          <Button
            data-testid="manage-apps-btn"
            onClick={() => setShowAppManager(true)}
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            size="sm"
          >
            <LinkIcon size={18} className="mr-1" />
            Apps ({connectedApps.filter(a => a.connected).length})
          </Button>
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
                <h2 className="text-xl font-bold text-[#1A1A1A]" data-testid="comparison-results-title">Melhores Opções</h2>
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
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{provider.icon || '🚗'}</span>
                        <div>
                          <h3 className="font-bold text-[#1A1A1A] text-lg">{provider.name}</h3>
                          {provider.isTudoAqui && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-[#2A9D8F] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                Navegação Incluída
                              </span>
                              <span className="bg-[#FCBF49] text-[#1A1A1A] text-xs px-2 py-0.5 rounded-full font-semibold">
                                Melhor Preço
                              </span>
                            </div>
                          )}
                        </div>
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
                      <div className="text-2xl font-bold text-[#D62828]">{provider.price.toFixed(2)} Kz</div>
                      <Navigation className="text-gray-400 ml-auto mt-1" size={20} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {step === 'navigation' && route && (
            <div className="space-y-4">
              <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center">
                      <Navigation size={24} className="text-[#2A9D8F]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A]">Navegação TudoAqui</h3>
                      <p className="text-sm text-gray-600">{route.distance} km · {route.duration} min</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/orders')}
                    size="sm"
                    variant="outline"
                  >
                    Finalizar
                  </Button>
                </div>
                
                <TaxiMap route={route} />
              </Card>

              <Card className="p-4 bg-white border-black/5 rounded-xl shadow-sm">
                <h4 className="font-bold text-[#1A1A1A] mb-3">Instruções</h4>
                <div className="space-y-3">
                  {route.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D62828]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#D62828] font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{step.instruction}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.distance.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAppManager} onOpenChange={setShowAppManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar Apps de Taxi</DialogTitle>
            <DialogDescription>
              Conecte seus apps de taxi instalados para comparação de preços real
            </DialogDescription>
          </DialogHeader>
          <AppConnectionManager 
            apps={connectedApps}
            onConnectionChange={handleAppConnectionChange}
          />
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}