import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Phone, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    message: '',
    phone: ''
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/properties/${propertyId}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar imóvel');

      const data = await response.json();
      setProperty(data);
    } catch (error) {
      toast.error(error.message);
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    
    if (!inquiryData.message || !inquiryData.phone) {
      toast.error('Preencha todos os campos');
      return;
    }

    setInquiryLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/property-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          property_id: propertyId,
          message: inquiryData.message,
          phone: inquiryData.phone
        })
      });

      if (!response.ok) throw new Error('Erro ao enviar consulta');

      toast.success('Consulta enviada! O proprietário entrará em contato.');
      navigate('/inquiries');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setInquiryLoading(false);
    }
  };

  const formatPrice = (price, transactionType) => {
    const formatted = price.toLocaleString('pt-AO');
    return transactionType === 'aluguel' ? `${formatted} Kz/mês` : `${formatted} Kz`;
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">A carregar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-8">
        <div className="relative">
          <div 
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url('${property.images[0]}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
            <Button
              data-testid="back-to-properties-btn"
              onClick={() => navigate('/properties')}
              variant="ghost"
              className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full"
            >
              <ArrowLeft size={24} className="text-[#1A1A1A]" />
            </Button>
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="bg-[#9333EA] text-white text-xs px-3 py-1 rounded-full font-semibold">
                {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
              </span>
              <span className={`text-white text-xs px-3 py-1 rounded-full font-semibold ${
                property.transaction_type === 'venda' ? 'bg-[#D62828]' : 'bg-[#2A9D8F]'
              }`}>
                {property.transaction_type === 'venda' ? 'Venda' : 'Aluguel'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-8 space-y-4">
          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-lg" data-testid="property-info-card">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <MapPin size={16} className="text-[#D62828]" />
              <span>{property.location}</span>
            </div>
            
            <div className="flex items-center gap-6 mb-4">
              {property.bedrooms && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Bed size={20} className="text-[#9333EA]" />
                  <span className="text-sm font-medium">{property.bedrooms} Quartos</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath size={20} className="text-[#9333EA]" />
                  <span className="text-sm font-medium">{property.bathrooms} Casas de Banho</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700">
                <Maximize size={20} className="text-[#9333EA]" />
                <span className="text-sm font-medium">{property.area}m²</span>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-4">{property.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <span className="text-sm text-gray-500">Preço</span>
                <div className="text-3xl font-bold text-[#D62828]">
                  {formatPrice(property.price, property.transaction_type)}
                </div>
              </div>
            </div>
          </Card>

          {property.images.length > 1 && (
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Fotos</h2>
              <div className="grid grid-cols-2 gap-3">
                {property.images.map((image, idx) => (
                  <div
                    key={idx}
                    className="h-32 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
            <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Características</h2>
            <div className="grid grid-cols-2 gap-3">
              {property.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-[#2A9D8F]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-[#9333EA]/10 to-[#9333EA]/5 border-[#9333EA]/20 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Phone size={20} className="text-[#9333EA]" />
              <div>
                <p className="text-sm text-gray-600">Proprietário</p>
                <p className="font-bold text-[#1A1A1A]">{property.owner_name}</p>
              </div>
            </div>
            <a 
              href={`tel:${property.owner_phone}`}
              className="text-[#9333EA] font-semibold hover:underline"
            >
              {property.owner_phone}
            </a>
          </Card>

          {!showInquiry ? (
            <Button
              data-testid="show-inquiry-btn"
              onClick={() => setShowInquiry(true)}
              className="w-full h-14 bg-[#9333EA] hover:bg-[#9333EA]/90 text-white font-bold rounded-xl text-lg btn-shadow"
            >
              <MessageSquare className="mr-2" size={20} />
              Tenho Interesse
            </Button>
          ) : (
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4">Enviar Consulta</h2>
              <form onSubmit={handleInquiry} className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-[#1A1A1A] font-semibold mb-2 block">
                    Seu Telefone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      id="phone"
                      data-testid="inquiry-phone-input"
                      type="tel"
                      placeholder="+244..."
                      className="pl-10 h-11"
                      value={inquiryData.phone}
                      onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-[#1A1A1A] font-semibold mb-2 block">
                    Mensagem
                  </Label>
                  <Textarea
                    id="message"
                    data-testid="inquiry-message-input"
                    placeholder="Tenho interesse neste imóvel. Gostaria de mais informações..."
                    className="min-h-24"
                    value={inquiryData.message}
                    onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    data-testid="cancel-inquiry-btn"
                    type="button"
                    onClick={() => setShowInquiry(false)}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    data-testid="send-inquiry-btn"
                    type="submit"
                    disabled={inquiryLoading}
                    className="flex-1 h-12 bg-[#9333EA] hover:bg-[#9333EA]/90 text-white font-bold rounded-lg btn-shadow"
                  >
                    {inquiryLoading ? 'A enviar...' : 'Enviar Consulta'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}