import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, CreditCard, Building2, Smartphone, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PAYMENT_METHODS = [
  { id: 'transferencia', name: 'Transferência Bancária', icon: Building2, desc: 'Banco BAI' },
  { id: 'multicaixa', name: 'Multicaixa Express', icon: CreditCard, desc: 'Pagamento Express' },
  { id: 'unitel_money', name: 'Unitel Money', icon: Smartphone, desc: 'Carteira digital' },
];

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items = [], restaurant, subtotal = 0, deliveryFee = 0 } = location.state || {};

  const [step, setStep] = useState('method'); // method, transfer, confirm, success
  const [selectedMethod, setSelectedMethod] = useState('transferencia');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');

  const total = subtotal + deliveryFee;
  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';

  const handleCreateOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Insira o endereço de entrega');
      return;
    }
    setLoading(true);
    try {
      // Create order
      const orderRes = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restaurant_id: restaurant?.restaurant_id,
          items: items.map(i => ({ item_id: i.item_id, name: i.name, price: i.price, quantity: i.quantity })),
          delivery_address: deliveryAddress,
          payment_method: selectedMethod,
          notes
        })
      });

      if (!orderRes.ok) throw new Error('Erro ao criar pedido');
      const order = await orderRes.json();

      // Create payment
      const payRes = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: total,
          payment_method: selectedMethod,
          reference_type: 'order',
          reference_id: order.order_id,
          description: `Pedido ${order.order_id} - ${restaurant?.name || 'Restaurante'}`
        })
      });

      if (!payRes.ok) throw new Error('Erro ao gerar pagamento');
      const payment = await payRes.json();

      setPaymentData(payment);
      setStep('transfer');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmCode.trim()) {
      toast.error('Insira o código de confirmação');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_id: paymentData.payment_id,
          confirmation_code: confirmCode
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Código inválido');
      }

      setStep('success');
      toast.success('Pagamento confirmado!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (!items.length && step === 'method') {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
        <Card className="p-8 text-center bg-white rounded-xl">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Carrinho vazio</p>
          <Button onClick={() => navigate('/restaurants')} className="mt-4 bg-[#D62828] text-white" data-testid="back-to-restaurants-btn">
            Ver Restaurantes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button onClick={() => step === 'method' ? navigate(-1) : setStep('method')} variant="ghost" className="text-white hover:bg-white/10" data-testid="checkout-back-btn">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="checkout-title">
              {step === 'method' && 'Checkout'}
              {step === 'transfer' && 'Dados para Transferência'}
              {step === 'confirm' && 'Confirmar Pagamento'}
              {step === 'success' && 'Pagamento Confirmado'}
            </h1>
            <p className="text-white/70 text-sm">{restaurant?.name || 'TudoAqui'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 mt-6 space-y-4">

        {/* STEP 1: Method + Order Details */}
        {step === 'method' && (
          <>
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Resumo do Pedido</h3>
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0" data-testid={`checkout-item-${idx}`}>
                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                  <span className="font-semibold">{formatKz(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatKz(subtotal)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-600">Entrega</span>
                <span className="font-semibold">{formatKz(deliveryFee)}</span>
              </div>
              <div className="flex justify-between pt-3 mt-2 border-t-2 border-[#D62828]/20">
                <span className="font-bold text-lg text-[#1A1A1A]">Total</span>
                <span className="font-bold text-lg text-[#D62828]" data-testid="checkout-total">{formatKz(total)}</span>
              </div>
            </Card>

            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Endereço de Entrega</h3>
              <Input data-testid="delivery-address-input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ex: Rua da Missão, 45, Ingombota, Luanda" className="h-11" />
              <div className="mt-3">
                <Label className="text-gray-600 text-sm">Observações (opcional)</Label>
                <Input data-testid="delivery-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instruções especiais..." className="h-11 mt-1" />
              </div>
            </Card>

            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Método de Pagamento</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    data-testid={`payment-method-${method.id}`}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === method.id
                        ? 'border-[#D62828] bg-[#D62828]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <method.icon size={24} className={selectedMethod === method.id ? 'text-[#D62828]' : 'text-gray-500'} />
                    <div className="text-left">
                      <p className="font-semibold text-[#1A1A1A]">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                    {selectedMethod === method.id && <CheckCircle size={20} className="ml-auto text-[#D62828]" />}
                  </button>
                ))}
              </div>
            </Card>

            <Button
              data-testid="place-order-btn"
              onClick={handleCreateOrder}
              disabled={loading || !deliveryAddress.trim()}
              className="w-full h-14 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold text-lg rounded-xl"
            >
              {loading ? 'A processar...' : `Fazer Pedido - ${formatKz(total)}`}
            </Button>
          </>
        )}

        {/* STEP 2: Transfer Details */}
        {step === 'transfer' && paymentData && (
          <>
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FCBF49]/20 rounded-full flex items-center justify-center">
                  <Clock size={20} className="text-[#FCBF49]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A]">Transferência Pendente</h3>
                  <p className="text-sm text-gray-600">Faça a transferência com os dados abaixo</p>
                </div>
              </div>

              <div className="bg-[#D62828]/5 border border-[#D62828]/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 font-medium">Valor a transferir</p>
                <p className="text-3xl font-bold text-[#D62828]" data-testid="transfer-amount">{formatKz(paymentData.amount)}</p>
              </div>

              <div className="space-y-3">
                {paymentData.bank_info.bank && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Banco</p>
                      <p className="font-semibold text-gray-900">{paymentData.bank_info.bank}</p>
                    </div>
                  </div>
                )}
                {paymentData.bank_info.account_name && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Titular</p>
                      <p className="font-semibold text-gray-900">{paymentData.bank_info.account_name}</p>
                    </div>
                  </div>
                )}
                {paymentData.bank_info.iban && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">IBAN</p>
                      <p className="font-semibold text-gray-900 text-sm">{paymentData.bank_info.iban}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentData.bank_info.iban)} data-testid="copy-iban-btn">
                      <Copy size={16} />
                    </Button>
                  </div>
                )}
                {paymentData.bank_info.phone && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="font-semibold text-gray-900">{paymentData.bank_info.phone}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentData.bank_info.phone)} data-testid="copy-phone-btn">
                      <Copy size={16} />
                    </Button>
                  </div>
                )}
                {paymentData.bank_info.nif && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="font-semibold text-gray-900">{paymentData.bank_info.nif}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 bg-[#FCBF49]/10 border-[#FCBF49]/30 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-2">Código de Confirmação</h3>
              <p className="text-sm text-gray-600 mb-3">Use este código após fazer a transferência para confirmar o pagamento</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border-2 border-[#FCBF49] rounded-lg p-3 text-center">
                  <p className="font-mono text-2xl font-bold tracking-widest text-[#1A1A1A]" data-testid="confirmation-code">
                    {paymentData.confirmation_code}
                  </p>
                </div>
                <Button variant="outline" onClick={() => copyToClipboard(paymentData.confirmation_code)} data-testid="copy-code-btn">
                  <Copy size={18} />
                </Button>
              </div>
            </Card>

            <Button
              data-testid="go-to-confirm-btn"
              onClick={() => setStep('confirm')}
              className="w-full h-14 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white font-bold text-lg rounded-xl"
            >
              Já fiz a transferência
            </Button>
          </>
        )}

        {/* STEP 3: Enter confirmation code */}
        {step === 'confirm' && paymentData && (
          <>
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-2">Confirmar Pagamento</h3>
              <p className="text-sm text-gray-600 mb-4">Insira o código de confirmação que recebeu</p>
              <Input
                data-testid="confirm-code-input"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="h-14 text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={8}
              />
            </Card>

            <Button
              data-testid="confirm-payment-btn"
              onClick={handleConfirmPayment}
              disabled={loading || confirmCode.length < 6}
              className="w-full h-14 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold text-lg rounded-xl"
            >
              {loading ? 'A confirmar...' : 'Confirmar Pagamento'}
            </Button>
          </>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <Card className="p-8 bg-white border-black/5 rounded-xl shadow-sm text-center" data-testid="payment-success">
            <div className="w-20 h-20 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-[#2A9D8F]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-600 mb-6">O seu pedido está a ser preparado</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/orders')} className="w-full h-12 bg-[#D62828] text-white font-bold" data-testid="view-orders-btn">
                Ver Meus Pedidos
              </Button>
              <Button onClick={() => navigate('/restaurants')} variant="outline" className="w-full h-12 font-semibold" data-testid="continue-shopping-btn">
                Continuar a Comprar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
