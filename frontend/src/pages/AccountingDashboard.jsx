import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balancete');
  const [trialBalance, setTrialBalance] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [journal, setJournal] = useState([]);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      // Carregar balancete
      const tbResponse = await fetch(`${BACKEND_URL}/api/accounting/trial-balance`, {
        credentials: 'include'
      });
      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        setTrialBalance(tbData);
      }

      // Carregar balanço
      const bsResponse = await fetch(`${BACKEND_URL}/api/accounting/balance-sheet`, {
        credentials: 'include'
      });
      if (bsResponse.ok) {
        const bsData = await bsResponse.json();
        setBalanceSheet(bsData);
      }

      // Carregar demonstração de resultados
      const isResponse = await fetch(`${BACKEND_URL}/api/accounting/income-statement`, {
        credentials: 'include'
      });
      if (isResponse.ok) {
        const isData = await isResponse.json();
        setIncomeStatement(isData);
      }

      // Carregar diário
      const jResponse = await fetch(`${BACKEND_URL}/api/accounting/journal`, {
        credentials: 'include'
      });
      if (jResponse.ok) {
        const jData = await jResponse.json();
        setJournal(jData.journal || []);
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 2
    }).format(value) + ' Kz';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">A carregar contabilidade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate('/partner/dashboard')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Contabilidade</h1>
              <p className="text-white/80 text-sm">Sistema PGCA - Angola</p>
            </div>
          </div>

          {/* Quick Stats */}
          {incomeStatement && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
                <p className="text-white/80 text-sm mb-1">Proveitos</p>
                <p className="text-2xl font-bold text-[#2A9D8F]">
                  {formatCurrency(incomeStatement.income_statement.total_proveitos)}
                </p>
              </Card>
              <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
                <p className="text-white/80 text-sm mb-1">Custos</p>
                <p className="text-2xl font-bold text-[#D62828]">
                  {formatCurrency(incomeStatement.income_statement.total_custos)}
                </p>
              </Card>
              <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
                <p className="text-white/80 text-sm mb-1">Resultado</p>
                <p className={`text-2xl font-bold ${
                  incomeStatement.income_statement.resultado_liquido >= 0 ? 'text-[#2A9D8F]' : 'text-[#D62828]'
                }`}>
                  {formatCurrency(incomeStatement.income_statement.resultado_liquido)}
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-4">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => navigate('/accounting/new-entry')}
            className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
          >
            <Plus size={18} className="mr-2" />
            Novo Lançamento
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="balancete">
              <BarChart3 size={16} className="mr-2" />
              Balancete
            </TabsTrigger>
            <TabsTrigger value="balanco">
              <FileText size={16} className="mr-2" />
              Balanço
            </TabsTrigger>
            <TabsTrigger value="resultados">
              <TrendingUp size={16} className="mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="diario">
              <BookOpen size={16} className="mr-2" />
              Diário
            </TabsTrigger>
          </TabsList>

          {/* BALANCETE */}
          <TabsContent value="balancete">
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">Balancete de Verificação</h2>
                {trialBalance && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    trialBalance.summary.is_balanced 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {trialBalance.summary.is_balanced ? '✓ Equilibrado' : '✗ Desequilibrado'}
                  </span>
                )}
              </div>

              {trialBalance && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Código</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Conta</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Débito</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Crédito</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {trialBalance.trial_balance.map((account, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{account.account_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{account.account_name}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">
                              {account.total_debit > 0 ? formatCurrency(account.total_debit) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">
                              {account.total_credit > 0 ? formatCurrency(account.total_credit) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              {formatCurrency(Math.abs(account.balance))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 font-bold">
                        <tr>
                          <td colSpan="2" className="px-4 py-3 text-sm">TOTAIS</td>
                          <td className="px-4 py-3 text-sm text-right text-[#2A9D8F]">
                            {formatCurrency(trialBalance.summary.total_debit_balance)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-[#D62828]">
                            {formatCurrency(trialBalance.summary.total_credit_balance)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* BALANÇO */}
          <TabsContent value="balanco">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ATIVO */}
              <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">ATIVO</h3>
                
                {balanceSheet && (
                  <div className="space-y-4">
                    {/* Meios Monetários */}
                    {balanceSheet.balance_sheet.ativo.meios_monetarios.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2">Meios Monetários</p>
                        {balanceSheet.balance_sheet.ativo.meios_monetarios.map((acc, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-4 py-1">
                            <span className="text-gray-600">{acc.account_name}</span>
                            <span className="font-medium">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Terceiros */}
                    {balanceSheet.balance_sheet.ativo.terceiros.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2">Terceiros</p>
                        {balanceSheet.balance_sheet.ativo.terceiros.map((acc, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-4 py-1">
                            <span className="text-gray-600">{acc.account_name}</span>
                            <span className="font-medium">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL ATIVO</span>
                        <span className="text-[#2A9D8F]">
                          {formatCurrency(balanceSheet.summary.total_ativo)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* PASSIVO + CAPITAL PRÓPRIO */}
              <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">PASSIVO + CAPITAL PRÓPRIO</h3>
                
                {balanceSheet && (
                  <div className="space-y-4">
                    {/* Passivo */}
                    {balanceSheet.balance_sheet.passivo.terceiros.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2">Passivo</p>
                        {balanceSheet.balance_sheet.passivo.terceiros.map((acc, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-4 py-1">
                            <span className="text-gray-600">{acc.account_name}</span>
                            <span className="font-medium">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Capital Próprio */}
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Capital Próprio</p>
                      {balanceSheet.balance_sheet.capital_proprio.capital.map((acc, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-4 py-1">
                          <span className="text-gray-600">{acc.account_name}</span>
                          <span className="font-medium">{formatCurrency(acc.balance)}</span>
                        </div>
                      ))}
                      {balanceSheet.balance_sheet.capital_proprio.resultados.map((acc, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-4 py-1">
                          <span className="text-gray-600">{acc.account_name}</span>
                          <span className={`font-medium ${acc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(acc.balance)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span className="text-[#D62828]">
                          {formatCurrency(balanceSheet.summary.total_passivo_capital)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* DEMONSTRAÇÃO DE RESULTADOS */}
          <TabsContent value="resultados">
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Demonstração de Resultados</h2>

              {incomeStatement && (
                <div className="space-y-6">
                  {/* Proveitos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="text-[#2A9D8F]" size={20} />
                      <h3 className="text-lg font-semibold text-gray-900">Proveitos</h3>
                    </div>
                    {incomeStatement.income_statement.proveitos.map((acc, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-2 pl-4">
                        <span className="text-gray-600">{acc.account_name}</span>
                        <span className="font-medium text-[#2A9D8F]">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total Proveitos</span>
                      <span className="text-[#2A9D8F]">
                        {formatCurrency(incomeStatement.income_statement.total_proveitos)}
                      </span>
                    </div>
                  </div>

                  {/* Custos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="text-[#D62828]" size={20} />
                      <h3 className="text-lg font-semibold text-gray-900">Custos</h3>
                    </div>
                    {incomeStatement.income_statement.custos.map((acc, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-2 pl-4">
                        <span className="text-gray-600">{acc.account_name}</span>
                        <span className="font-medium text-[#D62828]">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total Custos</span>
                      <span className="text-[#D62828]">
                        {formatCurrency(incomeStatement.income_statement.total_custos)}
                      </span>
                    </div>
                  </div>

                  {/* Resultado Líquido */}
                  <div className="pt-4 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-[#1A1A1A]" size={24} />
                        <span className="text-xl font-bold">Resultado Líquido do Exercício</span>
                      </div>
                      <span className={`text-2xl font-bold ${
                        incomeStatement.income_statement.resultado_liquido >= 0 
                          ? 'text-[#2A9D8F]' 
                          : 'text-[#D62828]'
                      }`}>
                        {formatCurrency(incomeStatement.income_statement.resultado_liquido)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* DIÁRIO */}
          <TabsContent value="diario">
            <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Livro Diário</h2>

              {journal.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum lançamento registrado</p>
                  <Button
                    onClick={() => navigate('/accounting/new-entry')}
                    className="mt-4 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
                  >
                    Criar Primeiro Lançamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {journal.map((entry, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{entry.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString('pt-AO')} - Ref: {entry.reference}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          #{entry.entry_id.slice(-6)}
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Conta</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Débito</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Crédito</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.lines && entry.lines.map((line, lineIdx) => (
                              <tr key={lineIdx} className="border-t border-gray-100">
                                <td className="px-3 py-2">
                                  <span className="font-mono text-xs text-gray-500 mr-2">{line.account_code}</span>
                                  <span className="text-gray-900">{line.account_name}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
