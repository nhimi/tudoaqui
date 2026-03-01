import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Car, UtensilsCrossed, Wallet, User } from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Início', testId: 'nav-home' },
    { path: '/taxi', icon: Car, label: 'Taxi', testId: 'nav-taxi' },
    { path: '/restaurants', icon: UtensilsCrossed, label: 'Comida', testId: 'nav-food' },
    { path: '/orders', icon: Wallet, label: 'Pedidos', testId: 'nav-orders' },
    { path: '/profile', icon: User, label: 'Perfil', testId: 'nav-profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50" style={{ maxWidth: '28rem', margin: '0 auto' }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label, testId }) => (
          <Link
            key={path}
            to={path}
            data-testid={testId}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive(path)
                ? 'text-[#D62828]'
                : 'text-gray-600 hover:text-[#D62828]'
            }`}
          >
            <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};