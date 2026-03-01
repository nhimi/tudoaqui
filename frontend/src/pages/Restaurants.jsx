import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Star, Clock, Bike, Search } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRestaurants(); }, []);

  useEffect(() => {
    let result = restaurants;
    if (selectedCuisine !== 'all') {
      result = result.filter(r => r.cuisine_type === selectedCuisine);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.cuisine_type.toLowerCase().includes(q)
      );
    }
    setFilteredRestaurants(result);
  }, [restaurants, selectedCuisine, searchQuery]);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurants`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao carregar restaurantes');
      const data = await response.json();
      setRestaurants(data);
      setFilteredRestaurants(data);
      const uniqueCuisines = [...new Set(data.map(r => r.cuisine_type))];
      setCuisines(uniqueCuisines);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600" data-testid="loading-restaurants">A carregar restaurantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#FCBF49] to-[#FCBF49]/80 px-6 pt-12 pb-6">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2" data-testid="restaurants-page-title">
            Restaurantes
          </h1>
          <p className="text-[#1A1A1A]/80 text-sm mb-4">Comida deliciosa na sua porta</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input
              data-testid="restaurant-search-input"
              placeholder="Procurar restaurante ou prato..."
              className="pl-10 h-11 bg-white/90 border-none rounded-xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {cuisines.length > 0 && (
          <div className="px-6 mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              <button
                data-testid="cuisine-filter-all"
                onClick={() => setSelectedCuisine('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  selectedCuisine === 'all'
                    ? 'bg-[#D62828] text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#D62828]'
                }`}
              >
                Todos
              </button>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  data-testid={`cuisine-filter-${cuisine.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => setSelectedCuisine(cuisine)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    selectedCuisine === cuisine
                      ? 'bg-[#D62828] text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#D62828]'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 mt-4 space-y-4">
          {filteredRestaurants.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-restaurants-message">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">Nenhum restaurante encontrado</p>
              <p className="text-gray-400 text-sm mt-1">Tente outra pesquisa ou categoria</p>
            </Card>
          ) : (
            filteredRestaurants.map((restaurant, idx) => (
              <Card
                key={restaurant.restaurant_id}
                data-testid={`restaurant-card-${idx}`}
                onClick={() => navigate(`/restaurants/${restaurant.restaurant_id}`)}
                className="overflow-hidden hover-lift cursor-pointer bg-white border-black/5 rounded-xl shadow-sm"
              >
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url('${restaurant.image}')` }}
                >
                  <div className="h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div>
                      <h3 className="font-bold text-white text-xl mb-1">{restaurant.name}</h3>
                      <p className="text-white/90 text-sm">{restaurant.cuisine_type}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3">{restaurant.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-gray-700">
                        <Star size={16} className="fill-[#FCBF49] text-[#FCBF49]" />
                        <span className="font-semibold">{restaurant.rating}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock size={16} />
                        {restaurant.delivery_time}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-gray-700 font-semibold">
                      <Bike size={16} />
                      {restaurant.delivery_fee} Kz
                    </span>
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
