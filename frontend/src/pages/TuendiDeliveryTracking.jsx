import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, Phone, User, Package, Star, CheckCircle, XCircle, Clock, CreditCard, ArrowLeft, Bike } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_LABELS = {
  searching: { label: 'A procurar estafeta', color: 'bg-yellow-500' },
  accepted: { label: 'Estafeta a caminho', color: 'bg-blue-500' },
  arriving: { label: 'Recolhendo pacote', color: 'bg-purple-500' },
  in_progress: { label: 'Em entrega', color: 'bg-green-500' },
  completed: { label: 'Entregue', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const SIZE_LABELS = {
  small: 'Envelope',
  medium: 'Pacote Médio',
  large: 'Pacote Grande'
};

export default function TuendiDeliveryTracking() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadDelivery();
    const interval = setInterval(loadDelivery, 5000);
    return () => clearInterval(interval);
  }, [deliveryId]);

  const loadDelivery = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/deliveries/${deliveryId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Entrega não encontrada');
      const data = await res.json();
      setDelivery(data);
      
      if (data.status === 'in_progress' && !route) {
        loadRoute(data);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoute = async (deliveryData) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/tuendi/navigation?pickup_lat=${deliveryData.pickup_lat}&pickup_lng=${deliveryData.pickup_lng}&dest_lat=${deliveryData.dest_lat}&dest_lng=${deliveryData.dest_lng}`,
        { credentials: 'include' }
      );
      if (res.ok) setRoute(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/tuendi/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      loadDelivery();
      if (newStatus === 'completed') {
        setShowRating(true);
      }
    } catch (e) {
      toast.error('Erro ao atualizar status');
    }
  };

  const submitRating = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/tuendi/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delivery_id: deliveryId,
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

  if (!delivery) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-100 p-6">
          <p className="text-center text-gray-600">Entrega não encontrada</p>
          <Button onClick={() => navigate('/tuendi')} className="w-full mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[delivery.status] || STATUS_LABELS.searching;

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
              <h1 className="text-xl font-bold text-white">Sua Entrega</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                <span className="text-white/80 text-sm">{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Driver Info Card */}
          {delivery.driver && (
            <Card className="p-4 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                  <Bike size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{delivery.driver.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span>{delivery.driver.rating}</span>
                    <span>•</span>
                    <span>{delivery.driver.trips} entregas</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{delivery.driver.vehicle} • {delivery.driver.plate}</p>
                </div>
                <a href={`tel:${delivery.driver.phone}`} className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-green-600" />
                </a>
              </div>
            </Card>
          )}

          {/* Package Info */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{SIZE_LABELS[delivery.package_size]}</p>
                <p className="text-sm text-gray-500">{delivery.package_description || 'Pacote'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recolha</p>
                  <p className="font-medium text-gray-900">{delivery.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entrega</p>
                  <p className="font-medium text-gray-900">{delivery.destination_address}</p>
                  <p className="text-sm text-gray-500">{delivery.recipient_name} • {delivery.recipient_phone}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">Distância</p>
                <p className="font-bold text-gray-900">{delivery.distance_km} km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">ETA</p>
                <p className="font-bold text-gray-900">{delivery.eta_min} min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Preço</p>
                <p className="font-bold text-[#0D9488]">{formatKz(delivery.price)}</p>
              </div>
            </div>
          </Card>

          {/* Map */}
          {route && (
            <Card className="p-4 bg-white rounded-2xl shadow-sm overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-3">Rota</h3>
              <TaxiMap route={route} />
            </Card>
          )}

          {/* Action Buttons */}
          {delivery.status !== 'completed' && delivery.status !== 'cancelled' && (
            <div className="flex gap-3">
              {delivery.status === 'accepted' && (
                <Button onClick={() => updateStatus('arriving')} className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl">
                  <Package size={18} className="mr-2" /> Recolher Pacote
                </Button>
              )}
              {delivery.status === 'arriving' && (
                <Button onClick={() => updateStatus('in_progress')} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  <Bike size={18} className="mr-2" /> Iniciar Entrega
                </Button>
              )}
              {delivery.status === 'in_progress' && (
                <Button onClick={() => updateStatus('completed')} className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                  <CheckCircle size={18} className="mr-2" /> Confirmar Entrega
                </Button>
              )}
            </div>
          )}

          {/* Completed Status */}
          {delivery.status === 'completed' && (
            <Card className="p-4 bg-green-50 border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={32} className="text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Entrega Concluída</h3>
                  <p className="text-sm text-green-700">Pacote entregue com sucesso!</p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Info */}
          <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-amber-600" />
              <span className="font-bold text-sm text-gray-900">Pagamento: {delivery.payment_method === 'wallet' ? 'Carteira Tuendi' : 'Dinheiro'}</span>
            </div>
            <p className="text-xs text-gray-600">O valor será debitado ao confirmar a entrega</p>
          </Card>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Avalie a entrega</DialogTitle>
            <DialogDescription>Como foi o serviço?</DialogDescription>
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

      <BottomNav />
    </div>
  );
}
