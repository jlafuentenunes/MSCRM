import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Save, Trash2, 
    Clock, Ticket, Edit3, Loader2
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface Lead {
    id: number; nome: string; empresa: string; email: string; telemovel: string; 
    servico: string; tipo_servico_id: number | null; tamanho_equipa: number; resumo: string; status: string; data_registo: string;
    banco_horas_contratado: string; banco_horas_restantes: string; is_ilimitado: number;
}

interface ServiceType {
    id: number; nome: string; icone: string; cor: string;
}

const LeadDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [services, setServices] = useState<ServiceType[]>([]);

    const fetchLeadData = async () => {
        try {
            setLoading(true);
            const [leadRes, ticketsRes] = await Promise.all([
                api.get(`/backend/api.php?id=${id}`),
                api.get(`/backend/tickets.php`)
            ]);
            
            if (leadRes.data === null || leadRes.data === false) {
                setLead(null);
            } else {
                setLead(leadRes.data);
                const leadTickets = (ticketsRes.data || []).filter((t: any) => t.lead_id === parseInt(id || '0'));
                setTickets(leadTickets);
            }
        } catch (err: any) { 
            console.error(err); 
            if (err.response?.status === 401) navigate('/login');
        } finally { setLoading(false); }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/backend/services.php');
            setServices(res.data.data || []);
        } catch (err) { console.error("Erro Serviços:", err); }
    };

    useEffect(() => { 
        fetchLeadData(); 
        fetchServices();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/backend/api.php', lead);
            alert('Cliente atualizado com sucesso!');
        } catch (err: any) { 
            if (err.response?.status === 401) navigate('/login');
            else alert('Erro ao atualizar cliente.'); 
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Tem a certeza que deseja eliminar este cliente? Esta ação é irreversível.')) return;
        try {
            await api.delete(`/backend/api.php?id=${id}`);
            navigate('/dashboard');
        } catch (err: any) { 
            if (err.response?.status === 401) navigate('/login');
            else alert('Erro ao eliminar cliente.'); 
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    if (!lead) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 p-10 text-center">
            <p className="text-xl font-bold text-slate-400 mb-4 tracking-tight">CLIENTE NÃO ENCONTRADO</p>
            <button onClick={() => navigate('/dashboard')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest">Voltar ao Dashboard</button>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20}/></button>
                        <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Detalhes da Lead</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDelete} className="p-2.5 lg:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                        <button form="editForm" type="submit" disabled={saving} className="bg-slate-900 text-white px-4 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all">
                            {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={16}/>} <span>{saving ? 'A Guardar...' : 'Guardar'}</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-10">
                    {/* Resumo Rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Banco de Horas</p>
                            <div className="flex items-end justify-between leading-none">
                                <div>
                                    <h4 className="text-4xl font-black tracking-tighter">{lead.is_ilimitado ? '∞' : `${parseFloat(lead.banco_horas_restantes).toFixed(1)}h`}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{lead.is_ilimitado ? 'Acesso total' : 'Restantes agora'}</p>
                                </div>
                                <Clock className="text-blue-500 mb-2" size={32} />
                            </div>
                        </div>
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tickets Abertos</p>
                                <h4 className="text-3xl font-black">{tickets.filter(t => t.status === 'Aberto').length}</h4>
                            </div>
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Ticket size={24}/></div>
                        </div>
                        <div className="bg-white rounded-[32px] p-8 border border-white shadow-sm flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status CRM</p>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100 italic">{lead.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Formulário Editar */}
                        <div className="lg:col-span-8 flex flex-col gap-8">
                            <form id="editForm" onSubmit={handleUpdate} className="bg-white shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[40px] p-8 lg:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                                    <Edit3 className="text-blue-600" size={20}/>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic">Informação Base</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Responsável</label>
                                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm focus:bg-white focus:border-blue-500 transition-all outline-none"
                                            value={lead.nome} onChange={e => setLead({...lead, nome: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Empresa</label>
                                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm focus:bg-white focus:border-blue-500 transition-all outline-none"
                                            value={lead.empresa} onChange={e => setLead({...lead, empresa: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Principal</label>
                                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm focus:bg-white focus:border-blue-500 transition-all outline-none"
                                            value={lead.email} onChange={e => setLead({...lead, email: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Telemóvel / WhatsApp</label>
                                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm focus:bg-white focus:border-blue-500 transition-all outline-none"
                                            value={lead.telemovel} onChange={e => setLead({...lead, telemovel: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Serviço Pretendido</label>
                                        <select className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm"
                                            value={lead.tipo_servico_id || ''} onChange={e => setLead({...lead, tipo_servico_id: parseInt(e.target.value) || null})}>
                                            <option value="">Selecionar Serviço...</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tamanho da Equipa</label>
                                        <input type="number" className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm"
                                            value={lead.tamanho_equipa} onChange={e => setLead({...lead, tamanho_equipa: parseInt(e.target.value) || 0})} />
                                    </div>
                                    <div className="space-y-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Contrato (Horas Totais)</label>
                                         <input type="number" className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-bold text-sm"
                                            value={lead.banco_horas_contratado} onChange={e => setLead({...lead, banco_horas_contratado: e.target.value})} />
                                    </div>
                                    <div className="flex items-center gap-4 pt-6 pl-1">
                                        <input type="checkbox" id="det_unlimited" className="w-6 h-6 accent-blue-600 rounded-lg"
                                            checked={lead.is_ilimitado === 1} onChange={e => setLead({...lead, is_ilimitado: e.target.checked ? 1 : 0})} />
                                        <label htmlFor="det_unlimited" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">Banco Ilimitado</label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Notas do Consultor</label>
                                    <textarea className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[24px] font-medium text-sm h-32 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        value={lead.resumo} onChange={e => setLead({...lead, resumo: e.target.value})} />
                                </div>
                            </form>
                        </div>

                        {/* Histórico/Widgets Lateral */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic flex items-center gap-2 mb-6">
                                    <Ticket size={16} className="text-emerald-500" /> Histórico de Tickets
                                </h3>
                                <div className="space-y-4">
                                    {tickets.map(t => (
                                        <div key={t.id} onClick={() => navigate('/tickets')} className="p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all">
                                            <p className="text-xs font-black text-slate-800 line-clamp-1">{t.assunto}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.status === 'Fechado' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>{t.status}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">{new Date(t.data_abertura).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {tickets.length === 0 && <p className="text-center py-6 text-slate-400 text-xs italic">Sem tickets abertos.</p>}
                                </div>
                            </div>

                            <button onClick={() => navigate('/tickets')} className="w-full bg-blue-600 text-white font-black py-4 rounded-[24px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all uppercase text-[10px] tracking-widest">
                                <Plus className="w-4 h-4" /> Abrir Novo Ticket
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default LeadDetails;
