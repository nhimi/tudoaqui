import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TOPUP_OPTIONS = [1000, 2500, 5000, 10000, 25000, 50000];

const TRANSACTION_ICONS = {
  ride_payment: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-100' },
  delivery_payment: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-100' },
  credit_add: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-100' },
  driver_earning: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-100' },
  withdrawal: { icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-100' },
  coupon_discount: { icon: ArrowDownLeft, color: 'text-purple-500', bg: 'bg-purple-100' },
};

export default function TuendiWallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(5000);
  const [paymentRef, setPaymentRef] = useState('');
  const [processing, setProcessing] = useState(false);

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
      toast.success(`Carteira carregada com sucesso! Novo saldo: ${formatKz(data.balance)}`);
      setShowTopup(false);
      setPaymentRef('');
      loadWallet();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-100 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] px-4 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/tuendi')}>
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-white">Carteira Tuendi</h1>
          </div>

          {/* Balance Card */}
          <Card className="bg-white/15 backdrop-blur border-white/20 p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/70 text-sm">Saldo disponível</p>
                <p className="text-4xl font-bold text-white">{formatKz(wallet.balance)}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowTopup(true)}
              className="w-full mt-6 h-12 bg-white text-[#0D9488] hover:bg-white/90 font-bold rounded-xl"
            >
              <Plus size={20} className="mr-2" /> Carregar Carteira
            </Button>
          </Card>
        </div>

        <div className="px-4 -mt-4">
          {/* Quick Topup */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm mb-4">
            <h3 className="font-bold text-gray-900 mb-3">Carregamento Rápido</h3>
            <div className="grid grid-cols-3 gap-2">
              {TOPUP_OPTIONS.map(amount => (
                <Button 
                  key={amount}
                  variant="outline"
                  onClick={() => { setTopupAmount(amount); setShowTopup(true); }}
                  className="h-12 rounded-xl border-[#0D9488]/30 text-[#0D9488] hover:bg-[#0D9488]/5"
                >
                  {formatKz(amount).replace(' Kz', '')}
                </Button>
              ))}
            </div>
          </Card>

          {/* Transactions */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Histórico de Transações</h3>
            
            {wallet.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-3">
                {wallet.transactions.map((txn, idx) => {
                  const config = TRANSACTION_ICONS[txn.type] || TRANSACTION_ICONS.credit_add;
                  const Icon = config.icon;
                  const isCredit = txn.type.includes('credit') || txn.type.includes('earning') || txn.type.includes('discount');
                  
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{txn.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(txn.created_at)}</p>
                      </div>
                      <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatKz(txn.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nenhuma transação ainda</p>
                <p className="text-sm text-gray-400">Carregue sua carteira para começar</p>
              </div>
            )}
          </Card>

          {/* Payment Methods Info */}
          <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl mt-4">
            <div className="flex items-start gap-3">
              <CreditCard size={24} className="text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Como carregar?</h4>
                <p className="text-sm text-gray-600">Faça uma transferência bancária para:</p>
                <p className="text-sm font-mono text-gray-800 mt-2">IBAN: AO06 0055 0000 0123 4567 8901 2</p>
                <p className="text-sm text-gray-600 mt-1">Banco: BAI • Titular: TudoAqui Lda</p>
                <p className="text-xs text-gray-500 mt-2">Após transferir, insira o comprovativo no carregamento</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Topup Dialog */}
      <Dialog open={showTopup} onOpenChange={setShowTopup}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Carregar Carteira</DialogTitle>
            <DialogDescription>Selecione o valor e insira o comprovativo</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-gray-700 font-medium">Valor</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {TOPUP_OPTIONS.map(amount => (
                  <Button 
                    key={amount}
                    variant={topupAmount === amount ? "default" : "outline"}
                    onClick={() => setTopupAmount(amount)}
                    className={`h-10 rounded-lg ${topupAmount === amount ? 'bg-[#0D9488] text-white' : ''}`}
                  >
                    {(amount / 1000)}k
                  </Button>
                ))}
              </div>
              <p className="text-center text-2xl font-bold text-[#0D9488] mt-3">{formatKz(topupAmount)}</p>
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Comprovativo / Referência</Label>
              <Input 
                placeholder="Nº do comprovativo ou referência"
                className="mt-2 h-12 rounded-xl"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-800">Após a transferência, o saldo será adicionado automaticamente em até 24h úteis.</p>
            </div>

            <Button 
              onClick={handleTopup}
              disabled={processing || !paymentRef.trim()}
              className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
            >
              {processing ? 'A processar...' : 'Confirmar Carregamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
