import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/restaurants/${restaurantId}/menu`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Erro ao carregar cardápio');

      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(i => i.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(i => 
        i.item_id === item.item_id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} adicionado ao carrinho`);
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => i.item_id === itemId);
    if (existing.quantity > 1) {
      setCart(cart.map(i => 
        i.item_id === itemId 
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    } else {
      setCart(cart.filter(i => i.item_id !== itemId));
    }
  };

  const getCartItemQuantity = (itemId) => {
    const item = cart.find(i => i.item_id === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">A carregar cardápio...</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-32">
        <div className="bg-[#FCBF49] px-6 pt-12 pb-6 flex items-center gap-4">
          <Button
            data-testid="back-to-restaurants-btn"
            onClick={() => navigate('/restaurants')}
            variant="ghost"
            className="p-2 hover:bg-black/5"
          >
            <ArrowLeft size={24} className="text-[#1A1A1A]" />
          </Button>
          <h1 className="text-2xl font-bold text-[#1A1A1A]" data-testid="menu-page-title">Cardápio</h1>
        </div>

        <div className="px-6 mt-6 space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">{category}</h2>
              <div className="space-y-3">
                {menuItems
                  .filter(item => item.category === category)
                  .map((item, idx) => {
                    const quantity = getCartItemQuantity(item.item_id);
                    return (
                      <Card 
                        key={item.item_id}
                        data-testid={`menu-item-${idx}`}
                        className="p-4 bg-white border-black/5 rounded-xl shadow-sm"
                      >
                        <div className="flex gap-4">
                          <div 
                            className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url('${item.image}')` }}
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-[#1A1A1A] mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-[#D62828]">{item.price} Kz</span>
                              {quantity === 0 ? (
                                <Button
                                  data-testid={`add-item-btn-${idx}`}
                                  onClick={() => addToCart(item)}
                                  size="sm"
                                  className="bg-[#D62828] hover:bg-[#D62828]/90 text-white h-8 px-3 rounded-lg"
                                >
                                  <Plus size={16} />
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    data-testid={`decrease-item-btn-${idx}`}
                                    onClick={() => removeFromCart(item.item_id)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-[#D62828] text-[#D62828]"
                                  >
                                    <Minus size={16} />
                                  </Button>
                                  <span className="font-bold text-[#1A1A1A] w-6 text-center">{quantity}</span>
                                  <Button
                                    data-testid={`increase-item-btn-${idx}`}
                                    onClick={() => addToCart(item)}
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-[#D62828] hover:bg-[#D62828]/90 text-white"
                                  >
                                    <Plus size={16} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-6 z-40" style={{ maxWidth: '28rem', margin: '0 auto' }}>
          <Button
            data-testid="view-cart-btn"
            onClick={() => navigate('/checkout', { state: { cart, restaurantId } })}
            className="w-full h-14 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-xl shadow-lg btn-shadow"
          >
            <ShoppingCart className="mr-2" size={20} />
            Ver Carrinho ({cart.length}) - {cartTotal.toFixed(2)} Kz
          </Button>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}