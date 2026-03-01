import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Upload, FileCheck, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DOC_TYPES = [
  { id: 'bi', name: 'Bilhete de Identidade' },
  { id: 'nif', name: 'NIF (Número de Identificação Fiscal)' },
  { id: 'alvara', name: 'Alvará Comercial' },
  { id: 'outro', name: 'Outro Documento' }
];

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  aprovado: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' }
};

export default function PartnerDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('bi');

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/partners/documents`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ficheiro demasiado grande (máx 5MB)'); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const res = await fetch(`${BACKEND_URL}/api/partners/documents/upload`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ doc_type: docType, file_data: base64, file_name: file.name })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro'); }
        toast.success('Documento enviado para análise!');
        loadDocs();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(err.message);
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2A9D8F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-8">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1A1A1A]/90 px-6 pt-12 pb-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/partner/dashboard')} variant="ghost" className="text-white hover:bg-white/10" data-testid="docs-back"><ArrowLeft size={20} /></Button>
          <div><h1 className="text-2xl font-bold text-white" data-testid="docs-title">Documentos</h1><p className="text-white/70 text-sm">Verificação de identidade</p></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-6 space-y-4">
        {/* Upload Section */}
        <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
          <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2"><Upload size={20} /> Enviar Documento</h3>
          <div className="space-y-3">
            <div>
              <Label className="font-semibold">Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-11 mt-1" data-testid="doc-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(dt => <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold">Ficheiro (PDF, JPG, PNG - máx 5MB)</Label>
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#2A9D8F] transition-colors bg-gray-50">
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">{uploading ? 'A enviar...' : 'Clique para selecionar'}</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} data-testid="doc-file-input" />
              </label>
            </div>
          </div>
        </Card>

        {/* Documents List */}
        <Card className="p-5 bg-white border-black/5 rounded-xl shadow-sm">
          <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2"><FileCheck size={20} /> Documentos Enviados ({documents.length})</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4" data-testid="no-docs">Nenhum documento enviado</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, idx) => {
                const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pendente;
                const Icon = sc.icon;
                return (
                  <div key={doc.document_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`doc-item-${idx}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1A1A1A]/5 rounded-lg flex items-center justify-center"><FileText size={20} className="text-gray-600" /></div>
                      <div>
                        <p className="font-semibold text-sm text-[#1A1A1A]">{DOC_TYPES.find(d => d.id === doc.doc_type)?.name || doc.doc_type}</p>
                        <p className="text-xs text-gray-500">{doc.file_name} - {new Date(doc.uploaded_at).toLocaleDateString('pt-AO')}</p>
                        {doc.rejection_reason && <p className="text-xs text-red-500 mt-1">Motivo: {doc.rejection_reason}</p>}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                      <Icon size={12} /> {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
