import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Package, Users, Star, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PartnerAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/analytics`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar analytics');
      setAnalytics(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FCBF49] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
        <Card className="p-8 text-center bg-white rounded-xl">
          <p className="text-gray-600 font-medium">Registe-se como parceiro para ver analytics</p>
          <Button onClick={() => navigate('/partner/register')} className="mt-4 bg-[#FCBF49] text-[#1A1A1A]" data-testid="register-partner-btn">
            Registar como Parceiro
          </Button>
        </Card>
      </div>
    );
  }

  const { partner, services, revenue, monthly, transactions, tier_info } = analytics;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/partner/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="analytics-back-btn">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="analytics-title">Analytics</h1>
            <p className="text-white/70 text-sm">{partner?.business_name} - {tier_info?.name || 'Básico'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Receita Total', value: formatKz(revenue?.total), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Receita Líquida', value: formatKz(revenue?.net), icon: TrendingUp, color: 'text-[#2A9D8F]', bg: 'bg-[#2A9D8F]/10' },
            { label: 'Serviços Ativos', value: services?.active || 0, icon: Package, color: 'text-[#FCBF49]', bg: 'bg-[#FCBF49]/10' },
            { label: 'Saldo Carteira', value: formatKz(revenue?.wallet_balance), icon: Wallet, color: 'text-[#D62828]', bg: 'bg-[#D62828]/10' }
          ].map((item, idx) => (
            <Card key={idx} className="p-4 bg-white border-black/5 rounded-xl shadow-sm" data-testid={`kpi-${idx}`}>
              <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-3`}>
                <item.icon size={20} className={item.color} />
              </div>
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">{item.value}</p>
            </Card>
          ))}
        </div>

        {/* Commission Info */}
        <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
          <h3 className="font-bold text-[#1A1A1A] mb-3">Comissões e Taxas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Taxa Comissão</p>
              <p className="text-2xl font-bold text-[#D62828]">{((partner?.commission_rate || 0) * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Total Comissões</p>
              <p className="text-lg font-bold text-orange-600">{formatKz(revenue?.commission_paid)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Tier Atual</p>
              <p className="text-lg font-bold text-[#2A9D8F]">{tier_info?.name || 'Básico'}</p>
            </div>
          </div>
        </Card>

        {/* Monthly Revenue */}
        {Object.keys(monthly || {}).length > 0 && (
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-3">Receita Mensal</h3>
            <div className="space-y-2">
              {Object.entries(monthly).sort().reverse().map(([month, data]) => (
                <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{data.orders} pedidos</span>
                    <span className="font-bold text-[#2A9D8F]">{formatKz(data.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
          <h3 className="font-bold text-[#1A1A1A] mb-3">Transações Recentes</h3>
          {(transactions || []).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4" data-testid="no-transactions">Nenhuma transação registrada</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`transaction-${idx}`}>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t.description}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('pt-AO')}</p>
                  </div>
                  <span className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '-'}{formatKz(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
