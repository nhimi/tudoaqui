import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Star, Users, Palmtree } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Tourism() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todos', icon: Palmtree },
    { id: 'hotel', label: 'Hotéis', icon: '🏨' },
    { id: 'resort', label: 'Resorts', icon: '🏖️' },
    { id: 'museu', label: 'Museus', icon: '🏛️' },
    { id: 'parque', label: 'Parques', icon: '🦁' },
    { id: 'atrativo', label: 'Atrativos', icon: '📸' }
  ];

  useEffect(() => {
    fetchPlaces();
  }, [selectedCategory]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all' 
        ? `${BACKEND_URL}/api/tourist-places`
        : `${BACKEND_URL}/api/tourist-places?type=${selectedCategory}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar locais');

      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      hotel: 'Hotel',
      resort: 'Resort',
      museu: 'Museu',
      parque: 'Parque Nacional',
      atrativo: 'Atrativo Turístico'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600" data-testid="loading-tourism">A carregar locais turísticos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div 
          className="bg-gradient-to-br from-[#2A9D8F] to-[#2A9D8F]/80 px-6 pt-12 pb-8"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply'
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="tourism-page-title">
            Turismo em Angola
          </h1>
          <p className="text-white/90 text-sm">Descubra as maravilhas de Angola</p>
        </div>

        <div className="px-6 -mt-4">
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                data-testid={`category-${cat.id}-btn`}
                onClick={() => setSelectedCategory(cat.id)}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className={`flex-shrink-0 h-10 px-4 rounded-full font-semibold ${
                  selectedCategory === cat.id
                    ? 'bg-[#2A9D8F] text-white hover:bg-[#2A9D8F]/90'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#2A9D8F]'
                }`}
              >
                {typeof cat.icon === 'string' ? cat.icon : <cat.icon size={16} className="mr-1" />}
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-6 mt-4 space-y-4">
          {places.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-places-message">
              <Palmtree size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Nenhum local encontrado</p>
            </Card>
          ) : (
            places.map((place, idx) => (
              <Card
                key={place.place_id}
                data-testid={`place-card-${idx}`}
                onClick={() => navigate(`/tourism/${place.place_id}`)}
                className="overflow-hidden hover-lift cursor-pointer bg-white border-black/5 rounded-xl shadow-sm"
              >
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${place.images[0]}')` }}
                >
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={14} className="fill-[#FCBF49] text-[#FCBF49]" />
                    <span className="text-sm font-bold text-gray-900">{place.rating}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <span className="inline-block bg-[#2A9D8F] text-white text-xs px-3 py-1 rounded-full font-semibold mb-2">
                      {getTypeLabel(place.type)}
                    </span>
                    <h3 className="font-bold text-white text-xl">{place.name}</h3>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="text-[#D62828]" />
                    <span>{place.location}</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{place.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">A partir de</span>
                      <div className="text-xl font-bold text-[#D62828]">
                        {place.price_per_night.toFixed(0)} Kz
                        {place.type === 'hotel' || place.type === 'resort' ? '/noite' : '/pessoa'}
                      </div>
                    </div>
                    <Button
                      data-testid={`view-place-btn-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tourism/${place.place_id}`);
                      }}
                      className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white h-10 px-4 rounded-lg"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}