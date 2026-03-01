import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Store, UtensilsCrossed, MapPin, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'restaurant'
  });

  const businessTypes = [
    { id: 'taxi', label: 'Taxi / Transporte', icon: Store, color: '#D62828' },
    { id: 'restaurant', label: 'Restaurante', icon: UtensilsCrossed, color: '#FCBF49' },
    { id: 'tourism', label: 'Turismo', icon: MapPin, color: '#2A9D8F' },
    { id: 'real_estate', label: 'Imóveis', icon: Building2, color: '#9333EA' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.business_name) {
      toast.error('Preencha o nome do negócio');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/partners/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao registrar');
      }

      const data = await response.json();
      toast.success('Cadastro enviado para aprovação!');
      
      // Redirecionar para dashboard após 2 segundos
      setTimeout(() => {
        navigate('/partner/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-6 py-12">
      <Card className="max-w-2xl w-full p-8 bg-white border-black/5 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Tornar-se Parceiro</h1>
          <p className="text-gray-600">
            Junte-se ao TudoAqui e expanda seu negócio em Angola
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="business_name" className="text-[#1A1A1A] font-semibold">
              Nome do Negócio *
            </Label>
            <Input
              id="business_name"
              type="text"
              placeholder="Ex: Restaurante Sabor da Terra"
              className="mt-2 h-12"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label className="text-[#1A1A1A] font-semibold mb-3 block">
              Tipo de Negócio *
            </Label>
            <RadioGroup
              value={formData.business_type}
              onValueChange={(value) => setFormData({ ...formData, business_type: value })}
            >
              <div className="grid grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.business_type === type.id
                        ? 'border-[#9333EA] bg-[#9333EA]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, business_type: type.id })}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${type.color}15` }}
                      >
                        <type.icon size={24} style={{ color: type.color }} />
                      </div>
                      <span className="text-sm font-medium text-center">{type.label}</span>
                    </div>
                    {formData.business_type === type.id && (
                      <CheckCircle 
                        className="absolute top-2 right-2 text-[#9333EA]" 
                        size={20} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Benefits Preview */}
          <Card className="p-5 bg-gradient-to-br from-[#9333EA]/10 to-[#9333EA]/5 border-[#9333EA]/20">
            <h3 className="font-bold text-[#1A1A1A] mb-3">Benefícios do Plano Básico</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#2A9D8F]" />
                Até 10 serviços publicados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#2A9D8F]" />
                Dashboard com estatísticas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#2A9D8F]" />
                15% de comissão por transação
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#2A9D8F]" />
                Suporte básico
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              * Você pode fazer upgrade para Premium ou Enterprise a qualquer momento
            </p>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-[#9333EA] hover:bg-[#9333EA]/90 text-white font-bold"
            >
              {loading ? 'A processar...' : 'Registrar como Parceiro'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
