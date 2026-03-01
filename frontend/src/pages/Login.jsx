import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Mail, Lock, User as UserIcon, Phone, Chrome } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

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

      toast.success(isLogin ? 'Login efetuado com sucesso!' : 'Conta criada com sucesso!');
      navigate('/dashboard', { state: { user: data.user } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-br from-[#F7F5F0] via-[#F7F5F0] to-[#FCBF49]/20 px-6 py-12 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">TudoAqui</h1>
          <p className="text-gray-600">Bem-vindo de volta</p>
          <p className="text-xs text-gray-500 mt-1">by Sincesoft-Sinceridade Service</p>
        </div>

        <Card className="p-6 bg-white/95 backdrop-blur-sm border-black/5 rounded-2xl shadow-lg" data-testid="login-card">
          <Button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 mb-6 border-2 border-gray-200 hover:border-[#D62828] hover:bg-[#D62828]/5 font-semibold"
          >
            <Chrome className="mr-2" size={20} />
            Continuar com Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative mt-1">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="name"
                      data-testid="register-name-input"
                      type="text"
                      placeholder="Seu nome"
                      className="pl-10 h-12"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="phone"
                      data-testid="register-phone-input"
                      type="tel"
                      placeholder="+244..."
                      className="pl-10 h-12"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button
              data-testid="login-submit-btn"
              type="submit"
              className="w-full h-12 bg-[#D62828] hover:bg-[#D62828]/90 text-white font-bold rounded-lg btn-shadow"
              disabled={loading}
            >
              {loading ? 'A processar...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              data-testid="toggle-auth-mode-btn"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-600 hover:text-[#D62828] font-medium"
            >
              {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}