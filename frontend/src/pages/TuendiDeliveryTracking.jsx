import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MapPin, Navigation, Phone, User, Package, Star, CheckCircle, XCircle, Clock, CreditCard, ArrowLeft, Bike, MessageCircle, Copy, Share2, Box } from 'lucide-react';
import { toast } from 'sonner';
import { TaxiMap } from '../components/TaxiMap';
import { TuendiChat } from '../components/TuendiChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  searching: { label: 'Procurando estafeta', color: 'bg-amber-500', step: 1, description: 'Encontrando o melhor estafeta para você' },
  accepted: { label: 'Estafeta a caminho', color: 'bg-blue-500', step: 2, description: 'O estafeta está indo buscar seu pacote' },
  arriving: { label: 'Recolhendo pacote', color: 'bg-purple-500', step: 3, description: 'O estafeta chegou para recolher' },
  in_progress: { label: 'Em entrega', color: 'bg-[#0D9488]', step: 4, description: 'Seu pacote está a caminho do destino' },
  completed: { label: 'Entregue', color: 'bg-green-500', step: 5, description: 'Pacote entregue com sucesso!' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', step: 0, description: 'Entrega cancelada' },
};

const SIZE_CONFIG = {
  small: { label: 'Envelope', icon: '📄', description: 'Documentos e pequenos itens' },
  medium: { label: 'Pacote Médio', icon: '📦', description: 'Caixas pequenas até 5kg' },
  large: { label: 'Pacote Grande', icon: '📫', description: 'Caixas grandes até 15kg' }
};

export default function TuendiDeliveryTracking() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const RATING_TAGS = ['Rápido', 'Cuidadoso', 'Educado', 'Pacote intacto', 'Boa comunicação'];

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
      
      if (['in_progress', 'arriving'].includes(data.status) && !route) {
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gradient-to-b from-amber-500 to-amber-600 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-100 p-6 pt-20">
          <Card className="p-6 text-center">
            <p className="text-gray-600 mb-4">Entrega não encontrada</p>
            <Button onClick={() => navigate('/tuendi')} className="bg-amber-500">Voltar</Button>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.searching;
  const sizeConfig = SIZE_CONFIG[delivery.package_size] || SIZE_CONFIG.small;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-4 pt-12 pb-20 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
                <ArrowLeft size={24} />
              </Button>
              <div className="text-center">
                <p className="text-white/70 text-xs font-medium">Entrega #{deliveryId.slice(-6)}</p>
                <h1 className="text-lg font-bold text-white">{statusConfig.label}</h1>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl">
                <Share2 size={20} />
              </Button>
            </div>

            <p className="text-center text-white/80 text-sm">{statusConfig.description}</p>

            {/* Progress Steps */}
            {delivery.status !== 'cancelled' && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step <= statusConfig.step 
                        ? 'bg-white text-amber-500' 
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
        </div>

        <div className="px-4 -mt-12 space-y-4">
          {/* Driver Card */}
          {delivery.driver && (
            <Card className="p-5 bg-white rounded-3xl shadow-xl border-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bike size={32} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{delivery.driver.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700">{delivery.driver.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">{delivery.driver.trips} entregas</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{delivery.driver.vehicle} • {delivery.driver.plate}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${delivery.driver.phone}`} className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center hover:bg-green-200 transition-colors">
                    <Phone size={20} className="text-green-600" />
                  </a>
                  <button onClick={() => setShowChat(true)} className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <MessageCircle size={20} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Package Info */}
          <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">{sizeConfig.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{sizeConfig.label}</p>
                <p className="text-sm text-gray-500">{delivery.package_description || sizeConfig.description}</p>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
                  <div className="w-0.5 h-12 bg-gray-200 mx-auto my-1" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">RECOLHA</p>
                    <p className="font-semibold text-gray-900">{delivery.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">ENTREGA</p>
                    <p className="font-semibold text-gray-900">{delivery.destination_address}</p>
                    <p className="text-sm text-gray-500 mt-1">{delivery.recipient_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{delivery.recipient_name}</p>
                    <p className="text-sm text-gray-500">{delivery.recipient_phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(delivery.recipient_phone)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <Copy size={18} className="text-gray-500" />
                  </button>
                  <a href={`tel:${delivery.recipient_phone}`} className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                    <Phone size={18} className="text-green-600" />
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Navigation size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{delivery.distance_km}</p>
                <p className="text-xs text-gray-500">km</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Clock size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{delivery.eta_min}</p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <Box size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-amber-600">{formatKz(delivery.price)}</p>
                <p className="text-xs text-gray-500">total</p>
              </div>
            </div>
          </Card>

          {/* Map */}
          {route && (
            <Card className="bg-white rounded-3xl shadow-sm border-0 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="font-bold text-gray-900">Rota da Entrega</h3>
              </div>
              <TaxiMap route={route} />
            </Card>
          )}

          {/* Action Buttons */}
          {!['completed', 'cancelled'].includes(delivery.status) && (
            <div className="flex gap-3">
              {delivery.status === 'accepted' && (
                <Button 
                  onClick={() => updateStatus('arriving')} 
                  className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <Package size={20} className="mr-2" /> Recolher Pacote
                </Button>
              )}
              {delivery.status === 'arriving' && (
                <Button 
                  onClick={() => updateStatus('in_progress')} 
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <Bike size={20} className="mr-2" /> Iniciar Entrega
                </Button>
              )}
              {delivery.status === 'in_progress' && (
                <Button 
                  onClick={() => updateStatus('completed')} 
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg"
                >
                  <CheckCircle size={20} className="mr-2" /> Confirmar Entrega
                </Button>
              )}
            </div>
          )}

          {/* Completed Status */}
          {delivery.status === 'completed' && (
            <Card className="p-5 bg-gradient-to-r from-green-50 to-green-100 border-green-200 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 text-lg">Entrega Concluída! 🎉</h3>
                  <p className="text-sm text-green-700">Pacote entregue com sucesso</p>
                </div>
              </div>
              {!delivery.user_rating && (
                <Button 
                  onClick={() => setShowRating(true)} 
                  className="w-full mt-4 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                >
                  <Star size={18} className="mr-2" /> Avaliar Entrega
                </Button>
              )}
            </Card>
          )}

          {/* Payment Info */}
          <Card className="p-4 bg-amber-50 border-amber-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-amber-600" />
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {delivery.payment_method === 'wallet' ? 'Carteira Tuendi' : 'Dinheiro'}
                </p>
                <p className="text-xs text-gray-500">Pagamento será processado automaticamente</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-md">
            <TuendiChat 
              deliveryId={deliveryId}
              driverName={delivery?.driver?.name}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Star size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Avalie a entrega</h2>
            <p className="text-white/70 text-sm">Como foi o serviço?</p>
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
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <textarea 
              className="w-full p-4 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button 
              onClick={submitRating} 
              className="w-full mt-4 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
            >
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
