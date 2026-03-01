import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Share2, Gift, Users, Copy, Tag, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ReferralPage() {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [applyCode, setApplyCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [codeRes, refsRes, couponsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/referral/my-code`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/referral/my-referrals`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/referral/my-coupons`, { credentials: 'include' })
      ]);
      if (codeRes.ok) setReferralData(await codeRes.json());
      if (refsRes.ok) { const d = await refsRes.json(); setReferrals(d.referrals || []); }
      if (couponsRes.ok) { const d = await couponsRes.json(); setCoupons(d.coupons || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralData?.referral_code || '');
    toast.success('Copiado!');
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({ title: 'TudoAqui', text: referralData?.share_message });
    } else {
      navigator.clipboard.writeText(referralData?.share_message || '');
      toast.success('Mensagem copiada!');
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/referral/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ code: applyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro');
      toast.success(data.message);
      setApplyCode('');
      loadData();
    } catch (err) { toast.error(err.message); } finally { setApplying(false); }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) return <div className="mobile-container"><div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#FCBF49] border-t-transparent rounded-full animate-spin" /></div></div>;

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="referral-back-btn"><ArrowLeft size={20} /></Button>
            <h1 className="text-2xl font-bold text-white" data-testid="referral-title">Convidar Amigos</h1>
          </div>
          <div className="text-center">
            <Gift size={48} className="mx-auto text-white/80 mb-3" />
            <p className="text-white/90 text-sm mb-1">O seu código de convite</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-white tracking-widest" data-testid="my-referral-code">{referralData?.referral_code || '...'}</span>
              <Button variant="ghost" onClick={copyCode} className="text-white hover:bg-white/10 h-10 w-10 p-0" data-testid="copy-referral-code"><Copy size={20} /></Button>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center bg-white rounded-xl shadow-sm" data-testid="referral-stat-total">
              <Users size={20} className="mx-auto text-[#9333EA] mb-1" />
              <p className="text-xl font-bold">{referralData?.stats?.total_referrals || 0}</p>
              <p className="text-xs text-gray-500">Convidados</p>
            </Card>
            <Card className="p-3 text-center bg-white rounded-xl shadow-sm" data-testid="referral-stat-success">
              <CheckCircle size={20} className="mx-auto text-green-600 mb-1" />
              <p className="text-xl font-bold">{referralData?.stats?.successful || 0}</p>
              <p className="text-xs text-gray-500">Aceites</p>
            </Card>
            <Card className="p-3 text-center bg-white rounded-xl shadow-sm" data-testid="referral-stat-earned">
              <Tag size={20} className="mx-auto text-[#FCBF49] mb-1" />
              <p className="text-xl font-bold">{formatKz(referralData?.stats?.total_earned)}</p>
              <p className="text-xs text-gray-500">Ganho</p>
            </Card>
          </div>

          <Button onClick={shareCode} className="w-full h-12 bg-[#9333EA] text-white font-bold rounded-xl" data-testid="share-referral-btn">
            <Share2 size={18} className="mr-2" /> Partilhar com Amigos
          </Button>

          {/* Rewards Info */}
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-3">Recompensas</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#9333EA]/5 rounded-lg">
                <Gift size={20} className="text-[#9333EA] mt-0.5" />
                <div><p className="font-semibold text-sm">Quem convida</p><p className="text-xs text-gray-600">{referralData?.rewards?.referrer?.description}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#2A9D8F]/5 rounded-lg">
                <Tag size={20} className="text-[#2A9D8F] mt-0.5" />
                <div><p className="font-semibold text-sm">Convidado</p><p className="text-xs text-gray-600">{referralData?.rewards?.referred?.description}</p></div>
              </div>
            </div>
          </Card>

          {/* Apply Code */}
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-3">Tem um código de convite?</h3>
            <div className="flex gap-2">
              <Input data-testid="apply-code-input" value={applyCode} onChange={e => setApplyCode(e.target.value.toUpperCase())} placeholder="TUDOXXXXXX" className="h-11 flex-1 font-mono uppercase" />
              <Button onClick={handleApplyCode} disabled={applying} className="bg-[#2A9D8F] text-white h-11 px-6" data-testid="apply-code-btn">{applying ? '...' : 'Aplicar'}</Button>
            </div>
          </Card>

          {/* Coupons */}
          {coupons.length > 0 && (
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Meus Cupões ({coupons.length})</h3>
              <div className="space-y-2">
                {coupons.map((c, idx) => (
                  <div key={c.coupon_id} className={`p-3 rounded-lg border-2 ${c.used ? 'border-gray-200 opacity-50' : 'border-[#FCBF49]'}`} data-testid={`coupon-${idx}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#D62828]">{c.type === 'percentage' ? `${c.amount}%` : formatKz(c.amount)}</span>
                      {c.used ? <span className="text-xs text-gray-400">Usado</span> : <span className="text-xs text-green-600 font-semibold">Ativo</span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
