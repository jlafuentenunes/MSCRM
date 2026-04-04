import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Clock, CheckCircle, AlertTriangle, 
  Save, X, Zap, Menu, FileText, LayoutDashboard
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface TicketItem {
    id: number; lead_id: number; lead_nome: string; assunto: string; 
    status: string; prioridade: string; data_abertura: string;
}

interface Intervencao {
    id: number; descricao: string; minutos_gastos: number; data_intervencao: string;
}

interface Lead { id: number; nome: string; banco_horas_restantes: string; is_ilimitado: number; }

const Tickets: React.FC = () => {
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
    
    // Form States
    const [newTicket, setNewTicket] = useState({ lead_id: '', assunto: '', prioridade: 'Média' });
    const [newIntervencao, setNewIntervencao] = useState({ descricao: '', minutos_gastos: 0 });

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const [ticketsRes, leadsRes] = await Promise.all([
                api.get('/backend/tickets.php'),
                api.get('/backend/api.php')
            ]);
            setTickets(ticketsRes.data || []);
            setLeads(leadsRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    const fetchTicketDetails = async (id: number) => {
        try {
            const res = await api.get(`/backend/tickets.php?id=${id}`);
            setSelectedTicket(res.data.ticket);
            setIntervencoes(res.data.intervencoes);
        } catch (err) { console.error(err); }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/backend/tickets.php', newTicket);
            setIsCreateModalOpen(false);
            fetchTickets();
        } catch (err) { alert('Erro ao criar ticket.'); }
    };

    const handleAddIntervencao = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/backend/tickets.php?action=intervencao', { 
                ticket_id: selectedTicket.id, ...newIntervencao 
            });
            setNewIntervencao({ descricao: '', minutos_gastos: 0 });
            fetchTicketDetails(selectedTicket.id);
        } catch (err) { alert('Erro ao adicionar tarefa.'); }
    };

    const handleCloseTicket = async () => {
        if (!confirm('Deseja encerrar este ticket e descontar o tempo do banco de horas?')) return;
        try {
            await api.put('/backend/tickets.php?action=close', { id: selectedTicket.id });
            setSelectedTicket(null);
            fetchTickets();
        } catch (err) { alert('Erro ao fechar ticket.'); }
    };

    const formatMinutes = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}h${m.toString().padStart(2, '0')}m`;
    };

    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'Crítica': return 'text-red-600 bg-red-50 border-red-100';
            case 'Alta': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'Média': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-lg lg:rounded-xl items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                            <Ticket size={16} className="lg:w-5 lg:h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Suporte & Tickets</h2>
                            <p className="hidden xs:block text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Incidências GLPI</p>
                        </div>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 shadow-xl shadow-slate-900/10 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase text-[10px] lg:text-xs tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"> <Plus size={14} /> <span className="hidden sm:inline">Novo Ticket</span><span className="sm:hidden">Novo</span></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8">
                    {/* Tickets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic animate-pulse">Consultando tickets no servidor...</div>
                        ) : tickets.length === 0 ? (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <LayoutDashboard className="text-slate-100 w-24 h-24 mb-4" />
                                <p className="text-xs text-slate-400 font-black uppercase italic tracking-widest">Nenhum ticket aberto de momento.</p>
                            </div>
                        ) : tickets.map(t => (
                            <div key={t.id} onClick={() => { fetchTicketDetails(t.id); }} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group active:scale-[0.98]">
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest border ${getPriorityColor(t.prioridade)}`}>
                                        {t.prioridade}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300">#{t.id}</span>
                                </div>
                                <h3 className="font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors text-lg tracking-tighter uppercase italic">{t.assunto}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">{t.lead_nome}</p>
                                
                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <Clock size={14} className="mr-2 text-blue-500" /> {new Date(t.data_abertura).toLocaleDateString()}
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${t.status === 'Aberto' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                        {t.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal Detalhes do Ticket (Estilo Sheet Mobile) */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white w-full lg:max-w-4xl h-[90vh] lg:h-auto lg:max-h-[90vh] rounded-t-[40px] lg:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <header className="p-8 lg:p-12 border-b border-slate-100 flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl uppercase tracking-[0.2em]">TICKET #{selectedTicket.id}</span>
                                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] border ${getPriorityColor(selectedTicket.prioridade)}`}>{selectedTicket.prioridade}</span>
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">{selectedTicket.assunto}</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-4">Cliente: <span className="text-blue-600">{selectedTicket.lead_nome}</span> • <span className="italic">{selectedTicket.lead_empresa}</span></p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all active:scale-90"><X size={24}/></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col lg:flex-row gap-12">
                            {/* Intervenções */}
                            <div className="flex-1 space-y-10">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                    <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs flex items-center gap-3 italic">
                                        <div className="w-2 h-6 bg-blue-600 rounded-full" /> Tarefas Realizadas
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">Total: {formatMinutes(intervencoes.reduce((acc, curr) => acc + curr.minutos_gastos, 0))}</p>
                                </div>

                                <div className="space-y-6">
                                    {intervencoes.map(i => (
                                        <div key={i.id} className="bg-slate-50 p-6 lg:p-8 rounded-[32px] border border-slate-100 group relative hover:bg-white hover:border-blue-100 transition-all shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(i.data_intervencao).toLocaleString()}</span>
                                                <span className="font-black text-blue-600 text-sm tracking-tighter uppercase italic">{formatMinutes(i.minutos_gastos)}</span>
                                            </div>
                                            <p className="text-sm lg:text-base font-medium text-slate-700 leading-relaxed italic">{i.descricao}</p>
                                        </div>
                                    ))}
                                    {intervencoes.length === 0 && (
                                        <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">A aguardar descrição de tarefas...</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Nova Intervencao */}
                                <form onSubmit={handleAddIntervencao} className="bg-white p-8 lg:p-10 rounded-[40px] border-4 border-slate-50 space-y-6 mt-12 shadow-inner">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Plus size={16} className="text-blue-600"/>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Registar Nova Intervenção</p>
                                    </div>
                                    <textarea 
                                        required placeholder="Descreva tecnicamente o que foi executado..." 
                                        className="w-full bg-slate-50 p-6 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium h-32 italic"
                                        value={newIntervencao.descricao} onChange={e => setNewIntervencao({...newIntervencao, descricao: e.target.value})}
                                    />
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <input type="number" required placeholder="Tempo em minutos" className="w-full bg-slate-50 p-5 rounded-[20px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-black uppercase tracking-tighter text-blue-600"
                                                 value={newIntervencao.minutos_gastos || ''} onChange={e => setNewIntervencao({...newIntervencao, minutos_gastos: intval(e.target.value)})} />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">MIN</span>
                                        </div>
                                        <button type="submit" className="bg-blue-600 text-white px-10 py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                                            <Save size={18}/> REGISTAR
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Sidebar Detalhes */}
                            <div className="w-full lg:w-80 shrink-0 space-y-8">
                                <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                                    <Zap className="absolute -top-6 -right-6 text-white/5 w-32 h-32 group-hover:scale-110 transition-transform duration-500" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 relative z-10">Banco de Horas</p>
                                    <div className="space-y-8 relative z-10">
                                        <div>
                                            <p className="text-5xl font-black tracking-tighter italic">{selectedTicket.is_ilimitado ? '∞' : `${parseFloat(selectedTicket.banco_horas_restantes).toFixed(1)}h`}</p>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-2">Disponibilidade atual</p>
                                        </div>
                                        {selectedTicket.status !== 'Fechado' && (
                                            <button onClick={handleCloseTicket} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[24px] text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3">
                                                <CheckCircle size={20}/> ENCERRAR AGORA
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-[40px] p-8 border border-amber-100 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <AlertTriangle size={48} className="text-amber-600"/>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4 text-amber-600 font-extrabold text-xs uppercase tracking-widest italic">
                                        Procedimento GLPI
                                    </div>
                                    <p className="text-xs lg:text-[13px] text-amber-800 font-bold leading-relaxed italic opacity-80">
                                        Garanta que detalha tecnicamente cada intervenção. No encerramento, o tempo total é abatido em tempo real e notificado via email ao cliente responsável.
                                    </p>
                                </div>
                                <button className="w-full py-5 rounded-[24px] border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-4 group">
                                    <FileText size={18} className="group-hover:rotate-12 transition-transform" /> VER HISTÓRICO CLIENTE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Novo Ticket */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl p-10 lg:p-14 animate-in zoom-in-95 duration-300 border-[12px] border-slate-50">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Plus className="text-white" size={24}/>
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Nova Incidência</h3>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all active:scale-90"><X/></button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.3em] ml-2 italic underline decoration-blue-500 decoration-2 transition-all">Seleção de Entidade</label>
                                <select required className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-black text-sm transition-all uppercase tracking-tight"
                                    value={newTicket.lead_id} onChange={e => setNewTicket({...newTicket, lead_id: e.target.value})}>
                                    <option value="" className="font-bold">Procurar Cliente no ERP...</option>
                                    {leads.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.banco_horas_restantes}h)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.3em] ml-2 italic underline decoration-blue-500 decoration-2 transition-all">Título do Evento</label>
                                <input required type="text" className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-black text-sm transition-all italic placeholder:text-slate-300"
                                    value={newTicket.assunto} onChange={e => setNewTicket({...newTicket, assunto: e.target.value})} placeholder="Descreva brevemente o problema..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-2 italic">Nível de Impacto</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {['Baixa', 'Média', 'Alta', 'Crítica'].map(p => (
                                        <button key={p} type="button" onClick={() => setNewTicket({...newTicket, prioridade: p})} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${newTicket.prioridade === p ? (p === 'Crítica' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100') : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[28px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black active:scale-95 transition-all text-sm uppercase tracking-[0.3em] mt-6">
                                <Zap size={20} className="fill-white"/> ABRIR TICKET GLPI
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper inside component since it's simple
const intval = (v: any) => parseInt(v) || 0;

export default Tickets;
