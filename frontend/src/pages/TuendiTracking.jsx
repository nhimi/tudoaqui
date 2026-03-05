import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, Phone, User, Car, Star, CheckCircle, XCircle, MessageCircle, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_LABELS = {
  searching: { label: 'A procurar motorista', color: 'bg-yellow-500' },
  accepted: { label: 'Motorista a caminho', color: 'bg-blue-500' },
  arriving: { label: 'Motorista a chegar', color: 'bg-purple-500' },
  in_progress: { label: 'Em viagem', color: 'bg-green-500' },
  completed: { label: 'Concluído', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
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

  useEffect(() => {
    loadRide();
    const interval = setInterval(loadRide, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [rideId]);

  const loadRide = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/rides/${rideId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Corrida não encontrada');
      const data = await res.json();
      setRide(data);
      
      // Load route if in progress
      if (data.status === 'in_progress' && !route) {
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
          comment
        })
      });
      toast.success('Obrigado pela avaliação!');
      setShowRating(false);
      navigate('/tuendi');
    } catch (e) {
      toast.error('Erro ao enviar avaliação');
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-[#0D9488] flex items-center justify-center">
          <div className="text-white text-lg">A carregar...</div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-100 p-6">
          <p className="text-center text-gray-600">Corrida não encontrada</p>
          <Button onClick={() => navigate('/tuendi')} className="w-full mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[ride.status] || STATUS_LABELS.searching;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-100 pb-24">
        {/* Header */}
        <div className="bg-[#0D9488] px-4 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/tuendi')}>
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Sua Viagem</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                <span className="text-white/80 text-sm">{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Driver Info Card */}
          {ride.driver && (
            <Card className="p-4 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0D9488] to-[#0D9488]/70 rounded-full flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{ride.driver.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span>{ride.driver.rating}</span>
                    <span>•</span>
                    <span>{ride.driver.trips} viagens</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{ride.driver.vehicle} • {ride.driver.plate}</p>
                </div>
                <a href={`tel:${ride.driver.phone}`} className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-green-600" />
                </a>
              </div>
            </Card>
          )}

          {/* Trip Details */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Origem</p>
                  <p className="font-medium text-gray-900">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Destino</p>
                  <p className="font-medium text-gray-900">{ride.destination_address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">Distância</p>
                <p className="font-bold text-gray-900">{ride.distance_km} km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Duração</p>
                <p className="font-bold text-gray-900">{ride.duration_min} min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Preço</p>
                <p className="font-bold text-[#0D9488]">{formatKz(ride.price)}</p>
              </div>
            </div>

            {ride.discount > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-700">Desconto aplicado: -{formatKz(ride.discount)}</p>
              </div>
            )}
          </Card>

          {/* Map */}
          {route && (
            <Card className="p-4 bg-white rounded-2xl shadow-sm overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-3">Rota</h3>
              <TaxiMap route={route} />
            </Card>
          )}

          {/* Action Buttons */}
          {ride.status !== 'completed' && ride.status !== 'cancelled' && (
            <div className="flex gap-3">
              {ride.status === 'accepted' && (
                <Button onClick={() => updateStatus('in_progress')} className="flex-1 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl">
                  <Car size={18} className="mr-2" /> Iniciar Viagem
                </Button>
              )}
              {ride.status === 'in_progress' && (
                <Button onClick={() => updateStatus('completed')} className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                  <CheckCircle size={18} className="mr-2" /> Finalizar
                </Button>
              )}
              <Button onClick={() => setShowCancel(true)} variant="outline" className="h-12 px-6 border-red-300 text-red-600 hover:bg-red-50 rounded-xl">
                <XCircle size={18} />
              </Button>
            </div>
          )}

          {/* Completed Status */}
          {ride.status === 'completed' && (
            <Card className="p-4 bg-green-50 border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={32} className="text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Viagem Concluída</h3>
                  <p className="text-sm text-green-700">Obrigado por usar o Tuendi!</p>
                </div>
              </div>
            </Card>
          )}

          {/* Cancelled Status */}
          {ride.status === 'cancelled' && (
            <Card className="p-4 bg-red-50 border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <XCircle size={32} className="text-red-600" />
                <div>
                  <h3 className="font-bold text-red-800">Viagem Cancelada</h3>
                  <p className="text-sm text-red-700">{ride.cancellation_reason || 'Corrida cancelada'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Info */}
          <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-amber-600" />
              <span className="font-bold text-sm text-gray-900">Pagamento: {ride.payment_method === 'wallet' ? 'Carteira Tuendi' : ride.payment_method === 'cash' ? 'Dinheiro' : 'Cartão'}</span>
            </div>
            <p className="text-xs text-gray-600">O valor será debitado automaticamente ao final da viagem</p>
          </Card>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Avalie sua viagem</DialogTitle>
            <DialogDescription>Como foi sua experiência?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star size={32} className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea 
              className="w-full p-3 border rounded-xl resize-none" 
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={submitRating} className="w-full mt-4 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl">
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancelar Viagem</DialogTitle>
            <DialogDescription>Tem certeza que deseja cancelar? Pode haver uma taxa de cancelamento.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCancel(false)} className="flex-1">Não</Button>
            <Button onClick={cancelRide} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Sim, Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
