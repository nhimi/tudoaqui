import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Ticket, Clock, Tag, Percent, Truck, ArrowLeft, Copy, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_CONFIG = {
  percent: { icon: Percent, label: 'Desconto %', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  fixed: { icon: Tag, label: 'Valor Fixo', color: 'text-blue-600', bg: 'bg-blue-50' },
  free_delivery: { icon: Truck, label: 'Entrega Grátis', color: 'text-purple-600', bg: 'bg-purple-50' }
};

export default function CouponsPage() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [showValidated, setShowValidated] = useState(false);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons/available`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const validateCode = async () => {
    if (!promoCode.trim()) return;
    setValidating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons/validate/${promoCode.trim()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setValidatedCoupon(data);
        setShowValidated(true);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Cupom inválido');
      }
    } catch (e) { toast.error('Erro ao validar'); }
    finally { setValidating(false); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado!`);
  };

  const formatValue = (coupon) => {
    if (coupon.type === 'percent') return `${coupon.value}% OFF`;
    if (coupon.type === 'fixed') return `${coupon.value.toLocaleString()} Kz OFF`;
    return 'Entrega Grátis';
  };

  const formatApplicable = (a) => {
    const map = { all: 'Todos os serviços', tuendi: 'Tuendi', restaurants: 'Restaurantes', tourism: 'Turismo' };
    return map[a] || a;
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#D62828] to-[#D62828]/80 px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center" data-testid="back-btn">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Cupons & Promoções</h1>
          </div>

          <div className="flex gap-2 mt-4">
            <Input
              data-testid="promo-code-input"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Insira o código promocional"
              className="bg-white/15 border-white/20 text-white placeholder:text-white/60 h-12 rounded-xl"
            />
            <Button
              data-testid="validate-code-btn"
              onClick={validateCode}
              disabled={validating || !promoCode.trim()}
              className="bg-white text-[#D62828] hover:bg-white/90 h-12 px-6 rounded-xl font-bold"
            >
              {validating ? '...' : 'Validar'}
            </Button>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando cupons...</div>
          ) : coupons.length === 0 ? (
            <Card className="p-8 text-center bg-white rounded-2xl">
              <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Nenhum cupom disponível</p>
              <p className="text-sm text-gray-400 mt-1">Novos cupons aparecerão aqui</p>
            </Card>
          ) : (
            coupons.map((c, i) => {
              const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.percent;
              const Icon = cfg.icon;
              return (
                <Card key={i} data-testid={`coupon-card-${i}`} className="bg-white rounded-2xl overflow-hidden border-0 shadow-sm">
                  <div className="flex">
                    <div className={`${cfg.bg} p-6 flex flex-col items-center justify-center min-w-[120px]`}>
                      <Icon size={28} className={cfg.color} />
                      <span className={`text-xl font-black mt-2 ${cfg.color}`}>{formatValue(c)}</span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-[#1A1A1A]">{c.code}</h3>
                          <p className="text-sm text-gray-500 mt-1">{c.description || formatApplicable(c.applicable_to)}</p>
                        </div>
                        <button onClick={() => copyCode(c.code)} className="p-2 hover:bg-gray-100 rounded-lg" data-testid={`copy-coupon-${i}`}>
                          <Copy size={16} className="text-gray-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        {c.min_order_kz > 0 && <span>Min: {c.min_order_kz.toLocaleString()} Kz</span>}
                        {c.tier_required && (
                          <span className="flex items-center gap-1"><Lock size={10} />{c.tier_required}+</span>
                        )}
                        <span className="flex items-center gap-1"><Clock size={10} />Até {c.valid_until?.slice(0,10)}</span>
                      </div>
                      {!c.can_use && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                          <CheckCircle size={12} /> Já utilizado
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={showValidated} onOpenChange={setShowValidated}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-500" /> Cupom Válido!
            </DialogTitle>
          </DialogHeader>
          {validatedCoupon && (
            <div className="space-y-3">
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <span className="text-3xl font-black text-emerald-600">
                  {validatedCoupon.type === 'percent' ? `${validatedCoupon.value}% OFF` :
                   validatedCoupon.type === 'fixed' ? `${validatedCoupon.value} Kz OFF` : 'Entrega Grátis'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{validatedCoupon.description}</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Aplicável: {formatApplicable(validatedCoupon.applicable_to)}</p>
                {validatedCoupon.min_order_kz > 0 && <p>Pedido mínimo: {validatedCoupon.min_order_kz} Kz</p>}
                {validatedCoupon.tier_required && <p>Requer tier: {validatedCoupon.tier_required}+</p>}
              </div>
              <Button onClick={() => { copyCode(validatedCoupon.code); setShowValidated(false); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="use-coupon-btn">
                Copiar e Usar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
