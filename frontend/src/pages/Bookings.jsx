import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar reservas');

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600" data-testid="loading-bookings">A carregar reservas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#2A9D8F] to-[#2A9D8F]/80 px-6 pt-12 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="bookings-page-title">
            Minhas Reservas
          </h1>
          <p className="text-white/90 text-sm">Histórico de reservas turísticas</p>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {bookings.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-bookings-message">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Nenhuma reserva ainda</p>
              <p className="text-gray-500 text-sm mt-2">Suas reservas aparecerão aqui</p>
            </Card>
          ) : (
            bookings.map((booking, idx) => (
              <Card
                key={booking.booking_id}
                data-testid={`booking-card-${idx}`}
                className="p-5 bg-white border-black/5 rounded-xl shadow-sm hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1A1A1A] text-lg mb-1">
                      {booking.place_name}
                    </h3>
                    <span className="inline-block bg-[#2A9D8F]/10 text-[#2A9D8F] text-xs px-2 py-1 rounded-full font-semibold capitalize">
                      {booking.place_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2A9D8F]/10 text-[#2A9D8F] px-3 py-1 rounded-full">
                    <CheckCircle size={16} />
                    <span className="text-sm font-semibold capitalize">{booking.status}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Calendar size={16} className="text-[#D62828]" />
                    <span>
                      <span className="font-semibold">Check-in:</span> {formatDate(booking.check_in)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Calendar size={16} className="text-[#FCBF49]" />
                    <span>
                      <span className="font-semibold">Check-out:</span> {formatDate(booking.check_out)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Users size={16} className="text-[#2A9D8F]" />
                    <span>{booking.guests} {booking.guests === 1 ? 'pessoa' : 'pessoas'}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {booking.price_per_night.toFixed(0)} Kz x {booking.nights} {booking.nights === 1 ? 'noite' : 'noites'}
                    </span>
                    <span className="font-semibold">{booking.total_price.toFixed(0)} Kz</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total Pago</span>
                    <span className="text-[#D62828]">{booking.total_price.toFixed(0)} Kz</span>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Pedidos Especiais:</p>
                    <p className="text-sm text-gray-700">{booking.special_requests}</p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(booking.created_at).toLocaleDateString('pt-AO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="font-semibold capitalize">{booking.payment_method}</span>
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
