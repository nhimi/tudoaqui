import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User as UserIcon, Mail, Phone, LogOut, Settings, HelpCircle, Crown, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('normal');
  const [tierInfo, setTierInfo] = useState(null);
  const [allTiers, setAllTiers] = useState({});
  const [upgrading, setUpgrading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    try {
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setUserTier(userData.user_tier || 'normal');
      }
      const tiersRes = await fetch(`${BACKEND_URL}/api/partners/tiers`, { credentials: 'include' });
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setAllTiers(tiersData.user_tiers || {});
        setTierInfo(tiersData.user_tiers || {});
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier) => {
    setUpgrading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/user-tier/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro no upgrade');
      }
      const data = await res.json();
      setUserTier(tier);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      toast.success('Sessão terminada');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao terminar sessão');
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Configurações', action: () => toast.info('Em breve'), testId: 'settings-btn' },
    { icon: HelpCircle, label: 'Ajuda & Suporte', action: () => toast.info('Em breve'), testId: 'help-btn' },
  ];

  return (
    <div className="mobile-container">
      {loading ? (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-20 rounded-b-[2rem]">
          <h1 className="text-3xl font-bold text-white mb-8" data-testid="profile-page-title">Perfil</h1>
          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 border-4 border-white/20 mb-4" data-testid="user-avatar">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-[#D62828] text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mb-1" data-testid="user-name">{user?.name || 'Utilizador'}</h2>
            <p className="text-white/70 text-sm" data-testid="user-email">{user?.email}</p>
            {userTier === 'premium' && (
              <div className="flex items-center gap-1 mt-2 bg-[#FCBF49]/20 px-3 py-1 rounded-full" data-testid="premium-badge">
                <Crown size={14} className="text-[#FCBF49]" />
                <span className="text-[#FCBF49] text-xs font-bold">PREMIUM</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 -mt-12 space-y-4">
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-4">Informações Pessoais</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserIcon size={20} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={20} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{user?.email || 'N/A'}</p>
                </div>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={20} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-semibold text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* User Tier Section */}
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm" data-testid="tier-section">
            <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Star size={20} className="text-[#FCBF49]" />
              Plano de Utilizador
            </h3>
            <div className="space-y-3">
              {Object.entries(allTiers).map(([key, tier]) => (
                <div
                  key={key}
                  data-testid={`tier-option-${key}`}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userTier === key
                      ? 'border-[#FCBF49] bg-[#FCBF49]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {key === 'premium' && <Crown size={18} className="text-[#FCBF49]" />}
                      <span className="font-bold text-[#1A1A1A]">{tier.name}</span>
                    </div>
                    {userTier === key ? (
                      <span className="flex items-center gap-1 text-sm text-[#2A9D8F] font-semibold">
                        <CheckCircle size={16} /> Atual
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-[#D62828]">
                        {tier.price > 0 ? `${tier.price.toLocaleString()} Kz/mês` : 'Grátis'}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1 mb-3">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle size={14} className="text-[#2A9D8F] mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {userTier !== key && key === 'premium' && (
                    <Button
                      data-testid="upgrade-to-premium-btn"
                      onClick={() => handleUpgrade('premium')}
                      disabled={upgrading}
                      className="w-full bg-[#FCBF49] hover:bg-[#FCBF49]/90 text-[#1A1A1A] font-bold"
                    >
                      {upgrading ? 'A processar...' : 'Fazer Upgrade'}
                    </Button>
                  )}
                  {userTier === 'premium' && key === 'normal' && (
                    <Button
                      data-testid="downgrade-to-normal-btn"
                      onClick={() => handleUpgrade('normal')}
                      disabled={upgrading}
                      variant="outline"
                      className="w-full"
                    >
                      Voltar ao Plano Normal
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-4">Menu</h3>
            <div className="space-y-2">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  data-testid={item.testId}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <item.icon size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Button
            data-testid="logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 border-2 border-[#D62828] text-[#D62828] hover:bg-[#D62828] hover:text-white font-bold rounded-lg"
          >
            <LogOut className="mr-2" size={20} />
            Terminar Sessão
          </Button>

          <div className="text-center text-xs text-gray-500 mt-6 pt-6 border-t">
            <p className="font-semibold text-gray-700">TudoAqui Marketplace</p>
            <p className="mt-1">Desenvolvido por</p>
            <p className="font-semibold text-gray-700">Sincesoft-Sinceridade Service</p>
            <p className="mt-2 text-gray-400">Versão 1.0.0</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
