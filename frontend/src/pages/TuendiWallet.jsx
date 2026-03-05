import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, ArrowLeft, Clock, CheckCircle, Sparkles, QrCode, Copy, Building2, Smartphone, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TOPUP_OPTIONS = [1000, 2500, 5000, 10000, 25000, 50000];

const TRANSACTION_CONFIG = {
  ride_payment: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', label: 'Viagem' },
  delivery_payment: { icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Entrega' },
  credit_add: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Carregamento' },
  driver_earning: { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Ganho' },
  withdrawal: { icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Levantamento' },
  coupon_discount: { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Desconto' },
};

export default function TuendiWallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(5000);
  const [paymentRef, setPaymentRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // transfer, mobile

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/wallet`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!paymentRef.trim()) {
      toast.error('Insira o comprovativo de pagamento');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: topupAmount,
          payment_reference: paymentRef
        })
      });
      if (!res.ok) throw new Error('Erro ao carregar carteira');
      const data = await res.json();
      toast.success(`Carteira carregada! Novo saldo: ${formatKz(data.balance)}`);
      setShowTopup(false);
      setPaymentRef('');
      loadWallet();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D9488] via-[#0F766E] to-[#115E59] px-5 pt-12 pb-24 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-xl font-bold text-white">Carteira Tuendi</h1>
            </div>

            {/* Balance Card */}
            <div className="text-center">
              <p className="text-white/60 text-sm font-medium mb-2">Saldo disponível</p>
              <p className="text-5xl font-black text-white mb-1">{formatKz(wallet.balance).replace(' Kz', '')}</p>
              <p className="text-white/60 text-lg">Kz</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-12">
          {/* Action Buttons */}
          <Card className="p-4 bg-white rounded-3xl shadow-xl border-0 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setShowTopup(true)}
                className="h-14 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-2xl shadow-lg shadow-[#0D9488]/30"
              >
                <Plus size={20} className="mr-2" /> Carregar
              </Button>
              <Button 
                variant="outline"
                className="h-14 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50"
              >
                <QrCode size={20} className="mr-2" /> Pagar QR
              </Button>
            </div>
          </Card>

          {/* Quick Topup */}
          <Card className="p-5 bg-white rounded-3xl shadow-sm border-0 mb-4">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-[#0D9488]" />
              Carregamento Rápido
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {TOPUP_OPTIONS.map(amount => (
                <Button 
                  key={amount}
                  variant="outline"
                  onClick={() => { setTopupAmount(amount); setShowTopup(true); }}
                  className="h-14 rounded-2xl border-gray-100 hover:border-[#0D9488] hover:bg-[#0D9488]/5 font-bold text-gray-700 hover:text-[#0D9488] transition-all"
                >
                  {(amount / 1000).toFixed(0)}k
                </Button>
              ))}
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Histórico</h3>
              <Button variant="ghost" size="sm" className="text-[#0D9488] text-sm">
                Ver tudo
              </Button>
            </div>
            
            {wallet.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-3">
                {wallet.transactions.map((txn, idx) => {
                  const config = TRANSACTION_CONFIG[txn.type] || TRANSACTION_CONFIG.credit_add;
                  const Icon = config.icon;
                  const isCredit = ['credit_add', 'driver_earning', 'coupon_discount'].includes(txn.type);
                  
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <Icon size={20} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{config.label}</p>
                        <p className="text-xs text-gray-500 truncate">{txn.description || formatDate(txn.created_at)}</p>
                      </div>
                      <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatKz(txn.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhuma transação</p>
                <p className="text-sm text-gray-400 mt-1">Carregue sua carteira para começar</p>
              </div>
            )}
          </Card>

          {/* Security Info */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 rounded-2xl mt-4">
            <div className="flex items-start gap-3">
              <Shield size={22} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Carteira Protegida</h4>
                <p className="text-xs text-gray-600 mt-1">Suas transações são seguras e criptografadas. O saldo é protegido pelo TudoAqui.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Topup Dialog */}
      <Dialog open={showTopup} onOpenChange={setShowTopup}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Carregar Carteira</h2>
            <p className="text-white/70 text-sm">Escolha o valor e método</p>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Amount Selection */}
            <div>
              <Label className="text-gray-700 font-semibold text-sm mb-3 block">Valor</Label>
              <div className="grid grid-cols-3 gap-2">
                {TOPUP_OPTIONS.map(amount => (
                  <Button 
                    key={amount}
                    variant={topupAmount === amount ? "default" : "outline"}
                    onClick={() => setTopupAmount(amount)}
                    className={`h-12 rounded-xl font-bold ${
                      topupAmount === amount 
                        ? 'bg-[#0D9488] text-white shadow-lg' 
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {(amount / 1000).toFixed(0)}k
                  </Button>
                ))}
              </div>
              <div className="text-center mt-4 p-4 bg-[#0D9488]/10 rounded-2xl">
                <p className="text-sm text-gray-600">Valor a carregar</p>
                <p className="text-3xl font-black text-[#0D9488]">{formatKz(topupAmount)}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-gray-700 font-semibold text-sm mb-3 block">Método de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'transfer' 
                      ? 'border-[#0D9488] bg-[#0D9488]/5' 
                      : 'border-gray-200'
                  }`}
                >
                  <Building2 size={24} className={paymentMethod === 'transfer' ? 'text-[#0D9488]' : 'text-gray-400'} />
                  <p className="font-bold text-sm mt-2">Transferência</p>
                  <p className="text-xs text-gray-500">Bancária</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('mobile')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'mobile' 
                      ? 'border-[#0D9488] bg-[#0D9488]/5' 
                      : 'border-gray-200'
                  }`}
                >
                  <Smartphone size={24} className={paymentMethod === 'mobile' ? 'text-[#0D9488]' : 'text-gray-400'} />
                  <p className="font-bold text-sm mt-2">Mobile</p>
                  <p className="text-xs text-gray-500">Multicaixa Express</p>
                </button>
              </div>
            </div>

            {/* Bank Details */}
            {paymentMethod === 'transfer' && (
              <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl">
                <p className="text-sm font-semibold text-gray-900 mb-3">Dados para transferência:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">IBAN</p>
                      <p className="font-mono text-sm font-semibold">AO06 0055 0000 1234 5678 9012</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('AO06005500001234567890123')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Banco: BAI</span>
                    <span className="text-xs text-gray-600">Titular: TudoAqui Lda</span>
                  </div>
                </div>
              </Card>
            )}

            {paymentMethod === 'mobile' && (
              <Card className="p-4 bg-blue-50 border-blue-200 rounded-2xl">
                <p className="text-sm font-semibold text-gray-900 mb-2">Multicaixa Express:</p>
                <p className="text-sm text-gray-600">Envie para o número:</p>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg mt-2">
                  <p className="font-mono text-lg font-bold">923 456 789</p>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard('923456789')}>
                    <Copy size={16} />
                  </Button>
                </div>
              </Card>
            )}

            {/* Reference Input */}
            <div>
              <Label className="text-gray-700 font-semibold text-sm">Comprovativo / Referência</Label>
              <Input 
                placeholder="Nº do comprovativo ou referência"
                className="mt-2 h-12 rounded-xl bg-gray-50"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleTopup}
              disabled={processing || !paymentRef.trim()}
              className="w-full h-14 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-2xl shadow-lg"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A processar...
                </div>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Confirmar Carregamento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
