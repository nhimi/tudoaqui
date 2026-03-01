import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { CheckCircle, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AppConnectionManager = ({ apps, onConnectionChange }) => {
  const [connecting, setConnecting] = useState(null);
  const [credentials, setCredentials] = useState({});

  const handleConnect = async (app) => {
    setConnecting(app.app_name);
    
    try {
      // Simular processo de autenticação
      // Em produção, abriria OAuth ou pediria credenciais
      const response = await fetch(`${BACKEND_URL}/api/taxi/connect-app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app_name: app.app_name,
          credentials: credentials[app.app_name] || { authorized: true }
        })
      });

      if (!response.ok) throw new Error('Erro ao conectar app');

      toast.success(`${app.app_name} conectado com sucesso!`);
      onConnectionChange();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (app) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/taxi/disconnect-app/${app.app_name}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao desconectar');

      toast.success(`${app.app_name} desconectado`);
      onConnectionChange();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-3" data-testid="app-connection-manager">
      {apps.map((app) => (
        <Card
          key={app.app_name}
          className={`p-4 border-2 transition-colors ${
            app.connected
              ? 'border-[#2A9D8F] bg-[#2A9D8F]/5'
              : app.installed
              ? 'border-gray-200 hover:border-[#D62828]'
              : 'border-gray-100 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{app.icon}</span>
              <div>
                <h4 className="font-bold text-gray-900">{app.app_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {app.installed ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Instalado
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Não instalado
                    </span>
                  )}
                  {app.connected && (
                    <span className="text-xs bg-[#2A9D8F] text-white px-2 py-0.5 rounded-full font-semibold">
                      Conectado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {app.installed && (
              <div>
                {app.connected ? (
                  <Button
                    onClick={() => handleDisconnect(app)}
                    variant="outline"
                    size="sm"
                    className="border-[#D62828] text-[#D62828] hover:bg-[#D62828] hover:text-white"
                  >
                    <Unlink size={14} className="mr-1" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(app)}
                    disabled={connecting === app.app_name}
                    size="sm"
                    className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
                  >
                    {connecting === app.app_name ? (
                      'Conectando...'
                    ) : (
                      <>
                        <LinkIcon size={14} className="mr-1" />
                        Conectar
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {!app.installed && (
            <p className="text-xs text-gray-500 mt-2">
              Instale o app {app.app_name} para ativar comparação de preços
            </p>
          )}
        </Card>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-blue-800">
          <strong>Nota:</strong> Ao conectar apps, você autoriza o TudoAqui a comparar preços em tempo real usando suas credenciais.
        </p>
      </div>
    </div>
  );
};