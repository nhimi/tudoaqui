import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MapPin, Car, Package, Wallet, History, Star, ChevronRight, Bike, Crown, CarFront, Clock, Navigation, X, Search, Zap, Shield, Award, Gift, ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LUANDA_CENTER = { lat: -8.8383, lng: 13.2344 };

const VEHICLE_ICONS = {
  moto: Bike,
  standard: Car,
  comfort: CarFront,
  premium: Crown
};

// Lugares populares em Luanda
const POPULAR_PLACES = [
  { name: 'Aeroporto 4 de Fevereiro', address: 'Aeroporto Internacional de Luanda', lat: -8.8584, lng: 13.2312 },
  { name: 'Shopping Belas', address: 'Talatona, Luanda Sul', lat: -8.9123, lng: 13.1987 },
  { name: 'Marginal de Luanda', address: 'Av. 4 de Fevereiro', lat: -8.8142, lng: 13.2341 },
  { name: 'Largo do Kinaxixi', address: 'Centro de Luanda', lat: -8.8383, lng: 13.2344 },
  { name: 'Universidade Agostinho Neto', address: 'Campus Universitário', lat: -8.8234, lng: 13.2456 },
  { name: 'Hospital Josina Machel', address: 'Maianga', lat: -8.8312, lng: 13.2298 },
  { name: 'Porto de Luanda', address: 'Zona Portuária', lat: -8.8067, lng: 13.2378 },
  { name: 'Fortaleza de São Miguel', address: 'Ilha de Luanda', lat: -8.8012, lng: 13.2312 },
];

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
  const [showPlacePicker, setShowPlacePicker] = useState(null); // 'pickup' | 'destination' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [recentHistory, setRecentHistory] = useState([]);
  const [showEstimates, setShowEstimates] = useState(false);
  
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
    loadRecentHistory();
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

  const loadRecentHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/history?limit=5`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentHistory(data.history || []);
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
      setShowEstimates(true);
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

  const selectPlace = (place, type) => {
    if (activeTab === 'ride') {
      if (type === 'pickup') {
        setRideForm({...rideForm, pickup: place.name, pickupCoords: { lat: place.lat, lng: place.lng }});
      } else {
        setRideForm({...rideForm, destination: place.name, destCoords: { lat: place.lat, lng: place.lng }});
      }
    } else {
      if (type === 'pickup') {
        setDeliveryForm({...deliveryForm, pickup: place.name, pickupCoords: { lat: place.lat, lng: place.lng }});
      } else {
        setDeliveryForm({...deliveryForm, destination: place.name, destCoords: { lat: place.lat, lng: place.lng }});
      }
    }
    setShowPlacePicker(null);
    setSearchQuery('');
  };

  const filteredPlaces = POPULAR_PLACES.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  const selectedEstimate = estimates.find(e => e.vehicle_type === selectedVehicle);

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-b from-[#0D9488] via-[#0F766E] to-[#115E59] pb-24">
        {/* Header com imagem de fundo */}
        <div className="relative px-5 pt-12 pb-6">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1628947733273-cdae71c9bfd3?w=800')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Tuendi</h1>
                <p className="text-white/70 text-sm font-medium">Mobilidade inteligente</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl" 
                  onClick={() => navigate('/tuendi/wallet')}
                >
                  <Wallet size={22} />
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl" 
                  onClick={() => navigate('/tuendi/history')}
                >
                  <History size={22} />
                </Button>
              </div>
            </div>
            
            {/* Wallet Card Compacto */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium">Saldo</p>
                    <p className="text-xl font-bold text-white">{formatKz(wallet.balance)}</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl h-9 px-4"
                  onClick={() => navigate('/tuendi/wallet')}
                >
                  <Zap size={14} className="mr-1" /> Carregar
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 -mt-2">
          <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden border-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-gray-50 p-1.5 rounded-none gap-1">
                <TabsTrigger 
                  value="ride" 
                  className="rounded-xl h-11 data-[state=active]:bg-[#0D9488] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all"
                >
                  <Car className="mr-2" size={18} /> Viagem
                </TabsTrigger>
                <TabsTrigger 
                  value="delivery" 
                  className="rounded-xl h-11 data-[state=active]:bg-[#0D9488] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all"
                >
                  <Package className="mr-2" size={18} /> Entrega
                </TabsTrigger>
              </TabsList>

              {/* RIDE TAB */}
              <TabsContent value="ride" className="p-5 space-y-5">
                {/* Inputs de localização */}
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowPlacePicker('pickup')}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">ORIGEM</p>
                      <p className={`font-semibold truncate ${rideForm.pickup ? 'text-gray-900' : 'text-gray-400'}`}>
                        {rideForm.pickup || 'Onde está?'}
                      </p>
                    </div>
                    <Search size={18} className="text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 px-3">
                    <div className="w-10 flex justify-center">
                      <div className="w-0.5 h-8 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowPlacePicker('destination')}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Target size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">DESTINO</p>
                      <p className={`font-semibold truncate ${rideForm.destination ? 'text-gray-900' : 'text-gray-400'}`}>
                        {rideForm.destination || 'Para onde vai?'}
                      </p>
                    </div>
                    <Search size={18} className="text-gray-400" />
                  </div>
                </div>

                {/* Vehicle Selection */}
                {config && (
                  <div>
                    <Label className="text-gray-700 font-semibold mb-3 block text-sm">Escolha seu Tuendi</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {config.vehicle_types.map(v => {
                        const Icon = VEHICLE_ICONS[v.id] || Car;
                        const estimate = estimates.find(e => e.vehicle_type === v.id);
                        const isSelected = selectedVehicle === v.id;
                        return (
                          <button 
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                              isSelected 
                                ? 'border-[#0D9488] bg-gradient-to-br from-[#0D9488]/5 to-[#0D9488]/10 shadow-lg' 
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                          >
                            {v.id === 'premium' && (
                              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                VIP
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1">
                                <span className="font-bold text-sm text-gray-900">{v.name}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-2">{v.description}</p>
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-bold ${isSelected ? 'text-[#0D9488]' : 'text-gray-700'}`}>
                                {estimate ? formatKz(estimate.price) : `desde ${formatKz(v.base_price)}`}
                              </p>
                              {estimate && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <Clock size={10} /> {estimate.eta_min} min
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Coupon Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Código promocional" 
                      className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={validateCoupon} 
                    className="h-11 px-5 rounded-xl border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5"
                  >
                    Aplicar
                  </Button>
                </div>
                {couponValid && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <Sparkles size={16} className="text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{couponValid.discount_percent}% de desconto aplicado!</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={getEstimates}
                    disabled={loading || !rideForm.pickup || !rideForm.destination}
                    className="h-12 rounded-xl border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5 font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                        Calculando...
                      </span>
                    ) : (
                      <>Ver Preços</>
                    )}
                  </Button>
                  <Button 
                    onClick={requestRide}
                    disabled={loading || !rideForm.pickup || !rideForm.destination}
                    className="h-12 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold shadow-lg shadow-[#0D9488]/30"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Pedir Tuendi <ArrowRight size={18} className="ml-1" /></>
                    )}
                  </Button>
                </div>

                {/* Estimate Result */}
                {selectedEstimate && showEstimates && (
                  <Card className="p-4 bg-gradient-to-r from-[#0D9488]/5 to-[#0D9488]/10 border-[#0D9488]/20 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0D9488] rounded-xl flex items-center justify-center">
                          {React.createElement(VEHICLE_ICONS[selectedVehicle] || Car, { size: 24, className: 'text-white' })}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Estimativa {config?.vehicle_types.find(v => v.id === selectedVehicle)?.name}</p>
                          <p className="text-2xl font-black text-[#0D9488]">{formatKz(selectedEstimate.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{selectedEstimate.distance_km} km</p>
                        <p className="text-sm font-semibold text-gray-700">{selectedEstimate.duration_min} min</p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* DELIVERY TAB */}
              <TabsContent value="delivery" className="p-5 space-y-5">
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowPlacePicker('pickup')}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">RECOLHA</p>
                      <p className={`font-semibold truncate ${deliveryForm.pickup ? 'text-gray-900' : 'text-gray-400'}`}>
                        {deliveryForm.pickup || 'Endereço de recolha'}
                      </p>
                    </div>
                    <Search size={18} className="text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 px-3">
                    <div className="w-10 flex justify-center">
                      <div className="w-0.5 h-8 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowPlacePicker('destination')}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Target size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">ENTREGA</p>
                      <p className={`font-semibold truncate ${deliveryForm.destination ? 'text-gray-900' : 'text-gray-400'}`}>
                        {deliveryForm.destination || 'Endereço de entrega'}
                      </p>
                    </div>
                    <Search size={18} className="text-gray-400" />
                  </div>
                </div>

                {/* Package Size */}
                {config && (
                  <div>
                    <Label className="text-gray-700 font-semibold mb-3 block text-sm">Tamanho do Pacote</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {config.delivery_sizes.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setDeliveryForm({...deliveryForm, packageSize: s.id})}
                          className={`p-3 rounded-2xl border-2 text-center transition-all ${
                            deliveryForm.packageSize === s.id 
                              ? 'border-[#0D9488] bg-[#0D9488]/5' 
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          <Package size={22} className={`mx-auto mb-2 ${deliveryForm.packageSize === s.id ? 'text-[#0D9488]' : 'text-gray-400'}`} />
                          <p className="font-bold text-xs text-gray-900">{s.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{s.max_weight}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-700 font-semibold text-sm">Descrição do pacote</Label>
                  <Input 
                    placeholder="O que está a enviar?" 
                    className="h-11 rounded-xl mt-2 bg-gray-50" 
                    value={deliveryForm.packageDescription}
                    onChange={(e) => setDeliveryForm({...deliveryForm, packageDescription: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Destinatário</Label>
                    <Input 
                      placeholder="Nome" 
                      className="h-11 rounded-xl mt-2 bg-gray-50" 
                      value={deliveryForm.recipientName}
                      onChange={(e) => setDeliveryForm({...deliveryForm, recipientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Telefone</Label>
                    <Input 
                      placeholder="+244..." 
                      className="h-11 rounded-xl mt-2 bg-gray-50" 
                      value={deliveryForm.recipientPhone}
                      onChange={(e) => setDeliveryForm({...deliveryForm, recipientPhone: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  onClick={requestDelivery}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold shadow-lg shadow-[#0D9488]/30"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Solicitar Entrega <ArrowRight size={18} className="ml-1" /></>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <Shield size={24} className="mx-auto text-white mb-2" />
              <p className="text-white text-xs font-semibold">Seguro</p>
            </Card>
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <Zap size={24} className="mx-auto text-white mb-2" />
              <p className="text-white text-xs font-semibold">Rápido</p>
            </Card>
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <Award size={24} className="mx-auto text-white mb-2" />
              <p className="text-white text-xs font-semibold">Confiável</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card 
              className="p-4 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-all border-0"
              onClick={() => navigate('/tuendi/driver-register')}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Car className="text-white" size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Seja Motorista</p>
                  <p className="text-xs text-gray-500">Ganhe dinheiro</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-4 bg-white rounded-2xl cursor-pointer hover:shadow-lg transition-all border-0"
              onClick={() => navigate('/tuendi/history')}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <History className="text-white" size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Histórico</p>
                  <p className="text-xs text-gray-500">{recentHistory.length} viagens</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Place Picker Dialog */}
      <Dialog open={!!showPlacePicker} onOpenChange={() => setShowPlacePicker(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-lg font-bold">
              {showPlacePicker === 'pickup' ? 'Escolher Origem' : 'Escolher Destino'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 pt-3">
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Pesquisar local..."
                className="pl-10 h-12 rounded-xl bg-gray-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <p className="text-xs text-gray-500 font-semibold mb-3 px-1">LUGARES POPULARES</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredPlaces.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPlace(place, showPlacePicker)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{place.name}</p>
                    <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
