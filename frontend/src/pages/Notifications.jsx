import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BottomNav } from '../components/BottomNav';
import { ArrowLeft, Bell, Package, CreditCard, Briefcase, Tag, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_CONFIG = {
  order_status: { icon: Package, color: 'text-[#2A9D8F]', bg: 'bg-[#2A9D8F]/10' },
  payment: { icon: CreditCard, color: 'text-[#D62828]', bg: 'bg-[#D62828]/10' },
  partner: { icon: Briefcase, color: 'text-[#FCBF49]', bg: 'bg-[#FCBF49]/10' },
  system: { icon: Bell, color: 'text-[#1A1A1A]', bg: 'bg-gray-100' },
  promotion: { icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' }
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${notifId}/read`, { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/read-all`, { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Todas marcadas como lidas');
    } catch (err) {
      toast.error('Erro');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="notif-back-btn">
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="notif-page-title">Notificações</h1>
                <p className="text-white/70 text-sm">
                  {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllRead} variant="ghost" className="text-white/80 hover:bg-white/10 text-sm" data-testid="mark-all-read-btn">
                <CheckCheck size={16} className="mr-1" /> Ler todas
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 mt-4 space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-notifications">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">Sem notificações</p>
              <p className="text-gray-400 text-sm mt-1">Receberá alertas sobre pedidos e pagamentos</p>
            </Card>
          ) : (
            notifications.map((notif, idx) => {
              const typeConf = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const IconComp = typeConf.icon;
              return (
                <Card
                  key={notif.notification_id}
                  data-testid={`notification-${idx}`}
                  onClick={() => !notif.read && markAsRead(notif.notification_id)}
                  className={`p-4 rounded-xl shadow-sm cursor-pointer transition-all ${
                    notif.read ? 'bg-white border-black/5' : 'bg-white border-l-4 border-l-[#D62828] border-black/5'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 ${typeConf.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComp size={18} className={typeConf.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold text-sm ${notif.read ? 'text-gray-700' : 'text-[#1A1A1A]'}`}>{notif.title}</h4>
                        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Clock size={10} /> {formatTime(notif.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm mt-0.5 ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-[#D62828] mt-2 flex-shrink-0" />}
                  </div>
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
