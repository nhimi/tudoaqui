import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Settings, Users, BarChart3, CreditCard, Globe, Phone, Mail, Save, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ADMIN_ROLE_LABELS = {
  ceo: { name: 'CEO', color: 'bg-purple-100 text-purple-800' },
  admin: { name: 'Administrador', color: 'bg-blue-100 text-blue-800' },
  suporte: { name: 'Suporte', color: 'bg-green-100 text-green-800' },
  financas: { name: 'Finanças', color: 'bg-orange-100 text-orange-800' }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Editable config state
  const [aboutForm, setAboutForm] = useState({ description: '', mission: '' });
  const [contactsForm, setContactsForm] = useState({ email: '', phone: '', whatsapp: '', address: '', social: { facebook: '', instagram: '', linkedin: '' } });
  const [apiForm, setApiForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({ bank_accounts: { primary: { bank: '', account_name: '', iban: '', account_number: '', nif: '' } }, commission_rates: { basico: 0.15, premium: 0.10, enterprise: 0.05 }, payment_direct_to_partner: true });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [statsRes, configRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/config`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/users?limit=50`, { credentials: 'include' })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (configRes.ok) {
        const c = await configRes.json();
        setConfig(c);
        setAboutForm(c.about || {});
        setContactsForm(c.contacts || {});
        setApiForm(c.api_configs || {});
        setPaymentForm(c.payment_settings || paymentForm);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
        setUsersTotal(u.total || 0);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados. Verifique se é administrador.');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (endpoint, data) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/config/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Erro'); }
      toast.success('Configuração salva!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const assignRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ admin_role: newRole || null })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Erro'); }
      toast.success('Role atualizado!');
      loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v || 0) + ' Kz';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D62828] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="admin-back-btn">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-[#D62828]" />
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="admin-title">Painel Admin</h1>
              <p className="text-white/70 text-sm">Configuração Geral do Sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6 bg-white shadow-sm rounded-xl h-12">
            <TabsTrigger value="overview" className="font-semibold" data-testid="tab-overview"><BarChart3 size={16} className="mr-1" /> Geral</TabsTrigger>
            <TabsTrigger value="about" className="font-semibold" data-testid="tab-about"><Globe size={16} className="mr-1" /> Sobre</TabsTrigger>
            <TabsTrigger value="contacts" className="font-semibold" data-testid="tab-contacts"><Phone size={16} className="mr-1" /> Contactos</TabsTrigger>
            <TabsTrigger value="apis" className="font-semibold" data-testid="tab-apis"><Settings size={16} className="mr-1" /> APIs</TabsTrigger>
            <TabsTrigger value="users" className="font-semibold" data-testid="tab-users"><Users size={16} className="mr-1" /> Utilizadores</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Utilizadores', value: stats?.users?.total || 0, color: 'border-l-[#2A9D8F]' },
                { label: 'Parceiros', value: stats?.partners?.total || 0, color: 'border-l-[#FCBF49]' },
                { label: 'Pedidos', value: stats?.orders?.total || 0, color: 'border-l-[#D62828]' },
                { label: 'Receita Total', value: formatKz(stats?.revenue?.total), color: 'border-l-green-500' },
                { label: 'Pagamentos', value: stats?.payments?.total || 0, color: 'border-l-blue-500' },
                { label: 'Pag. Pendentes', value: stats?.payments?.pending || 0, color: 'border-l-orange-500' },
                { label: 'Reservas', value: stats?.bookings?.total || 0, color: 'border-l-purple-500' },
                { label: 'Corridas', value: stats?.rides?.total || 0, color: 'border-l-pink-500' }
              ].map((item, idx) => (
                <Card key={idx} className={`p-4 bg-white border-black/5 rounded-xl shadow-sm border-l-4 ${item.color}`} data-testid={`stat-card-${idx}`}>
                  <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{item.value}</p>
                </Card>
              ))}
            </div>

            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2"><CreditCard size={20} /> Config. Pagamentos</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Pagamento direto ao parceiro</span>
                  <button
                    data-testid="toggle-direct-payment"
                    onClick={() => setPaymentForm(p => ({ ...p, payment_direct_to_partner: !p.payment_direct_to_partner }))}
                    className={`w-12 h-6 rounded-full transition-colors ${paymentForm.payment_direct_to_partner ? 'bg-[#2A9D8F]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${paymentForm.payment_direct_to_partner ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(paymentForm.commission_rates || {}).map(([tier, rate]) => (
                    <div key={tier} className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-xs text-gray-500 capitalize">{tier} Comissão</Label>
                      <Input type="number" step="0.01" value={rate} onChange={(e) => setPaymentForm(p => ({ ...p, commission_rates: { ...p.commission_rates, [tier]: parseFloat(e.target.value) || 0 } }))} className="h-9 mt-1" />
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Conta Bancária Principal</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['bank', 'account_name', 'iban', 'account_number', 'nif'].map(field => (
                      <div key={field}>
                        <Label className="text-xs text-gray-500 capitalize">{field.replace('_', ' ')}</Label>
                        <Input value={paymentForm.bank_accounts?.primary?.[field] || ''} onChange={(e) => setPaymentForm(p => ({ ...p, bank_accounts: { ...p.bank_accounts, primary: { ...p.bank_accounts?.primary, [field]: e.target.value } } }))} className="h-9 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={() => saveConfig('payments', paymentForm)} disabled={saving} className="bg-[#2A9D8F] text-white" data-testid="save-payments-btn">
                  <Save size={16} className="mr-1" /> {saving ? 'A salvar...' : 'Salvar Pagamentos'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ABOUT TAB */}
          <TabsContent value="about">
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-4">Informações Sobre a Empresa</h3>
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Descrição</Label>
                  <textarea data-testid="about-description" className="w-full mt-1 p-3 border border-gray-200 rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]" value={aboutForm.description || ''} onChange={(e) => setAboutForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <Label className="font-semibold">Missão</Label>
                  <textarea data-testid="about-mission" className="w-full mt-1 p-3 border border-gray-200 rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]" value={aboutForm.mission || ''} onChange={(e) => setAboutForm(p => ({ ...p, mission: e.target.value }))} />
                </div>
                <Button onClick={() => saveConfig('about', aboutForm)} disabled={saving} className="bg-[#2A9D8F] text-white" data-testid="save-about-btn">
                  <Save size={16} className="mr-1" /> Salvar
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts">
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-4">Contactos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Email</Label>
                  <div className="relative mt-1"><Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <Input data-testid="contacts-email" className="pl-10 h-11" value={contactsForm.email || ''} onChange={(e) => setContactsForm(p => ({ ...p, email: e.target.value }))} /></div>
                </div>
                <div>
                  <Label className="font-semibold">Telefone</Label>
                  <div className="relative mt-1"><Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <Input data-testid="contacts-phone" className="pl-10 h-11" value={contactsForm.phone || ''} onChange={(e) => setContactsForm(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div>
                  <Label className="font-semibold">WhatsApp</Label>
                  <Input data-testid="contacts-whatsapp" className="h-11 mt-1" value={contactsForm.whatsapp || ''} onChange={(e) => setContactsForm(p => ({ ...p, whatsapp: e.target.value }))} />
                </div>
                <div>
                  <Label className="font-semibold">Endereço</Label>
                  <Input data-testid="contacts-address" className="h-11 mt-1" value={contactsForm.address || ''} onChange={(e) => setContactsForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>
              <h4 className="font-semibold mt-4 mb-2">Redes Sociais</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['facebook', 'instagram', 'linkedin'].map(social => (
                  <div key={social}>
                    <Label className="text-xs text-gray-500 capitalize">{social}</Label>
                    <Input data-testid={`contacts-${social}`} className="h-9 mt-1" value={contactsForm.social?.[social] || ''} onChange={(e) => setContactsForm(p => ({ ...p, social: { ...p.social, [social]: e.target.value } }))} placeholder={`URL do ${social}`} />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveConfig('contacts', contactsForm)} disabled={saving} className="mt-4 bg-[#2A9D8F] text-white" data-testid="save-contacts-btn">
                <Save size={16} className="mr-1" /> Salvar Contactos
              </Button>
            </Card>
          </TabsContent>

          {/* APIS TAB */}
          <TabsContent value="apis">
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2"><Settings size={20} /> Configuração de APIs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(apiForm).map(([key, value]) => (
                  <div key={key}>
                    <Label className="font-semibold text-sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <Input data-testid={`api-${key}`} type="password" className="h-11 mt-1 font-mono" value={value || ''} onChange={(e) => setApiForm(p => ({ ...p, [key]: e.target.value }))} placeholder="Inserir chave..." />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveConfig('apis', apiForm)} disabled={saving} className="mt-4 bg-[#2A9D8F] text-white" data-testid="save-apis-btn">
                <Save size={16} className="mr-1" /> Salvar APIs
              </Button>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2"><Users size={20} /> Utilizadores ({usersTotal})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-600">Nome</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600">Email</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600">Tier</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600">Role Admin</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50" data-testid={`user-row-${idx}`}>
                        <td className="py-3 px-2 font-medium">{user.name}</td>
                        <td className="py-3 px-2 text-gray-600">{user.email}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100">
                            {user.user_tier || 'normal'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {user.admin_role ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ADMIN_ROLE_LABELS[user.admin_role]?.color || 'bg-gray-100'}`}>
                              {ADMIN_ROLE_LABELS[user.admin_role]?.name || user.admin_role}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Select value={user.admin_role || 'none'} onValueChange={(v) => assignRole(user.user_id, v === 'none' ? null : v)}>
                            <SelectTrigger className="h-8 w-36" data-testid={`role-select-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem role</SelectItem>
                              <SelectItem value="ceo">CEO</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="suporte">Suporte</SelectItem>
                              <SelectItem value="financas">Finanças</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
