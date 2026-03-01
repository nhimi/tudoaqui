import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PartnerMenuManagement() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Principal', image: '' });

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/menu-items`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setRestaurant(data.restaurant);
      setMenuItems(data.menu_items || []);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Nome e preço obrigatórios'); return; }
    try {
      const url = editItem
        ? `${BACKEND_URL}/api/partners/menu-items/${editItem.item_id}`
        : `${BACKEND_URL}/api/partners/menu-items`;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, price: parseFloat(form.price) })
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast.success(editItem ? 'Item atualizado!' : 'Item adicionado!');
      setShowForm(false);
      setEditItem(null);
      setForm({ name: '', description: '', price: '', category: 'Principal', image: '' });
      loadMenu();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Remover este item?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/menu-items/${itemId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Erro');
      toast.success('Item removido');
      loadMenu();
    } catch (err) { toast.error(err.message); }
  };

  const toggleAvailability = async (item) => {
    try {
      await fetch(`${BACKEND_URL}/api/partners/menu-items/${item.item_id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ available: !item.available })
      });
      loadMenu();
    } catch (err) { toast.error(err.message); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, image: item.image || '' });
    setShowForm(true);
  };

  const formatKz = (v) => new Intl.NumberFormat('pt-AO').format(v) + ' Kz';
  const categories = [...new Set(menuItems.map(i => i.category))];

  if (loading) return <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#FCBF49] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/partner/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="menu-mgmt-back"><ArrowLeft size={20} /></Button>
            <div><h1 className="text-2xl font-bold text-white" data-testid="menu-mgmt-title">Gerir Menu</h1><p className="text-white/70 text-sm">{restaurant?.name} - {menuItems.length} itens</p></div>
          </div>
          <Button onClick={() => { setEditItem(null); setForm({ name: '', description: '', price: '', category: 'Principal', image: '' }); setShowForm(true); }} className="bg-[#FCBF49] text-[#1A1A1A] font-bold" data-testid="add-menu-item-btn"><Plus size={18} className="mr-1" /> Adicionar</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {categories.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-xl" data-testid="empty-menu"><p className="text-gray-500">Nenhum item no menu. Adicione o primeiro!</p></Card>
        ) : categories.map(cat => (
          <div key={cat}>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{cat}</h2>
            <div className="space-y-2">
              {menuItems.filter(i => i.category === cat).map((item, idx) => (
                <Card key={item.item_id} className={`p-4 bg-white border-black/5 rounded-xl shadow-sm flex items-center gap-4 ${!item.available ? 'opacity-60' : ''}`} data-testid={`menu-manage-item-${idx}`}>
                  <div className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1A1A1A] truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    <p className="font-bold text-[#D62828] text-sm mt-1">{formatKz(item.price)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toggleAvailability(item)} className="h-8 w-8 p-0" data-testid={`toggle-${item.item_id}`}>{item.available ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-gray-400" />}</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0" data-testid={`edit-${item.item_id}`}><Pencil size={16} className="text-blue-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.item_id)} className="h-8 w-8 p-0" data-testid={`delete-${item.item_id}`}><Trash2 size={16} className="text-red-500" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input data-testid="item-name-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 mt-1" /></div>
            <div><Label>Descrição</Label><Input data-testid="item-desc-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Preço (Kz) *</Label><Input data-testid="item-price-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="h-11 mt-1" /></div>
              <div><Label>Categoria</Label><Input data-testid="item-category-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="h-11 mt-1" /></div>
            </div>
            <div><Label>URL da Imagem</Label><Input data-testid="item-image-input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." className="h-11 mt-1" /></div>
            <Button onClick={handleSave} className="w-full h-12 bg-[#2A9D8F] text-white font-bold" data-testid="save-menu-item-btn">{editItem ? 'Atualizar' : 'Adicionar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
