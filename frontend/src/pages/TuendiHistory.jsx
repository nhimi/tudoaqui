import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Car, Package, MapPin, Navigation, ArrowLeft, Clock, Star, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  accepted: 'bg-yellow-100 text-yellow-700',
  searching: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS = {
  completed: 'Concluído',
  cancelled: 'Cancelado',
  in_progress: 'Em andamento',
  accepted: 'Aceito',
  searching: 'Procurando',
};

export default function TuendiHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState([]);
  const [rides, setRides] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [historyRes, ridesRes, deliveriesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tuendi/history`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/tuendi/rides`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/tuendi/deliveries`, { credentials: 'include' })
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.history || []);
      }
      if (ridesRes.ok) {
        const data = await ridesRes.json();
        setRides(data.rides || []);
      }
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = (item) => {
    const isRide = item.type === 'ride' || item.ride_id;
    const id = item.ride_id || item.delivery_id;
    const statusClass = STATUS_COLORS[item.status] || STATUS_COLORS.completed;
    const statusLabel = STATUS_LABELS[item.status] || item.status;

    return (
      <Card 
        key={id} 
        className="p-4 bg-white rounded-2xl shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(isRide ? `/tuendi/tracking/${id}` : `/tuendi/delivery-tracking/${id}`)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRide ? 'bg-[#0D9488]/10' : 'bg-amber-100'}`}>
            {isRide ? <Car size={24} className="text-[#0D9488]" /> : <Package size={24} className="text-amber-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900">{isRide ? 'Viagem' : 'Entrega'}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>{statusLabel}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-[#0D9488] flex-shrink-0" />
                <span className="truncate">{item.pickup_address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Navigation size={14} className="text-amber-500 flex-shrink-0" />
                <span className="truncate">{item.destination_address}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{item.distance_km} km</span>
                <span>•</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <span className="font-bold text-[#0D9488]">{formatKz(item.price)}</span>
            </div>
            {item.user_rating && (
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={14} className={star <= item.user_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                ))}
              </div>
            )}
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </Card>
    );
  };

  const getDisplayList = () => {
    switch (activeTab) {
      case 'rides': return rides;
      case 'deliveries': return deliveries;
      default: return history;
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-100 pb-24">
        {/* Header */}
        <div className="bg-[#0D9488] px-4 pt-12 pb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/tuendi')}>
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Histórico</h1>
              <p className="text-white/70 text-sm">Suas viagens e entregas</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4">
          <Card className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-none">
                <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="rides" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs">
                  <Car size={14} className="mr-1" /> Viagens
                </TabsTrigger>
                <TabsTrigger value="deliveries" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs">
                  <Package size={14} className="mr-1" /> Entregas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 bg-white rounded-xl text-center">
              <p className="text-2xl font-bold text-[#0D9488]">{history.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </Card>
            <Card className="p-3 bg-white rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">{rides.length}</p>
              <p className="text-xs text-gray-500">Viagens</p>
            </Card>
            <Card className="p-3 bg-white rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-600">{deliveries.length}</p>
              <p className="text-xs text-gray-500">Entregas</p>
            </Card>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">A carregar...</p>
            </div>
          ) : getDisplayList().length > 0 ? (
            <div>
              {getDisplayList().map(renderItem)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhum registo encontrado</p>
              <p className="text-sm text-gray-400">Suas viagens e entregas aparecerão aqui</p>
              <Button onClick={() => navigate('/tuendi')} className="mt-4 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white">
                Solicitar Agora
              </Button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
