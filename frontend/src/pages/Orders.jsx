import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Package, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar pedidos');

      const data = await response.json();
      setOrders(data);
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
            <p className="mt-4 text-gray-600" data-testid="loading-orders">A carregar pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#F4A261] to-[#F4A261]/80 px-6 pt-12 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="orders-page-title">
            Meus Pedidos
          </h1>
          <p className="text-white/90 text-sm">Histórico de pedidos e corridas</p>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {orders.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-orders-message">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Nenhum pedido ainda</p>
              <p className="text-gray-500 text-sm mt-2">Seus pedidos aparecerão aqui</p>
            </Card>
          ) : (
            orders.map((order, idx) => (
              <Card
                key={order.order_id}
                data-testid={`order-card-${idx}`}
                className="p-5 bg-white border-black/5 rounded-xl shadow-sm hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-lg mb-1">
                      {order.restaurant_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2A9D8F]/10 text-[#2A9D8F] px-3 py-1 rounded-full">
                    <CheckCircle size={16} />
                    <span className="text-sm font-semibold capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} Kz
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{order.subtotal.toFixed(2)} Kz</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entrega</span>
                    <span className="font-semibold">{order.delivery_fee.toFixed(2)} Kz</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#D62828]">{order.total.toFixed(2)} Kz</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(order.created_at).toLocaleDateString('pt-AO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="font-semibold capitalize">{order.payment_method}</span>
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