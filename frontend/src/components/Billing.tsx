import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, 
  Menu, X, Download, Eye, 
  Clock, AlertTriangle, CheckCircle, Zap,
  CreditCard, Calendar, BarChart3, TrendingUp,
  Loader2, Save, Trash2
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface BillingAlert {
    id: number; lead_id: number; lead_nome: string; lead_empresa: string;
    valor: number; periodicidade: string; proxima_fatura: string;
    dias_restantes: number; status: string; descricao: string;
}

const Billing: React.FC = () => {
    const [alerts, setAlerts] = useState<BillingAlert[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // New Alert State
    const [newAlert, setNewAlert] = useState({
        lead_id: '', valor: '', periodicidade: 'Mensal', proxima_fatura: '', descricao: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [alertRes, leadRes] = await Promise.all([
                api.get('/backend/billing.php'),
                api.get('/backend/api.php')
            ]);
            setAlerts(Array.isArray(alertRes.data) ? alertRes.data : []);
            setLeads(leadRes.data || []);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/backend/billing.php', newAlert);
            setIsCreateModalOpen(false);
            setNewAlert({ lead_id: '', valor: '', periodicidade: 'Mensal', proxima_fatura: '', descricao: '' });
            fetchData();
        } catch (err) { alert("Erro ao criar alarme."); } finally { setSubmitting(false); }
    };

    const handleRenew = async (id: number) => {
        try {
            await api.put('/backend/billing.php', { id, renew: true });
            fetchData();
        } catch (err) { alert("Erro ao renovar alarme."); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remover este alarme de faturação?")) return;
        try {
            await api.delete(`/backend/billing.php?id=${id}`);
            fetchData();
        } catch (err) { alert("Erro ao remover."); }
    };

    const metrics = [
        { label: 'Total Faturado', value: '12.450€', trend: '+12%', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
        { label: 'Alarmes Ativos', value: alerts.length.toString(), trend: 'Próx. 30 dias', icon: Clock, color: 'text-amber-600 bg-amber-50' },
        { label: 'Em Dívida', value: '3.120€', trend: '-2%', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative italic">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden not-italic">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-600 rounded-xl hover:bg-slate-50" onClick={() => setIsMenuOpen(true)}>
                            <Menu size={20}/>
                        </button>
                        <div>
                            <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Faturação & Alarmes</h2>
                            <p className="text-[9px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lembretes Automáticos MS360</p>
                        </div>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2 leading-none hover:scale-[1.02]">
                        <Plus size={14}/> <span>Configurar Alarme</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8 lg:space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`${m.color} p-4 rounded-2xl`}>
                                        <m.icon size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                        <TrendingUp size={14}/> {m.trend}
                                    </div>
                                </div>
                                <div className="mt-8 relative z-10">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{m.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-8 lg:p-10 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic">Agendamentos de Faturação</h3>
                            <div className="relative group flex-1 lg:max-w-xs">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                <input className="bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 pl-12 pr-6 py-4 rounded-2xl transition-all outline-none font-bold text-sm w-full" placeholder="Procurar alarmes..."/>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                    <tr>
                                        <th className="px-10 py-6">Cliente / Serviço</th>
                                        <th className="px-10 py-6 text-center">Frequência</th>
                                        <th className="px-10 py-6 text-center">Próx. Fatura</th>
                                        <th className="px-10 py-6 text-center">Valor</th>
                                        <th className="px-10 py-6 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic animate-pulse">A carregar registos...</td></tr>
                                    ) : alerts.length === 0 ? (
                                        <tr><td colSpan={5} className="py-32 text-center text-slate-200 font-black uppercase tracking-[0.3em] italic">Nenhum alarme configurado.</td></tr>
                                    ) : alerts.map(a => (
                                        <tr key={a.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <Zap size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 uppercase text-xs italic leading-none mb-1">{a.lead_empresa || a.lead_nome}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]">{a.descricao || 'Subscrição Recorrente'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest italic">{a.periodicidade}</span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-900">{new Date(a.proxima_fatura).toLocaleDateString()}</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${a.dias_restantes <= 5 ? 'text-red-500' : 'text-blue-500'}`}>
                                                        {a.dias_restantes <= 0 ? 'VENCIDO' : `EM ${a.dias_restantes} DIAS`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center text-sm font-black text-slate-900">{parseFloat(a.valor.toString()).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button onClick={() => handleRenew(a.id)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm" title="Renovar / Antecipar"><CheckCircle size={18}/></button>
                                                    <button onClick={() => handleDelete(a.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm" title="Eliminar"><Trash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Novo Alarme Recorrente</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreateAlert} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Cliente / Lead</label>
                                <select required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-blue-600 outline-none transition-all"
                                        value={newAlert.lead_id} onChange={e => setNewAlert({...newAlert, lead_id: e.target.value})}>
                                    <option value="">Selecionar Cliente...</option>
                                    {leads.map(l => <option key={l.id} value={l.id}>{l.empresa || l.nome}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Valor (€)</label>
                                    <input type="number" required step="0.01" className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm outline-none transition-all focus:bg-white focus:border-blue-600"
                                           value={newAlert.valor} onChange={e => setNewAlert({...newAlert, valor: e.target.value})} placeholder="0.00"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Periodicidade</label>
                                    <select className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase outline-none transition-all focus:bg-white focus:border-blue-600"
                                            value={newAlert.periodicidade} onChange={e => setNewAlert({...newAlert, periodicidade: e.target.value})}>
                                        <option value="Mensal">Mensal</option>
                                        <option value="Trimestral">Trimestral</option>
                                        <option value="Semestral">Semestral</option>
                                        <option value="Anual">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Data Próxima Fatura</label>
                                <input type="date" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase outline-none transition-all"
                                       value={newAlert.proxima_fatura} onChange={e => setNewAlert({...newAlert, proxima_fatura: e.target.value})} />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4 hover:bg-blue-700 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24}/>} {submitting ? 'A GUARDAR...' : 'ATIVAR ALARME'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
