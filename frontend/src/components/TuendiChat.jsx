import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Send, X, MessageCircle, User, Car } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function TuendiChat({ rideId, deliveryId, driverName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const chatId = rideId || deliveryId;

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/chat/${chatId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ride_id: rideId,
          delivery_id: deliveryId,
          message: newMessage,
          is_driver: false
        })
      });
      if (res.ok) {
        setNewMessage('');
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
  };

  // Quick messages
  const quickMessages = [
    'Estou a caminho',
    'Cheguei!',
    'Pode descer',
    'Estou na entrada',
    'Ok, obrigado!'
  ];

  return (
    <Card className="flex flex-col h-[500px] bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0D9488] to-[#0F766E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white">{driverName || 'Motorista'}</p>
            <p className="text-xs text-white/70">Chat em tempo real</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-xl">
          <X size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma mensagem ainda</p>
            <p className="text-gray-400 text-xs">Envie uma mensagem para o motorista</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.is_driver ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] ${msg.is_driver ? 'order-2' : ''}`}>
                {msg.is_driver && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <Car size={12} className="text-gray-600" />
                    </div>
                    <span className="text-xs text-gray-500">{driverName}</span>
                  </div>
                )}
                <div className={`p-3 rounded-2xl ${
                  msg.is_driver 
                    ? 'bg-white text-gray-900 rounded-tl-sm shadow-sm' 
                    : 'bg-[#0D9488] text-white rounded-tr-sm'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-[10px] mt-1 ${msg.is_driver ? 'text-left' : 'text-right'} text-gray-400`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 border-t border-gray-100 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickMessages.map((qm, idx) => (
            <button
              key={idx}
              onClick={() => setNewMessage(qm)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 font-medium transition-colors"
            >
              {qm}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 h-12 rounded-xl bg-gray-50 border-gray-200"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="h-12 w-12 rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 p-0"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
