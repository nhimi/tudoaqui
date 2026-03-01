import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Star, Clock, Bike } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurants`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar restaurantes');

      const data = await response.json();
      setRestaurants(data);
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
          <p className="text-[#1A1A1A]/80 text-sm">Comida deliciosa na sua porta</p>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {restaurants.map((restaurant, idx) => (
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
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}