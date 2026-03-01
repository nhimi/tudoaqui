import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { ArrowLeft, MapPin, Star, Users, Calendar, CreditCard, Wallet as WalletIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PlaceDetail() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    paymentMethod: 'multicaixa',
    specialRequests: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPlace();
  }, [placeId]);

  const fetchPlace = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tourist-places/${placeId}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar local');

      const data = await response.json();
      setPlace(data);
    } catch (error) {
      toast.error(error.message);
      navigate('/tourism');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * place.price_per_night;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('Preencha as datas de check-in e check-out');
      return;
    }

    const nights = calculateNights();
    if (nights <= 0) {
      toast.error('Data de check-out deve ser posterior ao check-in');
      return;
    }

    setBookingLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          place_id: placeId,
          check_in: new Date(bookingData.checkIn).toISOString(),
          check_out: new Date(bookingData.checkOut).toISOString(),
          guests: bookingData.guests,
          payment_method: bookingData.paymentMethod,
          special_requests: bookingData.specialRequests
        })
      });

      if (!response.ok) throw new Error('Erro ao criar reserva');

      toast.success('Reserva confirmada com sucesso!');
      navigate('/bookings');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'multicaixa', name: 'Multicaixa Express', icon: CreditCard },
    { id: 'unitel', name: 'Unitel Money', icon: WalletIcon },
    { id: 'bai', name: 'BAI Paga', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">A carregar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-8">
        <div className="relative">
          <div 
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url('${place.images[0]}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
            <Button
              data-testid="back-to-tourism-btn"
              onClick={() => navigate('/tourism')}
              variant="ghost"
              className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full"
            >
              <ArrowLeft size={24} className="text-[#1A1A1A]" />
            </Button>
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={16} className="fill-[#FCBF49] text-[#FCBF49]" />
              <span className="text-sm font-bold text-gray-900">{place.rating}</span>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-8 space-y-4">
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-lg" data-testid="place-info-card">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{place.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <MapPin size={16} className="text-[#D62828]" />
              <span>{place.location}</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">{place.description}</p>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-gray-700">
                <Users size={20} className="text-[#2A9D8F]" />
                <span className="text-sm font-medium">Até {place.capacity} pessoas</span>
              </div>
              <div className="ml-auto">
                <span className="text-sm text-gray-500">A partir de</span>
                <div className="text-2xl font-bold text-[#D62828]">
                  {place.price_per_night.toFixed(0)} Kz
                </div>
              </div>
            </div>
          </Card>

          {place.images.length > 1 && (
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Galeria</h2>
              <div className="grid grid-cols-2 gap-3">
                {place.images.map((image, idx) => (
                  <div
                    key={idx}
                    className="h-32 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Comodidades</h2>
            <div className="grid grid-cols-2 gap-3">
              {place.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-[#2A9D8F]" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </Card>

          {!showBooking ? (
            <Button
              data-testid="start-booking-btn"
              onClick={() => setShowBooking(true)}
              className="w-full h-14 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white font-bold rounded-xl text-lg btn-shadow"
            >
              Reservar Agora
            </Button>
          ) : (
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Fazer Reserva</h2>
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkIn" className="text-[#1A1A1A] font-semibold mb-2 block">
                      Check-in
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        id="checkIn"
                        data-testid="booking-checkin-input"
                        type="date"
                        className="pl-10 h-11"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingData.checkIn}
                        onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="checkOut" className="text-[#1A1A1A] font-semibold mb-2 block">
                      Check-out
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        id="checkOut"
                        data-testid="booking-checkout-input"
                        type="date"
                        className="pl-10 h-11"
                        min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                        value={bookingData.checkOut}
                        onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="guests" className="text-[#1A1A1A] font-semibold mb-2 block">
                    Número de Pessoas
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      id="guests"
                      data-testid="booking-guests-input"
                      type="number"
                      min="1"
                      max={place.capacity}
                      className="pl-10 h-11"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {calculateNights() > 0 && (
                  <div className="bg-[#2A9D8F]/10 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">{place.price_per_night.toFixed(0)} Kz x {calculateNights()} noites</span>
                      <span className="font-semibold">{(place.price_per_night * calculateNights()).toFixed(0)} Kz</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#2A9D8F]/20">
                      <span>Total</span>
                      <span className="text-[#D62828]">{calculateTotal().toFixed(0)} Kz</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-[#1A1A1A] font-semibold mb-3 block">
                    Método de Pagamento
                  </Label>
                  <RadioGroup
                    value={bookingData.paymentMethod}
                    onValueChange={(value) => setBookingData({ ...bookingData, paymentMethod: value })}
                  >
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        data-testid={`payment-method-${method.id}`}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#2A9D8F] cursor-pointer transition-colors"
                      >
                        <RadioGroupItem value={method.id} id={`booking-${method.id}`} />
                        <Label
                          htmlFor={`booking-${method.id}`}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <method.icon size={18} className="text-gray-600" />
                          <span className="font-medium text-sm">{method.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="specialRequests" className="text-[#1A1A1A] font-semibold mb-2 block">
                    Pedidos Especiais (opcional)
                  </Label>
                  <Textarea
                    id="specialRequests"
                    data-testid="booking-requests-input"
                    placeholder="Alguma solicitação especial?"
                    className="min-h-20"
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    data-testid="cancel-booking-btn"
                    type="button"
                    onClick={() => setShowBooking(false)}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    data-testid="confirm-booking-btn"
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 h-12 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white font-bold rounded-lg btn-shadow"
                  >
                    {bookingLoading ? 'A processar...' : 'Confirmar Reserva'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}