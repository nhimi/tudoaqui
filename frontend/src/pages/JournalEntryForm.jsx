import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function JournalEntryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState({});
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([
    { account_code: '', debit: '', credit: '', description: '' },
    { account_code: '', debit: '', credit: '', description: '' }
  ]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounting/chart-of-accounts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.chart_of_accounts || {});
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const addLine = () => {
    setLines([...lines, { account_code: '', debit: '', credit: '', description: '' }]);
  };

  const removeLine = (idx) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    // Auto-clear opposite field
    if (field === 'debit' && value) updated[idx].credit = '';
    if (field === 'credit' && value) updated[idx].debit = '';
    setLines(updated);
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) { toast.error('Preencha a descrição'); return; }
    if (!isBalanced) { toast.error('Débito e Crédito devem ser iguais'); return; }

    const validLines = lines.filter(l => l.account_code && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (validLines.length < 2) { toast.error('Mínimo de 2 linhas válidas'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounting/journal-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description,
          reference,
          date: entryDate,
          lines: validLines.map(l => ({
            account_code: l.account_code,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description || description
          }))
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao criar lançamento');
      }

      toast.success('Lançamento registrado com sucesso!');
      navigate('/partner/accounting');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2 }).format(v) + ' Kz';
  const accountEntries = Object.entries(accounts);

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/partner/accounting')} variant="ghost" className="text-white hover:bg-white/10" data-testid="back-to-accounting-btn">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="journal-entry-title">Novo Lançamento</h1>
            <p className="text-white/70 text-sm">Sistema PGCA - Angola</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
            <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Informações do Lançamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label className="font-semibold text-[#1A1A1A] mb-1 block">Descrição *</Label>
                <Input data-testid="entry-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Venda de serviços" className="h-11" required />
              </div>
              <div>
                <Label className="font-semibold text-[#1A1A1A] mb-1 block">Data</Label>
                <Input data-testid="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="mt-4">
              <Label className="font-semibold text-[#1A1A1A] mb-1 block">Referência</Label>
              <Input data-testid="entry-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex: FT 2026/000001" className="h-11" />
            </div>
          </Card>

          <Card className="p-6 bg-white border-black/5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1A1A1A] text-lg">Linhas do Lançamento</h2>
              <Button type="button" onClick={addLine} variant="outline" size="sm" data-testid="add-line-btn">
                <Plus size={16} className="mr-1" /> Adicionar Linha
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase px-1">
                <div className="col-span-5">Conta</div>
                <div className="col-span-3 text-right">Débito</div>
                <div className="col-span-3 text-right">Crédito</div>
                <div className="col-span-1"></div>
              </div>

              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center" data-testid={`journal-line-${idx}`}>
                  <div className="col-span-5">
                    <Select value={line.account_code} onValueChange={(v) => updateLine(idx, 'account_code', v)}>
                      <SelectTrigger className="h-10" data-testid={`line-account-${idx}`}>
                        <SelectValue placeholder="Selecionar conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountEntries.map(([code, acc]) => (
                          <SelectItem key={code} value={code}>{code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min="0" step="0.01" placeholder="0.00" className="h-10 text-right" data-testid={`line-debit-${idx}`} value={line.debit} onChange={(e) => updateLine(idx, 'debit', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min="0" step="0.01" placeholder="0.00" className="h-10 text-right" data-testid={`line-credit-${idx}`} value={line.credit} onChange={(e) => updateLine(idx, 'credit', e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)} disabled={lines.length <= 2} className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" data-testid={`remove-line-${idx}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-12 gap-2 items-center font-bold">
                <div className="col-span-5 text-[#1A1A1A]">TOTAIS</div>
                <div className="col-span-3 text-right text-[#2A9D8F]">{formatCurrency(totalDebit)}</div>
                <div className="col-span-3 text-right text-[#D62828]">{formatCurrency(totalCredit)}</div>
                <div className="col-span-1"></div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-semibold" data-testid="balance-status">
                    <CheckCircle size={16} /> Equilibrado
                  </span>
                ) : totalDebit > 0 || totalCredit > 0 ? (
                  <span className="text-sm text-red-500 font-semibold" data-testid="balance-status">
                    Diferença: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => navigate('/partner/accounting')} data-testid="cancel-entry-btn">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isBalanced} className="flex-1 h-12 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white font-bold" data-testid="submit-entry-btn">
              {loading ? 'A registrar...' : 'Registrar Lançamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
