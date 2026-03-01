import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, TrendingUp, Clock, Star, CheckCircle, Link as LinkIcon, Car, Phone, User, CreditCard, Bike, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';
import { AppConnectionManager } from '../components/AppConnectionManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LUANDA_CENTER = { lat: -8.8383, lng: 13.2344 };

const VEHICLE_TYPES = [
  { id: 'standard', name: 'Standard', icon: Car, desc: 'Carro económico', multiplier: 1 },
  { id: 'comfort', name: 'Confort', icon: Bike, desc: 'Mais espaço e conforto', multiplier: 1.5 },
  { id: 'premium', name: 'Premium', icon: Crown, desc: 'Viatura de luxo', multiplier: 2.5 }
];

export default function TaxiNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // input, compare, request, tracking, navigation
  const [loading, setLoading] = useState(false);
  const [connectedApps, setConnectedApps] = useState([]);
  const [showAppManager, setShowAppManager] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('standard');
  const [rideData, setRideData] = useState(null);
  const [route, setRoute] = useState(null);
  const [formData, setFormData] = useState({
    pickup: '', destination: '',
    pickupCoords: LUANDA_CENTER,
    destCoords: { lat: -8.8500, lng: 13.2500 }
  });

  useEffect(() => { loadConnectedApps(); }, []);

  const loadConnectedApps = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/taxi/connected-apps`, { credentials: 'include' });
      if (res.ok) { const data = await res.json(); setConnectedApps(data.apps || []); }
    } catch (e) { /* silent */ }
  };

  const handleCompare = async () => {
    if (!formData.pickup || !formData.destination) { toast.error('Preencha origem e destino'); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/rides/compare?pickup_lat=${formData.pickupCoords.lat}&pickup_lng=${formData.pickupCoords.lng}&dest_lat=${formData.destCoords.lat}&dest_lng=${formData.destCoords.lng}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      const tudoAquiOption = {
        name: 'TudoAqui GPS', price: data.providers[0]?.price * 0.95 || 1500,
        eta: '5 min', rating: 4.9, isTudoAqui: true
      };
      setProviders([tudoAquiOption, ...data.providers]);
      setStep('compare');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const handleRequestRide = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rides/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickup_address: formData.pickup,
          destination_address: formData.destination,
          pickup_lat: formData.pickupCoords.lat,
          pickup_lng: formData.pickupCoords.lng,
          dest_lat: formData.destCoords.lat,
          dest_lng: formData.destCoords.lng,
          vehicle_type: selectedVehicle,
          payment_method: 'transferencia'
        })
      });
      if (!res.ok) throw new Error('Erro ao solicitar corrida');
      const ride = await res.json();
      setRideData(ride);
      setStep('tracking');
      toast.success('Corrida aceite! Motorista a caminho.');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const startNavigation = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/taxi/navigation-route?pickup_lat=${formData.pickupCoords.lat}&pickup_lng=${formData.pickupCoords.lng}&dest_lat=${formData.destCoords.lat}&dest_lng=${formData.destCoords.lng}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Erro');
      setRoute(await res.json());
      setStep('navigation');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const completeRide = async () => {
    if (rideData) {
      try {
        await fetch(`${BACKEND_URL}/api/rides/${rideData.ride_id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'concluido' })
        });
      } catch (e) { /* silent */ }
    }
    toast.success('Corrida concluída! Obrigado.');
    setStep('input');
    setRideData(null);
    setRoute(null);
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="h-48 bg-gradient-to-br from-[#D62828] to-[#D62828]/80 px-6 pt-12 pb-6 relative overflow-hidden"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1724131138554-810b877451b3?crop=entropy&cs=srgb&fm=jpg&q=85')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'multiply' }}>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="taxi-page-title">Solicitar Taxi</h1>
            <p className="text-white/90 text-sm">Compare preços ou peça corrida direta</p>
          </div>
          <Button data-testid="manage-apps-btn" onClick={() => setShowAppManager(true)} variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10" size="sm">
            <LinkIcon size={18} className="mr-1" /> Apps ({connectedApps.filter(a => a.connected).length})
          </Button>
        </div>

        <div className="px-6 -mt-8 space-y-4">
          {/* INPUT STEP */}
          {step === 'input' && (
            <Card className="p-6 bg-white border-black/5 rounded-2xl shadow-lg">
              <div className="space-y-4">
                <div>
                  <Label className="text-[#1A1A1A] font-semibold">Origem</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D62828]" size={20} />
                    <Input data-testid="taxi-pickup-input" placeholder="Onde está?" className="pl-11 h-12" value={formData.pickup} onChange={(e) => setFormData({ ...formData, pickup: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-[#1A1A1A] font-semibold">Destino</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FCBF49]" size={20} />
                    <Input data-testid="taxi-destination-input" placeholder="Para onde vai?" className="pl-11 h-12" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                  </div>
                </div>

                {/* Vehicle Type Selection */}
                <div>
                  <Label className="text-[#1A1A1A] font-semibold mb-2 block">Tipo de Viatura</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLE_TYPES.map(v => (
                      <button key={v.id} data-testid={`vehicle-${v.id}`} onClick={() => setSelectedVehicle(v.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${selectedVehicle === v.id ? 'border-[#D62828] bg-[#D62828]/5' : 'border-gray-200'}`}>
                        <v.icon size={24} className={`mx-auto mb-1 ${selectedVehicle === v.id ? 'text-[#D62828]' : 'text-gray-500'}`} />
                        <p className="font-bold text-xs">{v.name}</p>
                        <p className="text-[10px] text-gray-500">{v.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button data-testid="taxi-compare-btn" onClick={handleCompare} disabled={loading} className="h-12 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-lg">
                    {loading ? '...' : 'Comparar'} <TrendingUp className="ml-1" size={18} />
                  </Button>
                  <Button data-testid="taxi-request-direct-btn" onClick={handleRequestRide} disabled={loading || !formData.pickup || !formData.destination} className="h-12 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white font-bold rounded-lg">
                    {loading ? '...' : 'Pedir Corrida'} <Car className="ml-1" size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* COMPARE STEP */}
          {step === 'compare' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1A1A1A]" data-testid="comparison-title">Melhores Opções</h2>
                <Button onClick={() => setStep('input')} variant="ghost" className="text-[#D62828]" data-testid="back-to-input-btn">Voltar</Button>
              </div>
              {providers.map((p, idx) => (
                <Card key={idx} data-testid={`provider-card-${idx}`} className="p-5 bg-white border-black/5 rounded-xl shadow-sm hover-lift cursor-pointer"
                  onClick={() => { if (p.isTudoAqui) { handleRequestRide(); } else { toast.info(`A abrir ${p.name}...`); } }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] text-lg">{p.name}</h3>
                      {p.isTudoAqui && (
                        <div className="flex gap-1 mt-1">
                          <span className="bg-[#2A9D8F] text-white text-xs px-2 py-0.5 rounded-full font-semibold">Navegação</span>
                          <span className="bg-[#FCBF49] text-[#1A1A1A] text-xs px-2 py-0.5 rounded-full font-semibold">Melhor Preço</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1"><Clock size={14} /> {p.eta}</span>
                        <span className="flex items-center gap-1"><Star size={14} className="fill-[#FCBF49] text-[#FCBF49]" /> {p.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#D62828]">{formatKz(p.price)}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* TRACKING STEP - Ride accepted */}
          {step === 'tracking' && rideData && (
            <>
              <Card className="p-5 bg-white border-black/5 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center">
                    <CheckCircle size={28} className="text-[#2A9D8F]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]" data-testid="ride-accepted-title">Corrida Aceite!</h2>
                    <p className="text-sm text-gray-600">Motorista a caminho</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User size={18} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Motorista</p>
                      <p className="font-semibold" data-testid="driver-name">{rideData.driver_name || 'A atribuir...'}</p>
                    </div>
                  </div>
                  {rideData.driver_phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="font-semibold" data-testid="driver-phone">{rideData.driver_phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Car size={18} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Viatura</p>
                      <p className="font-semibold capitalize">{rideData.vehicle_type || 'Standard'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[#D62828]/5 rounded-lg mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Distância</p>
                    <p className="font-bold text-[#1A1A1A]">{rideData.distance_km} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Duração</p>
                    <p className="font-bold text-[#1A1A1A]">{rideData.estimated_duration} min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Preço</p>
                    <p className="font-bold text-[#D62828]" data-testid="ride-price">{formatKz(rideData.price)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={startNavigation} className="flex-1 h-12 bg-[#2A9D8F] text-white font-bold" data-testid="start-navigation-btn">
                    <Navigation size={18} className="mr-1" /> Navegar
                  </Button>
                  <Button onClick={completeRide} className="flex-1 h-12 bg-[#D62828] text-white font-bold" data-testid="complete-ride-btn">
                    <CheckCircle size={18} className="mr-1" /> Concluir
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-[#FCBF49]/10 border-[#FCBF49]/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-[#FCBF49]" />
                  <span className="font-bold text-sm text-[#1A1A1A]">Pagamento: Transferência Bancária</span>
                </div>
                <p className="text-xs text-gray-600">O pagamento será feito diretamente ao motorista/parceiro via transferência</p>
              </Card>
            </>
          )}

          {/* NAVIGATION STEP */}
          {step === 'navigation' && route && (
            <>
              <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center">
                      <Navigation size={24} className="text-[#2A9D8F]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A]">Navegação TudoAqui</h3>
                      <p className="text-sm text-gray-600">{route.distance} km - {route.duration} min</p>
                    </div>
                  </div>
                  <Button onClick={completeRide} size="sm" className="bg-[#D62828] text-white" data-testid="finish-ride-btn">Concluir</Button>
                </div>
                <TaxiMap route={route} />
              </Card>
              <Card className="p-4 bg-white border-black/5 rounded-xl shadow-sm">
                <h4 className="font-bold text-[#1A1A1A] mb-3">Instruções</h4>
                <div className="space-y-3">
                  {route.steps.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D62828]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#D62828] font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.instruction}</p>
                        <p className="text-xs text-gray-500">{s.distance.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={showAppManager} onOpenChange={setShowAppManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar Apps de Taxi</DialogTitle>
            <DialogDescription>Conecte apps instalados para comparação</DialogDescription>
          </DialogHeader>
          <AppConnectionManager apps={connectedApps} onConnectionChange={() => { loadConnectedApps(); setShowAppManager(false); }} />
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
