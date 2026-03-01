import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Bed, Bath, Maximize, Home as HomeIcon } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState('all');

  const propertyTypes = [
    { id: 'all', label: 'Todos', icon: '🏘️' },
    { id: 'apartamento', label: 'Apartamentos', icon: '🏢' },
    { id: 'casa', label: 'Casas', icon: '🏡' },
    { id: 'terreno', label: 'Terrenos', icon: '📐' },
    { id: 'comercial', label: 'Comercial', icon: '🏬' }
  ];

  const transactionTypes = [
    { id: 'all', label: 'Tudo' },
    { id: 'venda', label: 'Venda' },
    { id: 'aluguel', label: 'Aluguel' }
  ];

  useEffect(() => {
    fetchProperties();
  }, [selectedType, selectedTransaction]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/properties?`;
      if (selectedType !== 'all') url += `type=${selectedType}&`;
      if (selectedTransaction !== 'all') url += `transaction=${selectedTransaction}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao carregar imóveis');

      const data = await response.json();
      setProperties(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, transactionType) => {
    const formatted = price.toLocaleString('pt-AO');
    return transactionType === 'aluguel' ? `${formatted} Kz/mês` : `${formatted} Kz`;
  };

  const getTypeLabel = (type) => {
    const map = {
      apartamento: 'Apartamento',
      casa: 'Casa',
      terreno: 'Terreno',
      comercial: 'Comercial'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600" data-testid="loading-properties">A carregar imóveis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-[#F7F5F0] pb-20">
        <div 
          className="bg-gradient-to-br from-[#9333EA] to-[#9333EA]/80 px-6 pt-12 pb-8"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'multiply'
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="properties-page-title">
            Mixeiro - Imóveis
          </h1>
          <p className="text-white/90 text-sm">Encontre a casa dos seus sonhos</p>
        </div>

        <div className="px-6 -mt-4">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {propertyTypes.map((type) => (
              <Button
                key={type.id}
                data-testid={`type-${type.id}-btn`}
                onClick={() => setSelectedType(type.id)}
                variant={selectedType === type.id ? 'default' : 'outline'}
                className={`flex-shrink-0 h-10 px-4 rounded-full font-semibold ${
                  selectedType === type.id
                    ? 'bg-[#9333EA] text-white hover:bg-[#9333EA]/90'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#9333EA]'
                }`}
              >
                {type.icon} {type.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {transactionTypes.map((trans) => (
              <Button
                key={trans.id}
                data-testid={`transaction-${trans.id}-btn`}
                onClick={() => setSelectedTransaction(trans.id)}
                size="sm"
                variant={selectedTransaction === trans.id ? 'default' : 'outline'}
                className={`flex-1 h-9 rounded-full font-semibold ${
                  selectedTransaction === trans.id
                    ? 'bg-[#FCBF49] text-[#1A1A1A] hover:bg-[#FCBF49]/90'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {trans.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-6 space-y-4">
          {properties.length === 0 ? (
            <Card className="p-8 text-center bg-white border-black/5 rounded-xl shadow-sm" data-testid="no-properties-message">
              <HomeIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Nenhum imóvel encontrado</p>
            </Card>
          ) : (
            properties.map((property, idx) => (
              <Card
                key={property.property_id}
                data-testid={`property-card-${idx}`}
                onClick={() => navigate(`/properties/${property.property_id}`)}
                className="overflow-hidden hover-lift cursor-pointer bg-white border-black/5 rounded-xl shadow-sm"
              >
                <div 
                  className="h-44 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${property.images[0]}')` }}
                >
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#9333EA] text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {getTypeLabel(property.type)}
                    </span>
                    <span className={`text-white text-xs px-3 py-1 rounded-full font-semibold ${
                      property.transaction_type === 'venda' ? 'bg-[#D62828]' : 'bg-[#2A9D8F]'
                    }`}>
                      {property.transaction_type === 'venda' ? 'Venda' : 'Aluguel'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">{property.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={14} className="text-[#D62828]" />
                    <span>{property.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-700">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed size={16} className="text-[#9333EA]" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath size={16} className="text-[#9333EA]" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Maximize size={16} className="text-[#9333EA]" />
                      <span>{property.area}m²</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-2xl font-bold text-[#D62828]">
                      {formatPrice(property.price, property.transaction_type)}
                    </div>
                    <Button
                      data-testid={`view-property-btn-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/properties/${property.property_id}`);
                      }}
                      className="bg-[#9333EA] hover:bg-[#9333EA]/90 text-white h-9 px-4 rounded-lg"
                    >
                      Ver Mais
                    </Button>
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