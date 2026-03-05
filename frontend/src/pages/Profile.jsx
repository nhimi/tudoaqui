import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Settings, Bell, Shield, CreditCard, Award, Star, ChevronRight, LogOut, Mail, Phone, MapPin, Calendar, Edit2, Camera, Gift, Sparkles, Crown, Wallet, History, Lock, HelpCircle, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TIER_CONFIG = {
  bronze: { name: 'Bronze', color: 'from-amber-600 to-amber-700', icon: '🥉', textColor: 'text-amber-700' },
  silver: { name: 'Prata', color: 'from-gray-400 to-gray-500', icon: '🥈', textColor: 'text-gray-600' },
  gold: { name: 'Ouro', color: 'from-yellow-400 to-yellow-500', icon: '🥇', textColor: 'text-yellow-600' },
  platinum: { name: 'Platina', color: 'from-cyan-400 to-cyan-500', icon: '💎', textColor: 'text-cyan-600' },
  vip: { name: 'VIP', color: 'from-purple-500 to-purple-600', icon: '👑', textColor: 'text-purple-600' },
};

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tierInfo, setTierInfo] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: ''
  });
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    promotions: true,
    order_updates: true
  });

  useEffect(() => {
    loadProfile();
    loadWallet();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (!res.ok) {
        navigate('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setTierInfo(data.tier_info);
      setEditForm({
        name: data.user.name || '',
        phone: data.user.phone || '',
        address: data.user.profile?.address || '',
        city: data.user.profile?.city || 'Luanda',
        province: data.user.profile?.province || 'Luanda'
      });
      setNotifications(data.user.notification_settings || notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/wallet/balance`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Perfil atualizado!');
        setShowEditProfile(false);
        loadProfile();
      }
    } catch (e) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleUpdateNotifications = async (key, value) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    
    try {
      await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_settings: newSettings })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Até logo!');
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tierConfig = TIER_CONFIG[user.tier] || TIER_CONFIG.bronze;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className={`bg-gradient-to-br ${tierConfig.color} px-5 pt-12 pb-24 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-xl font-bold text-white">Minha Conta</h1>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => setShowEditProfile(true)}>
                <Edit2 size={20} />
              </Button>
            </div>

            {/* Profile Card */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User size={40} className="text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Camera size={16} className="text-gray-600" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-white/70 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{tierConfig.icon}</span>
                  <span className="text-white font-semibold">{tierConfig.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-16">
          {/* Quick Stats */}
          <Card className="p-4 bg-white rounded-3xl shadow-xl border-0 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => navigate('/tuendi/wallet')} className="text-center">
                <div className="w-12 h-12 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Wallet size={24} className="text-[#0D9488]" />
                </div>
                <p className="text-lg font-bold text-gray-900">{formatKz(wallet.balance).replace(' Kz', '')}</p>
                <p className="text-xs text-gray-500">Carteira</p>
              </button>
              <button onClick={() => setShowPoints(true)} className="text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Star size={24} className="text-amber-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{user.points || 0}</p>
                <p className="text-xs text-gray-500">Pontos</p>
              </button>
              <button onClick={() => navigate('/tuendi/history')} className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <History size={24} className="text-purple-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{user.total_orders || 0}</p>
                <p className="text-xs text-gray-500">Pedidos</p>
              </button>
            </div>
          </Card>

          {/* Tier Progress */}
          {tierInfo && tierInfo.next_tier && (
            <Card className="p-4 bg-white rounded-2xl shadow-sm border-0 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown size={18} className={tierConfig.textColor} />
                  <span className="font-semibold text-gray-900">Seu Nível</span>
                </div>
                <span className={`text-sm font-bold ${tierConfig.textColor}`}>{tierConfig.name}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${tierConfig.color} rounded-full transition-all duration-500`}
                  style={{ width: `${tierInfo.progress_percent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{user.points} pontos</span>
                <span>Faltam {tierInfo.points_to_next} para {TIER_CONFIG[tierInfo.next_tier.name]?.name}</span>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Card className="bg-white rounded-3xl shadow-sm border-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-50 p-1.5 rounded-none">
                <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs font-semibold">
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs font-semibold">
                  Configurações
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-[#0D9488] data-[state=active]:text-white text-xs font-semibold">
                  Segurança
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                    </div>
                  </div>
                  {user.email_verified ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Verificado</span>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-[#0D9488] text-xs">Verificar</Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-400">Telefone</p>
                      <p className="font-medium text-gray-900 text-sm">{user.phone || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-400">Localização</p>
                      <p className="font-medium text-gray-900 text-sm">{user.profile?.city || 'Luanda'}, {user.profile?.province || 'Luanda'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-400">Membro desde</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(user.created_at).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="p-4 bg-gradient-to-r from-[#0D9488]/10 to-[#0D9488]/5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Seu código de indicação</p>
                      <p className="text-lg font-bold text-[#0D9488]">{user.referral_code}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#0D9488]">
                      <Share2 size={16} className="mr-1" /> Compartilhar
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Notificações</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">Push Notifications</span>
                    </div>
                    <Switch 
                      checked={notifications.push} 
                      onCheckedChange={(v) => handleUpdateNotifications('push', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">Notificações por Email</span>
                    </div>
                    <Switch 
                      checked={notifications.email} 
                      onCheckedChange={(v) => handleUpdateNotifications('email', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Gift size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">Promoções e Ofertas</span>
                    </div>
                    <Switch 
                      checked={notifications.promotions} 
                      onCheckedChange={(v) => handleUpdateNotifications('promotions', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <History size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">Atualizações de Pedidos</span>
                    </div>
                    <Switch 
                      checked={notifications.order_updates} 
                      onCheckedChange={(v) => handleUpdateNotifications('order_updates', v)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="p-4 space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Alterar Senha</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Verificação em 2 Passos</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Métodos de Pagamento</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Help & Support */}
          <Card className="mt-4 p-4 bg-white rounded-2xl shadow-sm border-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Ajuda</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Central de Ajuda</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Falar com Suporte</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </Card>

          {/* Logout Button */}
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full mt-4 h-12 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
          >
            <LogOut size={18} className="mr-2" /> Sair da Conta
          </Button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-700 font-medium text-sm">Nome</Label>
              <Input
                className="mt-1.5 h-11 rounded-xl bg-gray-50"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium text-sm">Telefone</Label>
              <Input
                className="mt-1.5 h-11 rounded-xl bg-gray-50"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium text-sm">Endereço</Label>
              <Input
                className="mt-1.5 h-11 rounded-xl bg-gray-50"
                placeholder="Rua, número..."
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium text-sm">Cidade</Label>
                <Input
                  className="mt-1.5 h-11 rounded-xl bg-gray-50"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium text-sm">Província</Label>
                <Input
                  className="mt-1.5 h-11 rounded-xl bg-gray-50"
                  value={editForm.province}
                  onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                />
              </div>
            </div>
            <Button 
              onClick={handleUpdateProfile}
              className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={showPoints} onOpenChange={setShowPoints}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
          <div className={`bg-gradient-to-br ${tierConfig.color} p-6 text-center`}>
            <span className="text-5xl">{tierConfig.icon}</span>
            <h2 className="text-2xl font-bold text-white mt-2">{user.points || 0} Pontos</h2>
            <p className="text-white/70 text-sm">Nível {tierConfig.name}</p>
          </div>
          <div className="p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Benefícios do seu nível:</h4>
            <div className="space-y-2">
              {tierInfo?.benefits && (
                <>
                  {tierInfo.benefits.discount_percent > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles size={16} className="text-[#0D9488]" />
                      <span>{tierInfo.benefits.discount_percent}% de desconto em pedidos</span>
                    </div>
                  )}
                  {tierInfo.benefits.free_delivery && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles size={16} className="text-[#0D9488]" />
                      <span>Entregas gratuitas</span>
                    </div>
                  )}
                  {tierInfo.benefits.cashback_percent > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles size={16} className="text-[#0D9488]" />
                      <span>{tierInfo.benefits.cashback_percent}% de cashback</span>
                    </div>
                  )}
                  {tierInfo.benefits.priority_support && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles size={16} className="text-[#0D9488]" />
                      <span>Suporte prioritário</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button 
              onClick={() => { setShowPoints(false); navigate('/rewards'); }}
              className="w-full mt-4 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
            >
              <Gift size={18} className="mr-2" /> Ver Recompensas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
