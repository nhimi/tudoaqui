import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/login', { replace: true });
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange session');
        }

        const data = await response.json();
        navigate('/dashboard', { replace: true, state: { user: data.user } });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">A processar autenticação...</p>
      </div>
    </div>
  );
};