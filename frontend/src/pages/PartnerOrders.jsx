import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_FLOW = ['confirmado', 'preparando', 'a_caminho', 'entregue'];
const STATUS_CONFIG = {
  confirmado: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', next: 'preparando' },
  pago: { label: 'Pago', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', next: 'preparando' },
  preparando: { label: 'A Preparar', icon: Package, color: 'text-[#FCBF49]', bg: 'bg-[#FCBF49]/10', next: 'a_caminho' },
  a_caminho: { label: 'A Caminho', icon: Truck, color: 'text-[#2A9D8F]', bg: 'bg-[#2A9D8F]/10', next: 'entregue' },
  entregue: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', next: null },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', next: null },
};

export default function PartnerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/incoming-orders`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/incoming-orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Erro');
      toast.success(`Pedido atualizado para: ${STATUS_CONFIG[newStatus]?.label}`);
      loadOrders();
    } catch (err) { toast.error(err.message); }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => ['confirmado', 'pago'].includes(o.status)).length;

  if (loading) return <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/partner/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="orders-mgmt-back"><ArrowLeft size={20} /></Button>
          <div><h1 className="text-2xl font-bold text-white" data-testid="orders-mgmt-title">Pedidos Recebidos</h1>
            <p className="text-white/70 text-sm">{orders.length} pedidos {pendingCount > 0 && `(${pendingCount} pendentes)`}</p></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {['all', 'confirmado', 'preparando', 'a_caminho', 'entregue', 'cancelado'].map(s => (
            <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === s ? 'bg-[#D62828] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              {s === 'all' ? 'Todos' : (STATUS_CONFIG[s]?.label || s)} {s === 'all' ? `(${orders.length})` : `(${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center bg-white rounded-xl" data-testid="no-incoming-orders"><p className="text-gray-500">Nenhum pedido encontrado</p></Card>
          ) : filtered.map((order, idx) => {
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmado;
            const Icon = sc.icon;
            const nextStatus = sc.next;
            return (
              <Card key={order.order_id} className="p-5 bg-white border-black/5 rounded-xl shadow-sm" data-testid={`incoming-order-${idx}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500 font-mono">{order.order_id}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${sc.bg} ${sc.color}`}><Icon size={12} /> {sc.label}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-[#D62828]">{formatKz(order.total)}</span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.map((item, iIdx) => (
                    <div key={iIdx} className="flex justify-between text-sm"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="font-medium">{formatKz(item.price * item.quantity)}</span></div>
                  ))}
                </div>

                {order.delivery_address && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">Entrega: {order.delivery_address}</p>}

                <div className="flex gap-2">
                  {nextStatus && (
                    <Button onClick={() => updateStatus(order.order_id, nextStatus)} className="flex-1 bg-[#2A9D8F] text-white font-semibold h-10" data-testid={`advance-${order.order_id}`}>
                      {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                    </Button>
                  )}
                  {order.status !== 'cancelado' && order.status !== 'entregue' && (
                    <Button onClick={() => updateStatus(order.order_id, 'cancelado')} variant="outline" className="border-red-300 text-red-500 h-10" data-testid={`cancel-${order.order_id}`}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
