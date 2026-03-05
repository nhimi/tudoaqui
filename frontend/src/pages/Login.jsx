import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Mail, Lock, User as UserIcon, Phone, Chrome, Eye, EyeOff, ArrowRight, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          navigate('/dashboard');
        }
      } catch (e) {
        // Not logged in
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao autenticar');
      }

      toast.success(isLogin ? 'Bem-vindo de volta!' : 'Conta criada! +100 pontos de boas-vindas 🎉');
      
      // Redirect to intended page or dashboard
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { state: { user: data.user } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Digite seu email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (res.ok) {
        toast.success('Instruções enviadas para seu email!');
        setShowForgotPassword(false);
        setForgotEmail('');
      }
    } catch (e) {
      toast.error('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Sparkles, text: 'Ganhe pontos em cada compra' },
    { icon: Shield, text: 'Pagamentos seguros' },
    { icon: CheckCircle, text: 'Suporte 24 horas' },
  ];

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-br from-[#0D9488] via-[#0F766E] to-[#115E59] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 px-6 py-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">TudoAqui</h1>
            <p className="text-white/70 text-sm">Marketplace de Angola</p>
            <p className="text-white/50 text-xs mt-1">by Sincesoft</p>
          </div>

          {/* Benefits (only on register) */}
          {!isLogin && (
            <div className="mb-6">
              <div className="flex justify-center gap-4">
                {benefits.map((b, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1">
                      <b.icon size={18} className="text-white" />
                    </div>
                    <p className="text-white/70 text-[10px] text-center max-w-[60px]">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Card */}
          <Card className="flex-1 p-6 bg-white rounded-t-[32px] shadow-2xl" data-testid="login-card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {isLogin ? 'Bem-vindo de volta!' : 'Junte-se a milhares de angolanos'}
              </p>
            </div>

            {/* Google Login */}
            <Button
              data-testid="google-login-btn"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 mb-4 border-2 border-gray-200 hover:border-[#0D9488] hover:bg-[#0D9488]/5 font-semibold rounded-xl"
            >
              <Chrome className="mr-2" size={20} />
              Continuar com Google
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">ou</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">Nome Completo</Label>
                    <div className="relative mt-1.5">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="name"
                        data-testid="register-name-input"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">Telefone</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="phone"
                        data-testid="register-phone-input"
                        type="tel"
                        placeholder="+244 9XX XXX XXX"
                        className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-[#0D9488] hover:underline"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 rounded-xl bg-gray-50 border-gray-200"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                data-testid="login-submit-btn"
                type="submit"
                className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl shadow-lg shadow-[#0D9488]/30 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    A processar...
                  </div>
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                data-testid="toggle-auth-mode-btn"
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-600 hover:text-[#0D9488] font-medium text-sm"
              >
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <span className="text-[#0D9488] font-semibold">{isLogin ? 'Criar agora' : 'Entrar'}</span>
              </button>
            </div>

            {!isLogin && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Ao criar conta, você concorda com nossos Termos de Uso e Política de Privacidade.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Recuperar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-gray-500 text-sm">Digite seu email e enviaremos instruções para redefinir sua senha.</p>
            <div>
              <Label className="text-gray-700 font-medium">Email</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                className="mt-1.5 h-12 rounded-xl bg-gray-50"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
            >
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
