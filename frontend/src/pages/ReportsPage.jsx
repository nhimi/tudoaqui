import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download, BarChart3, TrendingUp, Package, Car, Truck, Calendar, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Ano' }
];

export default function ReportsPage({ user }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.admin_role;
  const isPartner = user?.is_partner;

  useEffect(() => { loadSummary(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSummary = async () => {
    setLoading(true);
    try {
      let url;
      if (isAdmin) url = `${BACKEND_URL}/api/reports/admin/sales/summary?period=${period}`;
      else if (isPartner) url = `${BACKEND_URL}/api/reports/partner/sales/summary?period=${period}`;
      else url = `${BACKEND_URL}/api/reports/user/history/summary?period=${period}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) setSummary(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const downloadCSV = async () => {
    try {
      let url;
      if (isAdmin) url = `${BACKEND_URL}/api/reports/admin/sales/csv?period=${period}`;
      else if (isPartner) url = `${BACKEND_URL}/api/reports/partner/sales/csv?period=${period}`;
      else url = `${BACKEND_URL}/api/reports/user/history/csv?period=${period}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `relatorio_${period}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        toast.success('Relatório exportado!');
      } else {
        toast.error('Erro ao exportar');
      }
    } catch (e) { toast.error('Erro ao exportar'); }
  };

  const fmtKz = (v) => `${(v || 0).toLocaleString()} Kz`;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center" data-testid="back-btn">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios</h1>
              <p className="text-sm text-white/60">{isAdmin ? 'Administração' : isPartner ? 'Parceiro' : 'Meu Histórico'}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {PERIOD_OPTIONS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)} data-testid={`period-${p.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${period === p.id ? 'bg-white text-[#1A1A1A]' : 'bg-white/15 text-white'}`}
              >{p.label}</button>
            ))}
          </div>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : summary ? (
            <>
              {/* Revenue Card */}
              <Card className="p-6 bg-gradient-to-br from-[#D62828] to-[#D62828]/80 text-white rounded-2xl border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">{isAdmin ? 'Receita Total' : isPartner ? 'Vendas' : 'Total Gasto'}</p>
                    <p className="text-3xl font-black mt-1">{fmtKz(summary.total_revenue || summary.total_spent)}</p>
                  </div>
                  <TrendingUp size={32} className="text-white/30" />
                </div>
                {isAdmin && summary.iva_14 > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
                    <span className="text-white/70">IVA 14%</span>
                    <span className="font-bold">{fmtKz(summary.iva_14)}</span>
                  </div>
                )}
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {summary.orders && (
                  <Card className="p-4 bg-white rounded-xl" data-testid="stat-orders">
                    <Package size={20} className="text-[#FCBF49] mb-2" />
                    <p className="text-2xl font-black text-[#1A1A1A]">{summary.orders.count}</p>
                    <p className="text-xs text-gray-500">Pedidos</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{fmtKz(summary.orders.total)}</p>
                  </Card>
                )}
                {summary.rides && (
                  <Card className="p-4 bg-white rounded-xl" data-testid="stat-rides">
                    <Car size={20} className="text-[#0D9488] mb-2" />
                    <p className="text-2xl font-black text-[#1A1A1A]">{summary.rides.count}</p>
                    <p className="text-xs text-gray-500">Corridas</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{fmtKz(summary.rides.total)}</p>
                  </Card>
                )}
                {summary.deliveries && (
                  <Card className="p-4 bg-white rounded-xl" data-testid="stat-deliveries">
                    <Truck size={20} className="text-[#9333EA] mb-2" />
                    <p className="text-2xl font-black text-[#1A1A1A]">{summary.deliveries.count}</p>
                    <p className="text-xs text-gray-500">Entregas</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{fmtKz(summary.deliveries.total)}</p>
                  </Card>
                )}
                <Card className="p-4 bg-white rounded-xl" data-testid="stat-transactions">
                  <Calendar size={20} className="text-[#D62828] mb-2" />
                  <p className="text-2xl font-black text-[#1A1A1A]">{summary.total_transactions || summary.total_orders || 0}</p>
                  <p className="text-xs text-gray-500">Total Transações</p>
                </Card>
              </div>

              {/* Export Button */}
              <Button onClick={downloadCSV} data-testid="export-csv-btn"
                className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={20} /> Exportar CSV
              </Button>
            </>
          ) : (
            <Card className="p-8 text-center bg-white rounded-2xl">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Sem dados para o período</p>
            </Card>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
