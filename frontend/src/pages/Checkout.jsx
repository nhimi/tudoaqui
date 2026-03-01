import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ArrowLeft, MapPin, CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [], restaurantId } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    notes: '',
    paymentMethod: 'multicaixa'
  });

  if (!cart || cart.length === 0) {
    navigate('/restaurants');
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 350;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address) {
      toast.error('Preencha o endereço de entrega');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restaurant_id: restaurantId,
          items: cart.map(item => ({
            item_id: item.item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          delivery_address: formData.address,
          payment_method: formData.paymentMethod,
          notes: formData.notes
        })
      });

      if (!response.ok) throw new Error('Erro ao criar pedido');

      toast.success('Pedido realizado com sucesso!');
      navigate('/orders');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'multicaixa', name: 'Multicaixa Express', icon: CreditCard },
    { id: 'unitel', name: 'Unitel Money', icon: WalletIcon },
    { id: 'bai', name: 'BAI Paga', icon: CreditCard }
  ];

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-8">
        <div className="bg-[#D62828] px-6 pt-12 pb-6 flex items-center gap-4">
          <Button
            data-testid="back-to-menu-btn"
            onClick={() => navigate(-1)}
            variant="ghost"
            className="p-2 hover:bg-white/10 text-white"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold text-white" data-testid="checkout-page-title">Finalizar Pedido</h1>
        </div>

        <div className="px-6 mt-6 space-y-4">
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Resumo do Pedido</h2>
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {(item.price * item.quantity).toFixed(2)} Kz
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} Kz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="font-semibold">{deliveryFee.toFixed(2)} Kz</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#D62828]">{total.toFixed(2)} Kz</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="address" className="text-[#1A1A1A] font-semibold mb-2 block">
                  Endereço de Entrega
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <Input
                    id="address"
                    data-testid="checkout-address-input"
                    placeholder="Rua, número, bairro..."
                    className="pl-11 h-12"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-[#1A1A1A] font-semibold mb-2 block">
                  Observações (opcional)
                </Label>
                <Textarea
                  id="notes"
                  data-testid="checkout-notes-input"
                  placeholder="Instruções especiais para entrega..."
                  className="min-h-20"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#1A1A1A] font-semibold mb-3 block">
                  Método de Pagamento
                </Label>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      data-testid={`payment-method-${method.id}`}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:border-[#D62828] cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <method.icon size={20} className="text-gray-600" />
                        <span className="font-medium">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                data-testid="place-order-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-lg btn-shadow"
              >
                {loading ? 'A processar...' : `Confirmar Pedido - ${total.toFixed(2)} Kz`}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}