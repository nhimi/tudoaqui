import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Car, ArrowLeft, User, Phone, Mail, FileText, Upload, CheckCircle, Clock, AlertCircle, Bike, CarFront, Crown, Camera, Shield, Award, TrendingUp, DollarSign, Calendar, Star, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VEHICLE_TYPES = [
  { id: 'moto', name: 'Moto', icon: Bike, description: 'Entregas e viagens rápidas', earnings: '50-80k/mês' },
  { id: 'standard', name: 'Standard', icon: Car, description: 'Carro económico', earnings: '80-120k/mês' },
  { id: 'comfort', name: 'Comfort', icon: CarFront, description: 'Mais espaço e conforto', earnings: '100-150k/mês' },
  { id: 'premium', name: 'Premium', icon: Crown, description: 'Veículo de luxo', earnings: '150-250k/mês' },
];

const STATUS_CONFIG = {
  pending: { label: 'Em análise', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  approved: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  rejected: { label: 'Rejeitado', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  suspended: { label: 'Suspenso', icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const REQUIRED_DOCS = [
  { id: 'cnh', name: 'Carta de Condução', description: 'Frente e verso legíveis', icon: FileText },
  { id: 'crlv', name: 'Documento do Veículo', description: 'CRLV atualizado', icon: Car },
  { id: 'photo', name: 'Foto de Perfil', description: 'Foto clara do rosto', icon: Camera },
  { id: 'criminal', name: 'Registo Criminal', description: 'Emitido há menos de 90 dias', icon: Shield },
];

export default function TuendiDriverRegister() {
  const navigate = useNavigate();
  const [existingDriver, setExistingDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showBenefits, setShowBenefits] = useState(false);
  
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
    photo: null,
    criminal: null
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
      toast.success('Cadastro enviado com sucesso!');
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
          toast.success(`Documento enviado com sucesso!`);
          checkExistingDriver();
        } catch (e) {
          toast.error('Erro ao enviar documento');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gradient-to-b from-[#0D9488] to-[#0F766E] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Existing Driver Dashboard
  if (existingDriver) {
    const statusConfig = STATUS_CONFIG[existingDriver.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-gray-50 pb-24">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] px-5 pt-12 pb-20 relative overflow-hidden">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
                  <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold text-white">Painel do Motorista</h1>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  {existingDriver.documents?.photo ? (
                    <img src={existingDriver.documents.photo.data} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{existingDriver.full_name}</h2>
                  <p className="text-white/70 text-sm">{existingDriver.vehicle_info?.brand} {existingDriver.vehicle_info?.model}</p>
                  <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                    <StatusIcon size={14} className={statusConfig.color} />
                    <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 -mt-10 space-y-4">
            {/* Stats */}
            <Card className="p-5 bg-white rounded-3xl shadow-lg border-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Car size={24} className="text-[#0D9488]" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{existingDriver.total_trips || 0}</p>
                  <p className="text-xs text-gray-500">Viagens</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Star size={24} className="text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{existingDriver.rating || 5.0}</p>
                  <p className="text-xs text-gray-500">Avaliação</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <DollarSign size={24} className="text-green-500" />
                  </div>
                  <p className="text-lg font-black text-gray-900">{(existingDriver.total_earnings / 1000 || 0).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500">Ganhos (Kz)</p>
                </div>
              </div>
            </Card>

            {/* Status Messages */}
            {existingDriver.status === 'pending' && (
              <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Clock size={24} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Cadastro em análise</p>
                    <p className="text-sm text-amber-700 mt-1">Estamos verificando seus documentos. Isso pode levar até 48 horas úteis.</p>
                  </div>
                </div>
              </Card>
            )}

            {existingDriver.status === 'approved' && (
              <Card className="p-4 bg-green-50 border-green-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Você está aprovado! 🎉</p>
                    <p className="text-sm text-green-700 mt-1">Comece a aceitar corridas e ganhe dinheiro com o Tuendi.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Vehicle Info */}
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
              <h3 className="font-bold text-gray-900 mb-4">Informações do Veículo</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Veículo</span>
                  <span className="font-semibold">{existingDriver.vehicle_info?.brand} {existingDriver.vehicle_info?.model}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Matrícula</span>
                  <span className="font-semibold">{existingDriver.vehicle_info?.plate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Ano</span>
                  <span className="font-semibold">{existingDriver.vehicle_info?.year}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Cor</span>
                  <span className="font-semibold">{existingDriver.vehicle_info?.color}</span>
                </div>
              </div>
            </Card>

            {/* Documents */}
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
              <h3 className="font-bold text-gray-900 mb-4">Documentos</h3>
              <div className="space-y-3">
                {REQUIRED_DOCS.map(doc => {
                  const docData = existingDriver.documents?.[doc.id];
                  const DocIcon = doc.icon;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${docData ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <DocIcon size={20} className={docData ? 'text-green-600' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {docData ? (docData.status === 'pending' ? 'Aguardando verificação' : 'Verificado') : 'Não enviado'}
                          </p>
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(doc.id, e.target.files[0])}
                        />
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          docData ? 'bg-gray-200 text-gray-600' : 'bg-[#0D9488] text-white'
                        }`}>
                          {docData ? 'Atualizar' : 'Enviar'}
                        </span>
                      </label>
                    </div>
                  );
                })}
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
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Hero Header */}
        <div className="relative h-56 bg-gradient-to-br from-[#0D9488] to-[#0F766E] overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=800')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent" />
          
          <div className="relative z-10 px-5 pt-12">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => navigate('/tuendi')}>
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Seja Motorista Tuendi</h1>
                <p className="text-white/70 text-sm">Ganhe dinheiro no seu tempo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-16">
          {/* Benefits Preview */}
          <Card className="p-5 bg-white rounded-3xl shadow-xl border-0 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Por que dirigir com Tuendi?</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowBenefits(true)} className="text-[#0D9488]">
                Ver mais
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[#0D9488]/5 rounded-2xl">
                <DollarSign size={24} className="mx-auto text-[#0D9488] mb-1" />
                <p className="text-xs font-semibold text-gray-700">Ganhos Flexíveis</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-2xl">
                <Calendar size={24} className="mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-semibold text-gray-700">Horário Livre</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-2xl">
                <Shield size={24} className="mx-auto text-purple-500 mb-1" />
                <p className="text-xs font-semibold text-gray-700">Suporte 24h</p>
              </div>
            </div>
          </Card>

          {/* Progress Steps */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm border-0 mb-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => setStep(s)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      step === s 
                        ? 'bg-[#0D9488] text-white shadow-lg' 
                        : step > s 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > s ? <CheckCircle size={18} /> : s}
                  </button>
                  {s < 3 && <div className={`w-16 h-1 mx-2 rounded-full ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-500 px-1">
              <span>Pessoal</span>
              <span>Veículo</span>
              <span>Documentos</span>
            </div>
          </Card>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-[#0D9488]" />
                Dados Pessoais
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Nome Completo</Label>
                  <Input 
                    placeholder="Seu nome completo"
                    className="mt-2 h-12 rounded-xl bg-gray-50"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Telefone</Label>
                  <Input 
                    placeholder="+244 9XX XXX XXX"
                    className="mt-2 h-12 rounded-xl bg-gray-50"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Email</Label>
                  <Input 
                    type="email"
                    placeholder="seu@email.com"
                    className="mt-2 h-12 rounded-xl bg-gray-50"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
                  disabled={!formData.full_name || !formData.phone || !formData.email}
                >
                  Continuar <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Vehicle Info */}
          {step === 2 && (
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car size={20} className="text-[#0D9488]" />
                Dados do Veículo
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium text-sm mb-3 block">Categoria</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPES.map(v => {
                      const Icon = v.icon;
                      return (
                        <button 
                          key={v.id}
                          onClick={() => setFormData({...formData, vehicle_type: v.id})}
                          className={`p-3 rounded-2xl border-2 text-left transition-all ${
                            formData.vehicle_type === v.id 
                              ? 'border-[#0D9488] bg-[#0D9488]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={24} className={formData.vehicle_type === v.id ? 'text-[#0D9488]' : 'text-gray-400'} />
                          <p className="font-bold text-sm mt-2">{v.name}</p>
                          <p className="text-xs text-green-600 mt-1">{v.earnings}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Marca</Label>
                    <Input 
                      placeholder="Toyota"
                      className="mt-2 h-11 rounded-xl bg-gray-50"
                      value={formData.vehicle_brand}
                      onChange={(e) => setFormData({...formData, vehicle_brand: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Modelo</Label>
                    <Input 
                      placeholder="Corolla"
                      className="mt-2 h-11 rounded-xl bg-gray-50"
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Ano</Label>
                    <Input 
                      type="number"
                      placeholder="2020"
                      className="mt-2 h-11 rounded-xl bg-gray-50"
                      value={formData.vehicle_year}
                      onChange={(e) => setFormData({...formData, vehicle_year: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Matrícula</Label>
                    <Input 
                      placeholder="LD-XX-XX"
                      className="mt-2 h-11 rounded-xl bg-gray-50"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Cor</Label>
                    <Input 
                      placeholder="Branco"
                      className="mt-2 h-11 rounded-xl bg-gray-50"
                      value={formData.vehicle_color}
                      onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl">
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    className="flex-1 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
                    disabled={!formData.vehicle_brand || !formData.vehicle_model || !formData.vehicle_plate}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-0">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#0D9488]" />
                Documentação
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Número da CNH</Label>
                  <Input 
                    placeholder="Carta de condução"
                    className="mt-2 h-12 rounded-xl bg-gray-50"
                    value={formData.cnh_number}
                    onChange={(e) => setFormData({...formData, cnh_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-sm">NIF</Label>
                  <Input 
                    placeholder="Número de Identificação Fiscal"
                    className="mt-2 h-12 rounded-xl bg-gray-50"
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                  />
                </div>
                
                <Card className="p-4 bg-blue-50 border-blue-200 rounded-2xl">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Os documentos (foto CNH, CRLV e foto de perfil) poderão ser enviados após o cadastro inicial na área do motorista.
                  </p>
                </Card>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 rounded-xl">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || !formData.cnh_number || !formData.nif}
                    className="flex-1 h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <>Finalizar Cadastro</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Benefits Dialog */}
      <Dialog open={showBenefits} onOpenChange={setShowBenefits}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Award size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Benefícios Tuendi</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Ganhos Competitivos</p>
                <p className="text-sm text-gray-500">Receba até 80% do valor de cada corrida</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Horário Flexível</p>
                <p className="text-sm text-gray-500">Trabalhe quando e quanto quiser</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Bónus e Incentivos</p>
                <p className="text-sm text-gray-500">Ganhe bónus por corridas completadas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Suporte 24 horas</p>
                <p className="text-sm text-gray-500">Equipa sempre disponível para ajudar</p>
              </div>
            </div>
            <Button onClick={() => setShowBenefits(false)} className="w-full h-12 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold rounded-xl">
              Começar Agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
