import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, Phone, User, Car, Star, CheckCircle, XCircle, MessageCircle, Clock, CreditCard, ArrowLeft, Share2, Shield, Bike, Crown, CarFront } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  searching: { label: 'Procurando motorista', color: 'bg-amber-500', textColor: 'text-amber-600', step: 1 },
  accepted: { label: 'Motorista a caminho', color: 'bg-blue-500', textColor: 'text-blue-600', step: 2 },
  arriving: { label: 'Motorista chegando', color: 'bg-purple-500', textColor: 'text-purple-600', step: 3 },
  in_progress: { label: 'Em viagem', color: 'bg-[#0D9488]', textColor: 'text-[#0D9488]', step: 4 },
  completed: { label: 'Concluído', color: 'bg-green-500', textColor: 'text-green-600', step: 5 },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-600', step: 0 },
};

const VEHICLE_ICONS = {
  moto: Bike,
  standard: Car,
  comfort: CarFront,
  premium: Crown
};

export default function TuendiTracking() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const RATING_TAGS = ['Educado', 'Pontual', 'Carro limpo', 'Direção segura', 'Conhece a cidade'];

  useEffect(() => {
    loadRide();
    const interval = setInterval(loadRide, 5000);
    return () => clearInterval(interval);
  }, [rideId]);

  const loadRide = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/rides/${rideId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Corrida não encontrada');
      const data = await res.json();
      setRide(data);
      
      if (['in_progress', 'arriving'].includes(data.status) && !route) {
        loadRoute(data);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoute = async (rideData) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/tuendi/navigation?pickup_lat=${rideData.pickup_lat}&pickup_lng=${rideData.pickup_lng}&dest_lat=${rideData.dest_lat}&dest_lng=${rideData.dest_lng}`,
        { credentials: 'include' }
      );
      if (res.ok) setRoute(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/tuendi/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      loadRide();
      if (newStatus === 'completed') {
        setShowRating(true);
      }
    } catch (e) {
      toast.error('Erro ao atualizar status');
    }
  };

  const cancelRide = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelado pelo usuário' })
      });
      const data = await res.json();
      setShowCancel(false);
      toast.success('Corrida cancelada');
      if (data.cancellation_fee > 0) {
        toast.info(`Taxa de cancelamento: ${data.cancellation_fee} Kz`);
      }
      loadRide();
    } catch (e) {
      toast.error('Erro ao cancelar');
    }
  };

  const submitRating = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/tuendi/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ride_id: rideId,
          rating,
          comment,
          tags: selectedTags
        })
      });
      toast.success('Obrigado pela avaliação!');
      setShowRating(false);
      navigate('/tuendi');
    } catch (e) {
      toast.error('Erro ao enviar avaliação');
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gradient-to-b from-[#0D9488] to-[#0F766E] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-100 p-6 pt-20">
          <Card className="p-6 text-center">
            <p className="text-gray-600 mb-4">Corrida não encontrada</p>
            <Button onClick={() => navigate('/tuendi')} className="bg-[#0D9488]">Voltar</Button>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[ride.status] || STATUS_CONFIG.searching;
  const VehicleIcon = VEHICLE_ICONS[ride.vehicle_type] || Car;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] px-4 pt-12 pb-20 relative">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
              <ArrowLeft size={24} />
            </Button>
            <div className="text-center">
              <p className="text-white/70 text-xs font-medium">Viagem #{rideId.slice(-6)}</p>
              <h1 className="text-lg font-bold text-white">{statusConfig.label}</h1>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl">
              <Share2 size={20} />
            </Button>
          </div>

          {/* Progress Steps */}
          {ride.status !== 'cancelled' && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step <= statusConfig.step 
                      ? 'bg-white text-[#0D9488]' 
                      : 'bg-white/20 text-white/50'
                  }`}>
                    {step === 5 ? <CheckCircle size={16} /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`w-6 h-1 rounded-full mx-1 ${
                      step < statusConfig.step ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 -mt-14 space-y-4">
          {/* Driver Card */}
          {ride.driver && (
            <Card className="p-5 bg-white rounded-3xl shadow-xl border-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0D9488] to-[#0D9488]/70 rounded-2xl flex items-center justify-center shadow-lg">
                    <User size={32} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{ride.driver.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700">{ride.driver.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">{ride.driver.trips} viagens</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{ride.driver.vehicle} • {ride.driver.plate}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${ride.driver.phone}`} className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center hover:bg-green-200 transition-colors">
                    <Phone size={20} className="text-green-600" />
                  </a>
                  <button className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <MessageCircle size={20} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Trip Details */}
          <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
                  <div className="w-0.5 h-12 bg-gray-200 mx-auto my-1" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">ORIGEM</p>
                    <p className="font-semibold text-gray-900">{ride.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">DESTINO</p>
                    <p className="font-semibold text-gray-900">{ride.destination_address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Navigation size={18} className="mx-auto text-[#0D9488] mb-1" />
                <p className="text-lg font-bold text-gray-900">{ride.distance_km}</p>
                <p className="text-xs text-gray-500">km</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Clock size={18} className="mx-auto text-[#0D9488] mb-1" />
                <p className="text-lg font-bold text-gray-900">{ride.duration_min}</p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              <div className="text-center p-3 bg-[#0D9488]/10 rounded-xl">
                <VehicleIcon size={18} className="mx-auto text-[#0D9488] mb-1" />
                <p className="text-lg font-bold text-[#0D9488]">{formatKz(ride.price)}</p>
                <p className="text-xs text-gray-500">total</p>
              </div>
            </div>

            {ride.discount > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-green-700">Desconto aplicado</span>
                <span className="font-bold text-green-700">-{formatKz(ride.discount)}</span>
              </div>
            )}
          </Card>

          {/* Map */}
          {route && (
            <Card className="bg-white rounded-3xl shadow-sm border-0 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="font-bold text-gray-900">Rota</h3>
              </div>
              <TaxiMap route={route} />
            </Card>
          )}

          {/* Action Buttons */}
          {!['completed', 'cancelled'].includes(ride.status) && (
            <div className="flex gap-3">
              {ride.status === 'accepted' && (
                <Button 
                  onClick={() => updateStatus('arriving')} 
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <Car size={20} className="mr-2" /> Motorista Chegou
                </Button>
              )}
              {ride.status === 'arriving' && (
                <Button 
                  onClick={() => updateStatus('in_progress')} 
                  className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <Navigation size={20} className="mr-2" /> Iniciar Viagem
                </Button>
              )}
              {ride.status === 'in_progress' && (
                <Button 
                  onClick={() => updateStatus('completed')} 
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <CheckCircle size={20} className="mr-2" /> Finalizar Viagem
                </Button>
              )}
              <Button 
                onClick={() => setShowCancel(true)} 
                variant="outline" 
                className="h-14 px-5 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl"
              >
                <XCircle size={20} />
              </Button>
            </div>
          )}

          {/* Completed Status */}
          {ride.status === 'completed' && (
            <Card className="p-5 bg-gradient-to-r from-green-50 to-green-100 border-green-200 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 text-lg">Viagem Concluída!</h3>
                  <p className="text-sm text-green-700">Obrigado por usar o Tuendi</p>
                </div>
              </div>
              {!ride.user_rating && (
                <Button 
                  onClick={() => setShowRating(true)} 
                  className="w-full mt-4 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                >
                  <Star size={18} className="mr-2" /> Avaliar Viagem
                </Button>
              )}
            </Card>
          )}

          {/* Cancelled Status */}
          {ride.status === 'cancelled' && (
            <Card className="p-5 bg-red-50 border-red-200 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center">
                  <XCircle size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg">Viagem Cancelada</h3>
                  <p className="text-sm text-red-700">{ride.cancellation_reason || 'Corrida cancelada'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Info */}
          <Card className="p-4 bg-amber-50 border-amber-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-amber-600" />
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {ride.payment_method === 'wallet' ? 'Carteira Tuendi' : ride.payment_method === 'cash' ? 'Dinheiro' : 'Cartão'}
                </p>
                <p className="text-xs text-gray-500">Pagamento será processado automaticamente</p>
              </div>
            </div>
          </Card>

          {/* Safety */}
          <Card className="p-4 bg-blue-50 border-blue-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-blue-600" />
              <div>
                <p className="font-semibold text-sm text-gray-900">Viagem protegida</p>
                <p className="text-xs text-gray-500">Compartilhe sua viagem com amigos e família</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Star size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Como foi sua viagem?</h2>
            <p className="text-white/70 text-sm">Avalie seu motorista</p>
          </div>
          <div className="p-6">
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    size={40} 
                    className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} transition-colors`} 
                  />
                </button>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mb-3">O que você mais gostou?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {RATING_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag) 
                      ? 'bg-[#0D9488] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <textarea 
              className="w-full p-4 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent" 
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button 
              onClick={submitRating} 
              className="w-full mt-4 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
            >
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Cancelar Viagem?</DialogTitle>
            <DialogDescription>Tem certeza que deseja cancelar? Pode haver uma taxa de cancelamento.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCancel(false)} className="flex-1 h-12 rounded-xl">
              Não, manter
            </Button>
            <Button onClick={cancelRide} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Sim, cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
