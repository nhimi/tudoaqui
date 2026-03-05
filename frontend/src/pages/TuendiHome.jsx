import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MapPin, Car, Package, Wallet, History, Star, ChevronRight, Bike, Crown, CarFront, Clock, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LUANDA_CENTER = { lat: -8.8383, lng: 13.2344 };

const VEHICLE_ICONS = {
  moto: Bike,
  standard: Car,
  comfort: CarFront,
  premium: Crown
};

export default function TuendiHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ride');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('standard');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  
  const [rideForm, setRideForm] = useState({
    pickup: '',
    destination: '',
    pickupCoords: LUANDA_CENTER,
    destCoords: { lat: -8.8500, lng: 13.2500 }
  });
  
  const [deliveryForm, setDeliveryForm] = useState({
    pickup: '',
    destination: '',
    pickupCoords: LUANDA_CENTER,
    destCoords: { lat: -8.8500, lng: 13.2500 },
    packageSize: 'small',
    packageDescription: '',
    recipientName: '',
    recipientPhone: ''
  });

  useEffect(() => {
    loadConfig();
    loadWallet();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/config`, { credentials: 'include' });
      if (res.ok) setConfig(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadWallet = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/wallet`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) { console.error(e); }
  };

  const getEstimates = async () => {
    if (!rideForm.pickup || !rideForm.destination) {
      toast.error('Preencha origem e destino');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/tuendi/estimate/ride?pickup_lat=${rideForm.pickupCoords.lat}&pickup_lng=${rideForm.pickupCoords.lng}&dest_lat=${rideForm.destCoords.lat}&dest_lng=${rideForm.destCoords.lng}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Erro ao calcular');
      const data = await res.json();
      setEstimates(data.estimates);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/coupons/validate/${couponCode}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCouponValid(data);
        toast.success(`Cupom válido! ${data.discount_percent}% de desconto`);
      } else {
        setCouponValid(null);
        toast.error('Cupom inválido ou expirado');
      }
    } catch (e) {
      setCouponValid(null);
    }
  };

  const requestRide = async () => {
    if (!rideForm.pickup || !rideForm.destination) {
      toast.error('Preencha origem e destino');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickup_address: rideForm.pickup,
          pickup_lat: rideForm.pickupCoords.lat,
          pickup_lng: rideForm.pickupCoords.lng,
          destination_address: rideForm.destination,
          dest_lat: rideForm.destCoords.lat,
          dest_lng: rideForm.destCoords.lng,
          vehicle_type: selectedVehicle,
          payment_method: 'wallet',
          coupon_code: couponValid?.code || null
        })
      });
      if (!res.ok) throw new Error('Erro ao solicitar corrida');
      const ride = await res.json();
      toast.success('Corrida solicitada! Motorista a caminho.');
      navigate(`/tuendi/tracking/${ride.ride_id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const requestDelivery = async () => {
    if (!deliveryForm.pickup || !deliveryForm.destination || !deliveryForm.recipientName || !deliveryForm.recipientPhone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickup_address: deliveryForm.pickup,
          pickup_lat: deliveryForm.pickupCoords.lat,
          pickup_lng: deliveryForm.pickupCoords.lng,
          destination_address: deliveryForm.destination,
          dest_lat: deliveryForm.destCoords.lat,
          dest_lng: deliveryForm.destCoords.lng,
          package_size: deliveryForm.packageSize,
          package_description: deliveryForm.packageDescription,
          recipient_name: deliveryForm.recipientName,
          recipient_phone: deliveryForm.recipientPhone,
          payment_method: 'wallet',
          coupon_code: couponValid?.code || null
        })
      });
      if (!res.ok) throw new Error('Erro ao solicitar entrega');
      const delivery = await res.json();
      toast.success('Entrega solicitada! Estafeta a caminho.');
      navigate(`/tuendi/delivery-tracking/${delivery.delivery_id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-b from-[#0D9488] to-[#0F766E] pb-24">
        {/* Header */}
        <div className="relative px-6 pt-12 pb-8">
          <div className="absolute inset-0 bg-black/20" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1628947733273-cdae71c9bfd3?w=800')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            opacity: 0.3
          }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Tuendi</h1>
                <p className="text-white/80 text-sm">Mobilidade e entregas rápidas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="text-white hover:bg-white/20" size="icon" onClick={() => navigate('/tuendi/wallet')}>
                  <Wallet size={22} />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20" size="icon" onClick={() => navigate('/tuendi/history')}>
                  <History size={22} />
                </Button>
              </div>
            </div>
            
            {/* Wallet Preview */}
            <Card className="bg-white/15 backdrop-blur border-white/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs">Saldo Tuendi</p>
                  <p className="text-2xl font-bold text-white">{formatKz(wallet.balance)}</p>
                </div>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/20" size="sm" onClick={() => navigate('/tuendi/wallet')}>
                  Carregar
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 -mt-4">
          <Card className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-none">
                <TabsTrigger value="ride" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  <Car className="mr-2" size={18} /> Viagem
                </TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white">
                  <Package className="mr-2" size={18} /> Entrega
                </TabsTrigger>
              </TabsList>

              {/* RIDE TAB */}
              <TabsContent value="ride" className="p-5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-700 font-medium">Onde está?</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" size={20} />
                      <Input 
                        placeholder="Sua localização" 
                        className="pl-11 h-12 rounded-xl border-gray-200" 
                        value={rideForm.pickup}
                        onChange={(e) => setRideForm({...rideForm, pickup: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Para onde vai?</Label>
                    <div className="relative mt-1">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                      <Input 
                        placeholder="Destino" 
                        className="pl-11 h-12 rounded-xl border-gray-200" 
                        value={rideForm.destination}
                        onChange={(e) => setRideForm({...rideForm, destination: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Selection */}
                {config && (
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">Tipo de Viatura</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {config.vehicle_types.map(v => {
                        const Icon = VEHICLE_ICONS[v.id] || Car;
                        const estimate = estimates.find(e => e.vehicle_type === v.id);
                        return (
                          <button 
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedVehicle === v.id ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={20} className={selectedVehicle === v.id ? 'text-[#0D9488]' : 'text-gray-500'} />
                              <span className="font-bold text-sm">{v.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{v.description}</p>
                            {estimate && (
                              <p className="text-sm font-bold text-[#0D9488] mt-1">{formatKz(estimate.price)}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Coupon */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Código promocional" 
                    className="flex-1 h-10 rounded-xl" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button variant="outline" onClick={validateCoupon} className="h-10">
                    Aplicar
                  </Button>
                </div>
                {couponValid && (
                  <p className="text-sm text-green-600 font-medium">✓ {couponValid.discount_percent}% de desconto aplicado!</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={getEstimates}
                    disabled={loading}
                    className="h-12 rounded-xl border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5"
                  >
                    {loading ? '...' : 'Ver Preços'}
                  </Button>
                  <Button 
                    onClick={requestRide}
                    disabled={loading || !rideForm.pickup || !rideForm.destination}
                    className="h-12 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold"
                  >
                    {loading ? '...' : 'Pedir Tuendi'}
                  </Button>
                </div>
              </TabsContent>

              {/* DELIVERY TAB */}
              <TabsContent value="delivery" className="p-5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-700 font-medium">Recolha</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" size={20} />
                      <Input 
                        placeholder="Endereço de recolha" 
                        className="pl-11 h-12 rounded-xl border-gray-200" 
                        value={deliveryForm.pickup}
                        onChange={(e) => setDeliveryForm({...deliveryForm, pickup: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Entrega</Label>
                    <div className="relative mt-1">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                      <Input 
                        placeholder="Endereço de entrega" 
                        className="pl-11 h-12 rounded-xl border-gray-200" 
                        value={deliveryForm.destination}
                        onChange={(e) => setDeliveryForm({...deliveryForm, destination: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Package Size */}
                {config && (
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">Tamanho do Pacote</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {config.delivery_sizes.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setDeliveryForm({...deliveryForm, packageSize: s.id})}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${deliveryForm.packageSize === s.id ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-gray-200'}`}
                        >
                          <Package size={20} className={`mx-auto mb-1 ${deliveryForm.packageSize === s.id ? 'text-[#0D9488]' : 'text-gray-500'}`} />
                          <p className="font-bold text-xs">{s.name}</p>
                          <p className="text-[10px] text-gray-500">{s.max_weight}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-700 font-medium">Descrição do pacote</Label>
                  <Input 
                    placeholder="O que está a enviar?" 
                    className="h-10 rounded-xl mt-1" 
                    value={deliveryForm.packageDescription}
                    onChange={(e) => setDeliveryForm({...deliveryForm, packageDescription: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 font-medium">Nome do destinatário</Label>
                    <Input 
                      placeholder="Nome" 
                      className="h-10 rounded-xl mt-1" 
                      value={deliveryForm.recipientName}
                      onChange={(e) => setDeliveryForm({...deliveryForm, recipientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Telefone</Label>
                    <Input 
                      placeholder="+244..." 
                      className="h-10 rounded-xl mt-1" 
                      value={deliveryForm.recipientPhone}
                      onChange={(e) => setDeliveryForm({...deliveryForm, recipientPhone: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  onClick={requestDelivery}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold"
                >
                  {loading ? 'A processar...' : 'Solicitar Entrega'}
                </Button>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Card className="p-4 bg-white rounded-2xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tuendi/driver-register')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Car className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Seja Motorista</p>
                  <p className="text-xs text-gray-500">Ganhe dinheiro</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white rounded-2xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tuendi/history')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <History className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Histórico</p>
                  <p className="text-xs text-gray-500">Suas viagens</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
