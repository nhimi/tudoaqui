import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { MessageSquare, Clock, CheckCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/property-inquiries`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar consultas');

      const data = await response.json();
      setInquiries(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600" data-testid="loading-inquiries">A carregar consultas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div className="bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 px-6 pt-12 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="inquiries-page-title">
            Minhas Consultas
          </h1>
          <p className="text-white/90 text-sm">Histórico de interesses em imóveis</p>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {inquiries.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-inquiries-message">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Nenhuma consulta ainda</p>
              <p className="text-gray-500 text-sm mt-2">Suas consultas aparecerão aqui</p>
            </Card>
          ) : (
            inquiries.map((inquiry, idx) => (
              <Card
                key={inquiry.inquiry_id}
                data-testid={`inquiry-card-${idx}`}
                className="p-5 bg-white border-black/5 rounded-xl shadow-sm hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1A1A1A] text-lg mb-1">
                      {inquiry.property_title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2A9D8F]/10 text-[#2A9D8F] px-3 py-1 rounded-full">
                    <CheckCircle size={16} />
                    <span className="text-sm font-semibold capitalize">{inquiry.status}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Mensagem:</span></p>
                  <p className="text-sm text-gray-600">{inquiry.message}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <Phone size={16} className="text-[#9333EA]" />
                  <span className="font-semibold">Seu telefone:</span>
                  <span>{inquiry.phone}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(inquiry.created_at).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-lg font-bold text-[#D62828]">
                      {inquiry.property_price.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
