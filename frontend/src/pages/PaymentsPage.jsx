import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Building2, Copy, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const METHOD_ICONS = {
  multicaixa_express: CreditCard,
  unitel_money: Smartphone,
  bai_paga: QrCode,
  transferencia: Building2
};

const STATUS_CONFIG = {
  pendente: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pendente', icon: Clock },
  confirmado: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmado', icon: CheckCircle },
  verificado: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Verificado', icon: CheckCircle },
  rejeitado: { color: 'text-red-600', bg: 'bg-red-50', label: 'Rejeitado', icon: AlertCircle }
};

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [tab, setTab] = useState('pagar');

  useEffect(() => {
    loadMethods();
    loadPayments();
  }, []);

  const loadMethods = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/methods`, { credentials: 'include' });
      if (res.ok) setMethods((await res.json()).methods || []);
    } catch (e) {}
  };

  const loadPayments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/my-payments`, { credentials: 'include' });
      if (res.ok) setMyPayments((await res.json()).payments || []);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const createPayment = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      toast.error('Selecione um método e insira o valor');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: selectedMethod,
          description: description || 'Carregamento de carteira'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentResult(data);
        setShowResult(true);
        loadPayments();
        toast.success('Pagamento criado!');
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Erro ao criar pagamento');
      }
    } catch (e) { toast.error('Erro de conexão'); }
    finally { setProcessing(false); }
  };

  const confirmPayment = async () => {
    if (!confirmPaymentId || !confirmCode) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payment_id: confirmPaymentId, confirmation_code: confirmCode })
      });
      if (res.ok) {
        toast.success('Pagamento confirmado!');
        setShowConfirm(false);
        setConfirmCode('');
        loadPayments();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Código inválido');
      }
    } catch (e) { toast.error('Erro de conexão'); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copiado!'); };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#0D9488] to-[#0D9488]/80 px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center" data-testid="back-btn">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
          </div>
          <div className="flex gap-2 mt-2">
            {['pagar', 'histórico'].map(t => (
              <button key={t} onClick={() => setTab(t)} data-testid={`tab-${t}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? 'bg-white text-[#0D9488]' : 'bg-white/15 text-white'}`}
              >{t === 'pagar' ? 'Pagar' : 'Histórico'}</button>
            ))}
          </div>
        </div>

        <div className="px-6 mt-6">
          {tab === 'pagar' ? (
            <div className="space-y-4">
              <h2 className="font-bold text-[#1A1A1A] text-lg">Método de Pagamento</h2>
              <div className="grid grid-cols-2 gap-3">
                {methods.map(m => {
                  const Icon = METHOD_ICONS[m.id] || CreditCard;
                  return (
                    <Card key={m.id} data-testid={`method-${m.id}`}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-4 cursor-pointer rounded-xl transition border-2 ${selectedMethod === m.id ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-transparent bg-white'}`}
                    >
                      <Icon size={24} className={selectedMethod === m.id ? 'text-[#0D9488]' : 'text-gray-400'} />
                      <h3 className="font-bold text-sm mt-2">{m.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{m.processing_time}</p>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-3 mt-4">
                <label className="text-sm font-semibold text-gray-700">Valor (Kz)</label>
                <Input data-testid="payment-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="h-14 text-2xl font-bold text-center rounded-xl" />
                <div className="flex gap-2">
                  {[1000, 2500, 5000, 10000].map(v => (
                    <button key={v} onClick={() => setAmount(v.toString())} data-testid={`quick-amount-${v}`}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${amount === v.toString() ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >{(v/1000).toFixed(0)}k</button>
                  ))}
                </div>
              </div>

              <Button data-testid="create-payment-btn" onClick={createPayment} disabled={processing || !selectedMethod || !amount}
                className="w-full bg-[#0D9488] hover:bg-[#0D9488]/90 text-white h-14 rounded-xl font-bold text-lg mt-4"
              >{processing ? 'Processando...' : 'Gerar Referência de Pagamento'}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myPayments.length === 0 ? (
                <Card className="p-8 text-center bg-white rounded-2xl">
                  <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum pagamento realizado</p>
                </Card>
              ) : myPayments.map((p, i) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pendente;
                const StatusIcon = sc.icon;
                return (
                  <Card key={i} data-testid={`payment-item-${i}`} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{p.method_name || p.payment_method}</p>
                        <p className="text-sm text-gray-500">{p.description || 'Pagamento'}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.created_at?.slice(0,10)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{p.amount?.toLocaleString()} Kz</p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${sc.bg} ${sc.color}`}>
                          <StatusIcon size={12} />{sc.label}
                        </span>
                      </div>
                    </div>
                    {p.status === 'pendente' && (
                      <Button size="sm" variant="outline" onClick={() => { setConfirmPaymentId(p.payment_id); setShowConfirm(true); }}
                        data-testid={`confirm-payment-${i}`}
                        className="mt-3 w-full border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/10 rounded-lg"
                      >Confirmar Pagamento <ChevronRight size={14} /></Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referência de Pagamento</DialogTitle>
          </DialogHeader>
          {paymentResult && (
            <div className="space-y-4">
              <div className="bg-[#0D9488]/10 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-500">Valor a pagar</p>
                <p className="text-3xl font-black text-[#0D9488]">{paymentResult.amount?.toLocaleString()} Kz</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <p className="text-xs text-amber-700 font-semibold mb-1">Código de Confirmação</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">{paymentResult.confirmation_code}</span>
                  <button onClick={() => copy(paymentResult.confirmation_code)} data-testid="copy-confirmation-code"><Copy size={16} className="text-amber-600" /></button>
                </div>
              </div>

              {paymentResult.reference && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Referência</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{paymentResult.reference}</span>
                    <button onClick={() => copy(paymentResult.reference)} data-testid="copy-reference"><Copy size={16} className="text-gray-400" /></button>
                  </div>
                </div>
              )}

              {paymentResult.instructions && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Instruções:</p>
                  {paymentResult.instructions.map((inst, i) => (
                    <p key={i} className="text-sm text-gray-600">{inst}</p>
                  ))}
                </div>
              )}

              <Button onClick={() => { setShowResult(false); setTab('histórico'); }} className="w-full bg-[#0D9488] text-white" data-testid="done-payment-btn">
                Entendido
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Insira o código de confirmação que recebeu ao criar o pagamento.</p>
            <Input data-testid="confirm-code-input" value={confirmCode} onChange={e => setConfirmCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" className="h-12 text-center font-mono text-lg" />
            <Button onClick={confirmPayment} disabled={!confirmCode} className="w-full bg-[#0D9488] text-white" data-testid="submit-confirm-btn">
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
