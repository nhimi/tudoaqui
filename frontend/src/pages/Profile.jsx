import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User as UserIcon, Mail, Phone, LogOut, Settings, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      toast.success('Sessão terminada');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao terminar sessão');
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Configurações', action: () => toast.info('Em breve'), testId: 'settings-btn' },
    { icon: HelpCircle, label: 'Ajuda & Suporte', action: () => toast.info('Em breve'), testId: 'help-btn' },
  ];

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-20 rounded-b-[2rem]">
          <h1 className="text-3xl font-bold text-white mb-8" data-testid="profile-page-title">Perfil</h1>
          
          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 border-4 border-white/20 mb-4" data-testid="user-avatar">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-[#D62828] text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mb-1" data-testid="user-name">{user?.name || 'Utilizador'}</h2>
            <p className="text-white/70 text-sm" data-testid="user-email">{user?.email}</p>
          </div>
        </div>

        <div className="px-6 -mt-12 space-y-4">
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-4">Informações Pessoais</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserIcon size={20} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={20} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{user?.email || 'N/A'}</p>
                </div>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={20} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-semibold text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-4">Menu</h3>
            <div className="space-y-2">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  data-testid={item.testId}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <item.icon size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Button
            data-testid="logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 border-2 border-[#D62828] text-[#D62828] hover:bg-[#D62828] hover:text-white font-bold rounded-lg"
          >
            <LogOut className="mr-2" size={20} />
            Terminar Sessão
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}