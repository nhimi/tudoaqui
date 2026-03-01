import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Star, Plus, Minus, ShoppingBag, Clock, Bike, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [restRes, menuRes, reviewsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/restaurants`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/restaurants/${id}/menu`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/reviews/${id}`, { credentials: 'include' })
      ]);

      if (restRes.ok) {
        const restaurants = await restRes.json();
        setRestaurant(restaurants.find(r => r.restaurant_id === id));
      }
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (itemId, delta) => {
    setCart(prev => {
      const qty = (prev[itemId] || 0) + delta;
      if (qty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: qty };
    });
  };

  const submitReview = async () => {
    if (newRating === 0) { toast.error('Selecione uma avaliação'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ restaurant_id: id, rating: newRating, comment: newComment })
      });
      if (!res.ok) throw new Error('Erro ao enviar avaliação');
      toast.success('Avaliação enviada!');
      setNewRating(0);
      setNewComment('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';
  const cartItems = Object.entries(cart).map(([itemId, qty]) => {
    const item = menuItems.find(i => i.item_id === itemId);
    return item ? { ...item, quantity: qty } : null;
  }).filter(Boolean);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const goToCheckout = () => {
    navigate('/checkout', {
      state: {
        items: cartItems,
        restaurant,
        subtotal: cartTotal,
        deliveryFee: restaurant?.delivery_fee || 0
      }
    });
  };

  const categories = [...new Set(menuItems.map(i => i.category))];

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-24">
        {/* Restaurant Header */}
        <div
          className="relative h-56 bg-cover bg-center"
          style={{ backgroundImage: `url('${restaurant?.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute top-0 left-0 right-0 pt-12 px-6 flex justify-between items-start">
            <Button onClick={() => navigate('/restaurants')} variant="ghost" className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full h-10 w-10 p-0" data-testid="menu-back-btn">
              <ArrowLeft size={20} />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl font-bold text-white mb-1" data-testid="restaurant-name">{restaurant?.name}</h1>
            <p className="text-white/80 text-sm mb-2">{restaurant?.cuisine_type}</p>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1"><Star size={14} className="fill-[#FCBF49] text-[#FCBF49]" /> {restaurant?.rating}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {restaurant?.delivery_time}</span>
              <span className="flex items-center gap-1"><Bike size={14} /> {restaurant?.delivery_fee} Kz</span>
            </div>
          </div>
        </div>

        {/* Tab: Menu / Reviews */}
        <div className="px-6 mt-4 flex gap-2">
          <Button
            data-testid="tab-menu"
            onClick={() => setShowReviews(false)}
            variant={showReviews ? 'outline' : 'default'}
            className={!showReviews ? 'bg-[#D62828] text-white' : ''}
          >
            Menu
          </Button>
          <Button
            data-testid="tab-reviews"
            onClick={() => setShowReviews(true)}
            variant={!showReviews ? 'outline' : 'default'}
            className={showReviews ? 'bg-[#D62828] text-white' : ''}
          >
            <MessageSquare size={16} className="mr-1" />
            Avaliações ({reviews.length})
          </Button>
        </div>

        {!showReviews ? (
          /* Menu Section */
          <div className="px-6 mt-4 space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{category}</h2>
                <div className="space-y-3">
                  {menuItems.filter(i => i.category === category).map((item, idx) => (
                    <Card key={item.item_id} className="flex overflow-hidden bg-white border-black/5 rounded-xl shadow-sm" data-testid={`menu-item-${idx}`}>
                      <div className="w-28 h-28 bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url('${item.image}')` }} />
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[#1A1A1A] text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-[#D62828]">{formatKz(item.price)}</span>
                          {cart[item.item_id] ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCart(item.item_id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" data-testid={`decrease-${item.item_id}`}>
                                <Minus size={14} />
                              </button>
                              <span className="font-bold text-sm w-5 text-center" data-testid={`qty-${item.item_id}`}>{cart[item.item_id]}</span>
                              <button onClick={() => updateCart(item.item_id, 1)} className="w-7 h-7 rounded-full bg-[#D62828] text-white flex items-center justify-center hover:bg-[#D62828]/90" data-testid={`increase-${item.item_id}`}>
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => updateCart(item.item_id, 1)} className="w-7 h-7 rounded-full bg-[#D62828] text-white flex items-center justify-center hover:bg-[#D62828]/90" data-testid={`add-${item.item_id}`}>
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Reviews Section */
          <div className="px-6 mt-4 space-y-4">
            {/* Write Review */}
            <Card className="p-4 bg-white border-black/5 rounded-xl shadow-sm" data-testid="write-review-section">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Deixe a sua avaliação</h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setNewRating(s)} data-testid={`star-${s}`}>
                    <Star size={28} className={s <= newRating ? 'fill-[#FCBF49] text-[#FCBF49]' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input data-testid="review-comment-input" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário..." className="h-10 flex-1" />
                <Button onClick={submitReview} disabled={submittingReview || newRating === 0} className="bg-[#D62828] text-white h-10 px-4" data-testid="submit-review-btn">
                  <Send size={16} />
                </Button>
              </div>
            </Card>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <Card className="p-6 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-reviews-message">
                <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Nenhuma avaliação ainda</p>
                <p className="text-gray-400 text-sm">Seja o primeiro a avaliar!</p>
              </Card>
            ) : (
              reviews.map((review, idx) => (
                <Card key={review.review_id} className="p-4 bg-white border-black/5 rounded-xl shadow-sm" data-testid={`review-card-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1A1A1A] text-sm">{review.user_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} className={s <= review.rating ? 'fill-[#FCBF49] text-[#FCBF49]' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString('pt-AO')}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-6 pb-2 z-50">
          <Button
            data-testid="cart-checkout-btn"
            onClick={goToCheckout}
            className="w-full h-14 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold text-lg rounded-2xl shadow-xl flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={20} />
              {cartCount} {cartCount === 1 ? 'item' : 'itens'}
            </span>
            <span>{formatKz(cartTotal)}</span>
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
