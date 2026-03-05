import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Car, Package, MapPin, Navigation, ArrowLeft, Clock, Star, ChevronRight, Calendar, TrendingUp, Bike, Crown, CarFront, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  accepted: { label: 'Aceito', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  searching: { label: 'Procurando', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
};

const VEHICLE_ICONS = {
  moto: Bike,
  standard: Car,
  comfort: CarFront,
  premium: Crown
};

export default function TuendiHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState([]);
  const [rides, setRides] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalSpent: 0, avgRating: 0 });

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

      let allHistory = [];
      let allRides = [];
      let allDeliveries = [];

      if (historyRes.ok) {
        const data = await historyRes.json();
        allHistory = data.history || [];
      }
      if (ridesRes.ok) {
        const data = await ridesRes.json();
        allRides = data.rides || [];
      }
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        allDeliveries = data.deliveries || [];
      }

      setHistory(allHistory);
      setRides(allRides);
      setDeliveries(allDeliveries);

      // Calculate stats
      const completed = allHistory.filter(h => h.status === 'completed');
      const totalSpent = completed.reduce((sum, h) => sum + (h.price || 0), 0);
      const ratings = completed.filter(h => h.user_rating).map(h => h.user_rating);
      const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 5.0;

      setStats({
        total: allHistory.length,
        totalSpent,
        avgRating
      });
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje, ' + date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem, ' + date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = (item) => {
    const isRide = item.type === 'ride' || item.ride_id;
    const id = item.ride_id || item.delivery_id;
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.completed;
    const VehicleIcon = isRide ? (VEHICLE_ICONS[item.vehicle_type] || Car) : Package;

    return (
      <Card 
        key={id} 
        className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate(isRide ? `/tuendi/tracking/${id}` : `/tuendi/delivery-tracking/${id}`)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRide ? 'bg-[#0D9488]/10' : 'bg-amber-100'}`}>
              <VehicleIcon size={24} className={isRide ? 'text-[#0D9488]' : 'text-amber-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{isRide ? 'Viagem' : 'Entrega'}</span>
                  {item.vehicle_type && (
                    <span className="text-xs text-gray-500 capitalize">{item.vehicle_type}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
                  <span className="text-sm text-gray-600 truncate">{item.pickup_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-600 truncate">{item.destination_address}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Navigation size={12} /> {item.distance_km} km
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {formatDate(item.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.user_rating && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} className="fill-amber-400" />
                  <span className="text-xs font-semibold">{item.user_rating}</span>
                </div>
              )}
              <span className="font-bold text-[#0D9488]">{formatKz(item.price)}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
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
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] px-5 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Histórico</h1>
              <p className="text-white/70 text-sm">Suas viagens e entregas</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-xs text-white/70 font-medium">Viagens</p>
            </Card>
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{(stats.totalSpent / 1000).toFixed(0)}k</p>
              <p className="text-xs text-white/70 font-medium">Kz gastos</p>
            </Card>
            <Card className="p-3 bg-white/10 backdrop-blur border-white/20 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-2xl font-black text-white">{stats.avgRating}</span>
              </div>
              <p className="text-xs text-white/70 font-medium">Avaliação</p>
            </Card>
          </div>
        </div>

        <div className="px-4 -mt-4">
          {/* Tabs */}
          <Card className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-50 p-1.5 rounded-none gap-1">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl h-10 data-[state=active]:bg-[#0D9488] data-[state=active]:text-white data-[state=active]:shadow font-semibold text-sm"
                >
                  Todos ({history.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="rides" 
                  className="rounded-xl h-10 data-[state=active]:bg-[#0D9488] data-[state=active]:text-white data-[state=active]:shadow font-semibold text-sm"
                >
                  <Car size={14} className="mr-1" /> Viagens
                </TabsTrigger>
                <TabsTrigger 
                  value="deliveries" 
                  className="rounded-xl h-10 data-[state=active]:bg-[#0D9488] data-[state=active]:text-white data-[state=active]:shadow font-semibold text-sm"
                >
                  <Package size={14} className="mr-1" /> Entregas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Filter Button */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{getDisplayList().length} registros</p>
            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-600">
              <Filter size={14} className="mr-1" /> Filtrar
            </Button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : getDisplayList().length > 0 ? (
            <div className="space-y-3">
              {getDisplayList().map(renderItem)}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Clock size={36} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-semibold text-lg">Nenhum registro</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Suas viagens e entregas aparecerão aqui</p>
              <Button 
                onClick={() => navigate('/tuendi')} 
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl h-12 px-8"
              >
                <Car size={18} className="mr-2" /> Solicitar Agora
              </Button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
