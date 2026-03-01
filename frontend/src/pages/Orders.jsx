import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShoppingBag, Clock, CheckCircle, Truck, Package, XCircle, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  pendente_pagamento: { label: 'Pendente Pagamento', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50', step: 0 },
  confirmado: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50', step: 1 },
  pago: { label: 'Pago', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50', step: 1 },
  preparando: { label: 'A Preparar', icon: Package, color: 'text-[#FCBF49]', bg: 'bg-[#FCBF49]/10', step: 2 },
  a_caminho: { label: 'A Caminho', icon: Truck, color: 'text-[#2A9D8F]', bg: 'bg-[#2A9D8F]/10', step: 3 },
  entregue: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', step: 4 },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', step: -1 },
};

const TRACKING_STEPS = [
  { key: 'confirmado', label: 'Confirmado' },
  { key: 'preparando', label: 'A Preparar' },
  { key: 'a_caminho', label: 'A Caminho' },
  { key: 'entregue', label: 'Entregue' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar pedidos');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusInfo = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.confirmado;

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
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="orders-back-btn">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="orders-page-title">Meus Pedidos</h1>
              <p className="text-white/70 text-sm">{orders.length} pedido(s)</p>
            </div>
          </div>
        </div>

        <div className="px-6 mt-4 space-y-4">
          {orders.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-orders-message">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">Nenhum pedido ainda</p>
              <Button onClick={() => navigate('/restaurants')} className="mt-4 bg-[#D62828] text-white" data-testid="browse-restaurants-btn">
                Ver Restaurantes
              </Button>
            </Card>
          ) : (
            orders.map((order, idx) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedOrder === order.order_id;
              const currentStep = statusInfo.step;

              return (
                <Card key={order.order_id} className="overflow-hidden bg-white border-black/5 rounded-xl shadow-sm" data-testid={`order-card-${idx}`}>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                    className="w-full p-4 text-left"
                    data-testid={`order-toggle-${idx}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-mono">{order.order_id}</span>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1A1A1A]">{order.restaurant_name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(order.created_at)}
                      </span>
                      <span className="font-bold text-[#D62828]">{formatKz(order.total)}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      {/* Tracking Steps */}
                      {currentStep >= 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Tracking do Pedido</p>
                          <div className="flex items-center justify-between relative">
                            <div className="absolute top-3 left-[12px] right-[12px] h-0.5 bg-gray-200">
                              <div
                                className="h-full bg-[#2A9D8F] transition-all"
                                style={{ width: `${Math.max(0, Math.min(100, (currentStep / 3) * 100))}%` }}
                              />
                            </div>
                            {TRACKING_STEPS.map((step, sIdx) => {
                              const isActive = currentStep >= sIdx + 1;
                              const isCurrent = currentStep === sIdx + 1;
                              return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center" data-testid={`tracking-step-${step.key}`}>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isActive ? 'bg-[#2A9D8F] text-white' : isCurrent ? 'bg-[#FCBF49] text-white' : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {isActive ? <CheckCircle size={14} /> : sIdx + 1}
                                  </div>
                                  <p className={`text-[10px] mt-1 ${isActive ? 'text-[#2A9D8F] font-bold' : 'text-gray-400'}`}>
                                    {step.label}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Itens</p>
                        {order.items?.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.quantity}x {item.name}</span>
                            <span className="font-medium">{formatKz(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-medium">{formatKz(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Entrega</span>
                          <span className="font-medium">{formatKz(order.delivery_fee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#1A1A1A]">
                          <span>Total</span>
                          <span>{formatKz(order.total)}</span>
                        </div>
                      </div>

                      {order.delivery_address && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Endereço de Entrega</p>
                          <p className="text-sm font-medium text-gray-800">{order.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
