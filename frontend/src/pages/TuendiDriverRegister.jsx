import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Car, ArrowLeft, User, Phone, Mail, FileText, Upload, CheckCircle, Clock, AlertCircle, Bike, CarFront, Crown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VEHICLE_TYPES = [
  { id: 'moto', name: 'Moto', icon: Bike, description: 'Entregas e viagens rápidas' },
  { id: 'standard', name: 'Standard', icon: Car, description: 'Carro económico' },
  { id: 'comfort', name: 'Comfort', icon: CarFront, description: 'Mais espaço e conforto' },
  { id: 'premium', name: 'Premium', icon: Crown, description: 'Veículo de luxo' },
];

const STATUS_CONFIG = {
  pending: { label: 'Em análise', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rejeitado', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function TuendiDriverRegister() {
  const navigate = useNavigate();
  const [existingDriver, setExistingDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Personal, 2: Vehicle, 3: Documents
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    vehicle_type: 'standard',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_plate: '',
    vehicle_color: '',
    cnh_number: '',
    nif: ''
  });

  const [documents, setDocuments] = useState({
    cnh: null,
    crlv: null,
    photo: null
  });

  useEffect(() => {
    checkExistingDriver();
  }, []);

  const checkExistingDriver = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/drivers/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setExistingDriver(data);
      }
    } catch (e) {
      // Not registered
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.full_name || !formData.phone || !formData.email) {
      toast.error('Preencha todos os dados pessoais');
      setStep(1);
      return;
    }
    if (!formData.vehicle_brand || !formData.vehicle_model || !formData.vehicle_plate) {
      toast.error('Preencha todos os dados do veículo');
      setStep(2);
      return;
    }
    if (!formData.cnh_number || !formData.nif) {
      toast.error('Preencha CNH e NIF');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tuendi/drivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erro ao registrar');
      }
      
      const data = await res.json();
      toast.success('Cadastro enviado com sucesso! Aguarde a aprovação.');
      setExistingDriver(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setDocuments({ ...documents, [docType]: base64 });
      
      if (existingDriver) {
        try {
          await fetch(`${BACKEND_URL}/api/tuendi/drivers/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              driver_id: existingDriver.driver_id,
              document_type: docType,
              document_base64: base64
            })
          });
          toast.success(`Documento ${docType.toUpperCase()} enviado!`);
        } catch (e) {
          toast.error('Erro ao enviar documento');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-[#0D9488] flex items-center justify-center">
          <div className="text-white text-lg">A carregar...</div>
        </div>
      </div>
    );
  }

  // Show existing driver dashboard
  if (existingDriver) {
    const statusConfig = STATUS_CONFIG[existingDriver.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-100 pb-24">
          <div className="bg-[#0D9488] px-4 pt-12 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/tuendi')}>
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-xl font-bold text-white">Motorista Tuendi</h1>
            </div>
          </div>

          <div className="px-4 -mt-4 space-y-4">
            {/* Status Card */}
            <Card className="p-6 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${statusConfig.bg} flex items-center justify-center`}>
                  <StatusIcon size={32} className={statusConfig.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status do cadastro</p>
                  <p className={`text-xl font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
                </div>
              </div>
              
              {existingDriver.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-800">Seu cadastro está em análise. Você receberá uma notificação quando for aprovado.</p>
                </div>
              )}
              
              {existingDriver.status === 'approved' && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-800">Parabéns! Você está aprovado para dirigir com o Tuendi.</p>
                </div>
              )}
            </Card>

            {/* Driver Info */}
            <Card className="p-4 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Seus Dados</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="font-medium">{existingDriver.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Car size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Veículo</p>
                    <p className="font-medium">
                      {existingDriver.vehicle_info?.brand} {existingDriver.vehicle_info?.model} • {existingDriver.vehicle_info?.plate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <FileText size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">CNH</p>
                    <p className="font-medium">{existingDriver.cnh_number}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-4 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Estatísticas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-[#0D9488]/10 rounded-xl">
                  <p className="text-2xl font-bold text-[#0D9488]">{existingDriver.total_trips || 0}</p>
                  <p className="text-xs text-gray-500">Viagens</p>
                </div>
                <div className="text-center p-3 bg-amber-100 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{existingDriver.rating || 5.0}</p>
                  <p className="text-xs text-gray-500">Avaliação</p>
                </div>
                <div className="text-center p-3 bg-green-100 rounded-xl">
                  <p className="text-lg font-bold text-green-600">{(existingDriver.total_earnings || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Kz ganhos</p>
                </div>
              </div>
            </Card>

            {/* Upload Documents */}
            <Card className="p-4 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Documentos</h3>
              <div className="space-y-3">
                {['cnh', 'crlv', 'photo'].map(docType => (
                  <div key={docType} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-500" />
                      <span className="font-medium capitalize">{docType === 'photo' ? 'Foto de Perfil' : docType.toUpperCase()}</span>
                    </div>
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(docType, e.target.files[0])}
                      />
                      <span className="text-[#0D9488] font-medium text-sm flex items-center gap-1">
                        <Upload size={14} /> {existingDriver.documents?.[docType] ? 'Atualizar' : 'Enviar'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Registration Form
  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-100 pb-24">
        {/* Header with Image */}
        <div className="relative h-48 bg-gradient-to-br from-[#0D9488] to-[#0F766E]">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1587476351660-e9fa4bb8b26c?w=800')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-transparent to-transparent" />
          <div className="relative z-10 px-4 pt-12">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/tuendi')}>
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Seja Motorista Tuendi</h1>
                <p className="text-white/80 text-sm">Ganhe dinheiro com seu veículo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-8">
          {/* Steps Indicator */}
          <Card className="p-4 bg-white rounded-2xl shadow-lg mb-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-[#0D9488] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-[#0D9488]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Pessoal</span>
              <span>Veículo</span>
              <span>Documentos</span>
            </div>
          </Card>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <Card className="p-5 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Dados Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input 
                    placeholder="Seu nome completo"
                    className="mt-1 h-12 rounded-xl"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input 
                    placeholder="+244 9XX XXX XXX"
                    className="mt-1 h-12 rounded-xl"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="seu@email.com"
                    className="mt-1 h-12 rounded-xl"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <Button onClick={() => setStep(2)} className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl">
                  Continuar
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Vehicle Info */}
          {step === 2 && (
            <Card className="p-5 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Dados do Veículo</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Tipo de Veículo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPES.map(v => {
                      const Icon = v.icon;
                      return (
                        <button 
                          key={v.id}
                          onClick={() => setFormData({...formData, vehicle_type: v.id})}
                          className={`p-3 rounded-xl border-2 text-left ${formData.vehicle_type === v.id ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-gray-200'}`}
                        >
                          <Icon size={20} className={formData.vehicle_type === v.id ? 'text-[#0D9488]' : 'text-gray-500'} />
                          <p className="font-bold text-sm mt-1">{v.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Marca</Label>
                    <Input 
                      placeholder="Toyota"
                      className="mt-1 h-10 rounded-xl"
                      value={formData.vehicle_brand}
                      onChange={(e) => setFormData({...formData, vehicle_brand: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input 
                      placeholder="Corolla"
                      className="mt-1 h-10 rounded-xl"
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Ano</Label>
                    <Input 
                      type="number"
                      placeholder="2020"
                      className="mt-1 h-10 rounded-xl"
                      value={formData.vehicle_year}
                      onChange={(e) => setFormData({...formData, vehicle_year: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Matrícula</Label>
                    <Input 
                      placeholder="LD-XX-XX-XX"
                      className="mt-1 h-10 rounded-xl"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input 
                      placeholder="Branco"
                      className="mt-1 h-10 rounded-xl"
                      value={formData.vehicle_color}
                      onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl">
                    Continuar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <Card className="p-5 bg-white rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Documentação</h3>
              <div className="space-y-4">
                <div>
                  <Label>Número da CNH</Label>
                  <Input 
                    placeholder="Carta de condução"
                    className="mt-1 h-12 rounded-xl"
                    value={formData.cnh_number}
                    onChange={(e) => setFormData({...formData, cnh_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>NIF</Label>
                  <Input 
                    placeholder="Número de Identificação Fiscal"
                    className="mt-1 h-12 rounded-xl"
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                  />
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800">Os documentos (foto CNH, CRLV e foto de perfil) poderão ser enviados após o cadastro inicial.</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 rounded-xl">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="flex-1 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
                  >
                    {submitting ? 'A enviar...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
