import React, { useEffect, useState } from 'react';
import { 
  Plus, Trash2, 
  Menu, X, Save, Loader2, ArrowRight,
  Bell, Info, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';

interface Lead {
  id: number; nome: string; empresa: string; email: string; telemovel: string; 
  servico: string; tamanho_equipa: number; resumo: string; status: string; data_registo: string;
  banco_horas_contratado: string; banco_horas_restantes: string; is_ilimitado: number;
}

interface Notification {
    id: number; tipo: 'sucesso' | 'aviso' | 'erro' | 'info'; 
    titulo: string; mensagem: string; data_criacao: string; is_read: number;
}

interface ServiceType {
    id: number; nome: string; icone: string; cor: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newLead, setNewLead] = useState({
        nome: '', empresa: '', email: '', telemovel: '', servico: '', tipo_servico_id: '',
        tamanho_equipa: 1, resumo: '', status: 'Novo', tipo: 'avenca',
        banco_horas_contratado: 0, is_ilimitado: 0
    });
    const [services, setServices] = useState<ServiceType[]>([]);
    const [autoCreateTicket, setAutoCreateTicket] = useState(false);
    
    // Estados de Notificações
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const response = await api.get('/backend/api.php');
            setLeads(Array.isArray(response.data) ? response.data : []);
            await fetchNotifications();
        } catch (err) { console.error("Erro ao carregar leads:", err); } finally { setLoading(false); }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/backend/notifications.php');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) { console.error("Erro Notif:", err); }
    };

    const markAsRead = async (id?: number) => {
        try {
            await api.put('/backend/notifications.php', id ? { id } : { mark_all: true });
            fetchNotifications();
        } catch (err) { console.error("Erro ao ler notif:", err); }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/backend/services.php');
            setServices(res.data.data || []);
        } catch (err) { console.error("Erro Serviços:", err); }
    };

    useEffect(() => { 
        fetchLeads(); 
        fetchServices();
    }, []);

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await api.post('/backend/api.php', {
                ...newLead,
                tamanho_equipa: Number(newLead.tamanho_equipa)
            });
            if (response.data.status === 'success') {
                const leadId = response.data.id;
                if (newLead.tipo === 'projeto' && autoCreateTicket) {
                    try {
                        await api.post('/backend/tickets.php', {
                            lead_id: leadId,
                            assunto: `Projeto [${newLead.empresa || newLead.nome}] - Inicialização`,
                            prioridade: 'Alta'
                        });
                    } catch (err) { console.error("Erro ao criar ticket automático:", err); }
                }
                alert('Sucesso: Lead gravada no MS360!');
                setIsModalOpen(false);
                setNewLead({ 
                    nome: '', empresa: '', email: '', telemovel: '', servico: '', tipo_servico_id: '',
                    tamanho_equipa: 1, resumo: '', status: 'Novo', tipo: 'avenca',
                    banco_horas_contratado: 0, is_ilimitado: 0 
                });
                setAutoCreateTicket(false);
                fetchLeads();
            } else {
                alert('Erro do Servidor: ' + response.data.message);
            }
        } catch (err: any) {
            alert('Falha na comunicação: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <button className="lg:hidden p-2 -ml-2 text-slate-400" onClick={() => setIsMenuOpen(true)}><Menu size={20} /></button>
                    <h2 className="text-sm lg:text-xl font-black text-slate-800 flex-1 lg:flex-none uppercase tracking-tight">MS<span className="text-blue-600">360</span> Dashboard</h2>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="relative mr-2">
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 lg:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">{unreadCount}</span>}
                            </button>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 shadow-xl shadow-slate-900/10 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase text-[10px] lg:text-xs tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"> <Plus size={14} /> <span className="hidden sm:inline">Nova Lead</span><span className="sm:hidden">Novo</span></button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                    <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[9px] lg:text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-4 lg:px-10 py-4 lg:py-6">Lead / Empresa</th>
                                    <th className="px-4 lg:px-10 py-4 lg:py-6 text-center">Banco Horas</th>
                                    <th className="px-4 lg:px-10 py-4 lg:py-6 text-center">Status</th>
                                    <th className="px-4 lg:px-10 py-4 lg:py-6 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-10 text-center font-bold text-slate-400">A carregar registos...</td></tr>
                                ) : leads.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Nenhuma lead encontrada.</td></tr>
                                ) : leads.map(lead => (
                                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-blue-50/50 cursor-pointer transition-all group">
                                        <td className="px-4 lg:px-10 py-3 lg:py-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: (lead as any).servico_cor || '#3b82f6' }}>
                                                {/* Fallback for icon display if needed, but keeping it minimalist */}
                                                <span className="text-[10px] font-black uppercase italic tracking-tighter">{(lead as any).servico_nome?.charAt(0) || 'S'}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase text-xs lg:text-sm leading-tight group-hover:text-blue-600 transition-colors">{lead.nome}</p>
                                                <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase leading-tight">{lead.empresa}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-10 py-3 lg:py-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`text-xs font-black ${Number(lead.banco_horas_restantes) <= 1 ? 'text-red-600' : 'text-slate-900'}`}>
                                                    {lead.is_ilimitado ? '∞' : `${parseFloat(lead.banco_horas_restantes).toFixed(1)}h`}
                                                </span>
                                                {!lead.is_ilimitado && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">restantes</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-10 py-3 lg:py-6 text-center">
                                            <span className="px-2 py-0.5 lg:px-3 lg:py-1 bg-blue-50 text-blue-600 rounded lg:rounded-lg text-[9px] lg:text-[10px] font-black border border-blue-100 uppercase italic tracking-widest">{lead.status}</span>
                                        </td>
                                        <td className="px-4 lg:px-10 py-3 lg:py-6 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Eliminar?')) { api.delete(`/backend/api.php?id=${lead.id}`).then(() => fetchLeads()); }}} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16}/></button>
                                                <ArrowRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={18}/>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl p-6 sm:p-10 animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 sm:duration-200 h-[90vh] sm:h-auto overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 sm:mb-8 sticky top-0 bg-white pb-2 z-10">
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Nova Lead</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAddLead} className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Responsável</label>
                                    <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm" 
                                           value={newLead.nome} onChange={e => setNewLead({...newLead, nome: e.target.value})} placeholder="Ex: João"/></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Empresa</label>
                                    <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm" 
                                           value={newLead.empresa} onChange={e => setNewLead({...newLead, empresa: e.target.value})} placeholder="Monitor de Surpresas"/></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Email</label>
                                    <input type="email" required className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm"
                                           value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} placeholder="ana@email.com"/></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Telemóvel</label>
                                    <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm"
                                           value={newLead.telemovel} onChange={e => setNewLead({...newLead, telemovel: e.target.value})} placeholder="912..."/></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Serviço Principal</label>
                                    <select required className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm"
                                            value={newLead.tipo_servico_id} onChange={e => setNewLead({...newLead, tipo_servico_id: e.target.value})}>
                                        <option value="">Selecionar Serviço...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome}</option>
                                        ))}
                                    </select></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Equipa</label>
                                    <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm"
                                           value={newLead.tamanho_equipa} onChange={e => setNewLead({...newLead, tamanho_equipa: parseInt(e.target.value)})}/></div>
                                <div><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Horas Contratadas</label>
                                    <input type="number" step="0.5" className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-bold text-sm"
                                           value={newLead.banco_horas_contratado} onChange={e => setNewLead({...newLead, banco_horas_contratado: parseFloat(e.target.value)})}/></div>
                                <div className="flex items-center gap-3 pt-6"><input type="checkbox" id="unlimited" className="w-5 h-5 accent-blue-600 rounded"
                                           checked={newLead.is_ilimitado === 1} onChange={e => setNewLead({...newLead, is_ilimitado: e.target.checked ? 1 : 0})}/>
                                    <label htmlFor="unlimited" className="text-[10px] font-black text-slate-600 uppercase">Horas Ilimitadas</label></div>
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tipo de Contrato</label>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setNewLead({...newLead, tipo: 'avenca'})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${newLead.tipo === 'avenca' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-50 text-slate-400'}`}>Avença Mensal</button>
                                        <button type="button" onClick={() => setNewLead({...newLead, tipo: 'projeto'})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${newLead.tipo === 'projeto' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100' : 'bg-slate-50 border-slate-50 text-slate-400'}`}>Projeto</button>
                                    </div>
                                </div>
                                {newLead.tipo === 'projeto' && (
                                    <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-100/50 flex items-center gap-4 transition-all animate-in zoom-in-95 duration-200">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors cursor-pointer ${autoCreateTicket ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-200'}`} onClick={() => setAutoCreateTicket(!autoCreateTicket)}>
                                            {autoCreateTicket && <Save size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">CRIAR TICKET DE PROJETO AUTOMÁTICO?</p>
                                            <p className="text-[9px] text-blue-600 font-medium leading-none">O MS360 abrirá imediatamente um ticket no suporte para iniciar este projeto.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="md:col-span-2"><label className="block text-[9px] lg:text-[10px] font-black text-slate-400 mb-1 uppercase">Resumo</label>
                                    <textarea className="w-full bg-slate-50 border-2 border-slate-100 p-3 lg:p-4 rounded-xl font-medium text-sm h-20 sm:h-24"
                                              value={newLead.resumo} onChange={e => setNewLead({...newLead, resumo: e.target.value})} /></div>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-black py-4 lg:py-5 rounded-xl lg:rounded-2xl shadow-xl flex items-center justify-center gap-3 lg:gap-4 transition-all hover:bg-blue-700 disabled:opacity-50 mt-2">
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                                {submitting ? 'A GUARDAR...' : 'GUARDAR LEAD'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isNotifOpen && (
                <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-[60] shadow-2xl border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-sm"><Bell size={16} className="text-blue-600"/> Notificações</h3>
                        <div className="flex gap-2">
                             <button onClick={() => markAsRead()} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Marcar tudo</button>
                             <button onClick={() => setIsNotifOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 Transition-all"><X size={18}/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-2">
                        {notifications.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                <Info size={32} className="mb-2 opacity-20"/>
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Tudo em dia!</p>
                            </div>
                        ) : notifications.map(n => (
                            <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-white opacity-60 grayscale' : 'bg-white shadow-sm border-slate-100'}`}>
                                <div className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.tipo === 'erro' ? 'bg-red-50 text-red-500' : n.tipo === 'aviso' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {n.tipo === 'erro' ? <AlertCircle size={16}/> : n.tipo === 'aviso' ? <AlertTriangle size={16}/> : <Info size={16}/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-slate-900 leading-tight uppercase mb-0.5">{n.titulo}</p>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mb-2">{n.mensagem}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(n.data_criacao).toLocaleTimeString()}</span>
                                            {!n.is_read && <button onClick={() => markAsRead(n.id)} className="text-[9px] font-black text-blue-600 uppercase hover:bg-blue-50 px-2 py-1 rounded-lg">Marcar como lida</button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                         <button onClick={() => { if(confirm('Limpar histórico lido?')) api.delete('/backend/notifications.php').then(() => fetchNotifications()); }} className="w-full text-center text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all">Limpar Histórico</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
