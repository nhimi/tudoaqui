import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  LayoutDashboard, 
  Store, 
  Wallet, 
  FileText, 
  TrendingUp, 
  Package, 
  DollarSign,
  ArrowUpRight,
  Crown,
  Users,
  BarChart3,
  UtensilsCrossed,
  ClipboardList,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/partners/dashboard`, {
        credentials: 'include'
      });

      if (response.status === 404) {
        // Usuário não é parceiro ainda
        navigate('/partner/register');
        return;
      }

      if (!response.ok) throw new Error('Erro ao carregar dashboard');

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      basico: '#6B7280',
      premium: '#9333EA',
      enterprise: '#D97706'
    };
    return colors[tier] || colors.basico;
  };

  const getTierIcon = (tier) => {
    if (tier === 'enterprise') return <Crown className="text-[#D97706]" size={20} />;
    if (tier === 'premium') return <Crown className="text-[#9333EA]" size={20} />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { partner, tier_info, stats, recent_transactions } = dashboardData;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      {/* Header */}
      <div 
        className="bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 px-6 pt-12 pb-20"
        style={{ backgroundColor: getTierColor(partner.tier) }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{partner.business_name}</h1>
                {getTierIcon(partner.tier)}
              </div>
              <p className="text-white/90 text-sm capitalize">Parceiro {tier_info.name}</p>
            </div>
            <Button
              onClick={() => navigate('/partner/upgrade')}
              variant="ghost"
              className="text-white border-white/30 hover:bg-white/10"
            >
              <ArrowUpRight size={18} className="mr-1" />
              Upgrade
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo</p>
                <p className="text-2xl font-bold text-[#2A9D8F]">
                  {stats.wallet_balance.toLocaleString()} Kz
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center">
                <Wallet size={24} className="text-[#2A9D8F]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-[#D62828]">
                  {stats.total_revenue.toLocaleString()} Kz
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#D62828]/10 flex items-center justify-center">
                <TrendingUp size={24} className="text-[#D62828]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Serviços Ativos</p>
                <p className="text-2xl font-bold text-[#9333EA]">
                  {stats.active_services}/{stats.total_services}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#9333EA]/10 flex items-center justify-center">
                <Package size={24} className="text-[#9333EA]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-black/5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Comissão</p>
                <p className="text-2xl font-bold text-[#FCBF49]">
                  {(partner.commission_rate * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#FCBF49]/10 flex items-center justify-center">
                <DollarSign size={24} className="text-[#FCBF49]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] text-lg mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/partner/services')}
                  className="h-20 bg-[#9333EA] hover:bg-[#9333EA]/90 text-white flex-col"
                >
                  <Store size={24} className="mb-2" />
                  <span className="text-sm">Gerir Serviços</span>
                </Button>
                <Button
                  onClick={() => navigate('/partner/wallet')}
                  variant="outline"
                  className="h-20 border-2 flex-col hover:bg-gray-50"
                >
                  <Wallet size={24} className="mb-2" />
                  <span className="text-sm">Carteira</span>
                </Button>
                <Button
                  onClick={() => navigate('/partner/accounting')}
                  variant="outline"
                  className="h-20 border-2 flex-col hover:bg-gray-50"
                >
                  <FileText size={24} className="mb-2" />
                  <span className="text-sm">Contabilidade</span>
                </Button>
                <Button
                  onClick={() => navigate('/partner/analytics')}
                  variant="outline"
                  className="h-20 border-2 flex-col hover:bg-gray-50"
                >
                  <BarChart3 size={24} className="mb-2" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A1A] text-lg">Transações Recentes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/partner/wallet')}
                >
                  Ver Todas
                </Button>
              </div>
              <div className="space-y-3">
                {recent_transactions.slice(0, 5).map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <DollarSign size={18} className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{Math.abs(txn.amount).toLocaleString()} Kz
                    </span>
                  </div>
                ))}
                {recent_transactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Nenhuma transação ainda</p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tier Benefits */}
            <Card className="p-6 bg-gradient-to-br from-[#9333EA]/10 to-[#9333EA]/5 border-[#9333EA]/20 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                {getTierIcon(partner.tier)}
                <h3 className="font-bold text-[#1A1A1A]">Plano {tier_info.name}</h3>
              </div>
              <ul className="space-y-2">
                {tier_info.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#2A9D8F] mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {partner.tier !== 'enterprise' && (
                <Button
                  onClick={() => navigate('/partner/upgrade')}
                  className="w-full mt-4 bg-[#9333EA] hover:bg-[#9333EA]/90 text-white"
                >
                  Fazer Upgrade
                </Button>
              )}
            </Card>

            {/* Support */}
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Suporte</h3>
              <p className="text-sm text-gray-600 mb-4">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
              <Button
                variant="outline"
                className="w-full"
              >
                <Users size={18} className="mr-2" />
                Contactar Suporte
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
