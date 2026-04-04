import React, { useState, useEffect } from 'react';
import { 
  Plus, Play, Trash2, Zap, 
  Menu, X, Save, 
  Clock, Mail, AlertTriangle, 
  Activity, ToggleLeft, ToggleRight,
  CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface Automation {
    id: number;
    nome: string;
    gatilho: 'horario' | 'email_recebido' | 'saldo_critico' | 'fatura_vencida';
    gatilho_config: any;
    condicao: any;
    acao: 'enviar_resumo' | 'notificacao_push' | 'mudar_status_lead' | 'sync_mail';
    acao_config: any;
    is_active: number;
    last_run: string | null;
}

const AutomationManager: React.FC = () => {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newRule, setNewRule] = useState<any>({
        nome: '',
        gatilho: 'horario',
        gatilho_config: { hora: '09:00' },
        condicao: {},
        acao: 'enviar_resumo',
        acao_config: { destinatario: 'meu@email.com', mensagem: '' },
        is_active: 1
    });

    const fetchAutomations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/backend/automations.php');
            setAutomations(response.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAutomations(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/backend/automations.php', newRule);
            setIsModalOpen(false);
            fetchAutomations();
        } catch (err) { alert('Erro ao criar automação'); }
    };

    const toggleActive = async (id: number) => {
        try {
            await api.put('/backend/automations.php', { id, toggle_active: true });
            fetchAutomations();
        } catch (err) { console.error(err); }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('Deseja eliminar esta automação?')) return;
        try {
            await api.delete(`/backend/automations.php?id=${id}`);
            fetchAutomations();
        } catch (err) { console.error(err); }
    };

    const getTriggerIcon = (g: string) => {
        switch(g) {
            case 'horario': return <Clock className="text-blue-500" size={18}/>;
            case 'email_recebido': return <Mail className="text-indigo-500" size={18}/>;
            case 'saldo_critico': return <AlertTriangle className="text-amber-500" size={18}/>;
            default: return <Zap className="text-blue-500" size={18}/>;
        }
    };

    const getActionLabel = (a: string) => {
        switch(a) {
            case 'enviar_resumo': return 'Enviar Resumo p/ Email';
            case 'notificacao_push': return 'Notificação Push App';
            case 'mudar_status_lead': return 'Alterar Estado Lead';
            case 'sync_mail': return 'Sincronizar Correio';
            default: return a;
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
                        <div className="hidden sm:flex w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg lg:rounded-xl items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
                            <Zap size={16} className="lg:w-5 lg:h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Automações</h2>
                            <p className="hidden xs:block text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rule Engine MS360</p>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95">
                        <Plus size={16}/> <span>Criar Regra</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8">
                     {/* Dashboard Stats */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                             <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Activity size={24}/></div>
                             <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ativas agora</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{automations.filter(a => a.is_active).length}</h3></div>
                         </div>
                         <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                             <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><CheckCircle2 size={24}/></div>
                             <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Execuções 24h</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">128</h3></div>
                         </div>
                         <div className="bg-blue-600 p-6 lg:p-8 rounded-[32px] shadow-xl shadow-blue-100 flex items-center gap-6 text-white overflow-hidden relative">
                             <Zap className="absolute -top-4 -right-4 w-24 h-24 text-white/10" />
                             <div className="relative z-10"><p className="text-xs font-black uppercase tracking-widest opacity-80">Workflow Status</p><h3 className="text-2xl font-black leading-none mt-1 uppercase italic tracking-tighter">Otimizado</h3></div>
                         </div>
                     </div>

                     {/* Automation List */}
                     <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">As minhas regras automáticas</h3>
                         {loading ? (
                             <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando regras...</div>
                         ) : automations.length === 0 ? (
                             <div className="p-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                                 <HelpCircle className="mx-auto text-slate-100 mb-4" size={48}/>
                                 <p className="text-xs font-black text-slate-400 uppercase italic">Ainda não tens nenhuma automação criada.</p>
                             </div>
                         ) : automations.map((rule) => (
                             <div key={rule.id} className={`bg-white p-6 lg:p-8 rounded-[32px] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl ${rule.is_active ? 'border-slate-100' : 'border-slate-200 bg-slate-50/50 opacity-70 grayscale'}`}>
                                 <div className="flex items-center gap-6">
                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${rule.is_active ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                         {getTriggerIcon(rule.gatilho)}
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-3">
                                            <h4 className="font-black text-slate-900 text-lg tracking-tighter uppercase italic">{rule.nome}</h4>
                                            {rule.is_active ? <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic tracking-widest animate-pulse">Live</span> : <span className="bg-slate-100 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Pausada</span>}
                                         </div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                             Se <span className="text-blue-600 italic">{rule.gatilho}</span> ENTÃO <span className="text-indigo-600 italic">{getActionLabel(rule.acao)}</span>
                                         </p>
                                     </div>
                                 </div>

                                 <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-8 border-t lg:border-none pt-4 lg:pt-0">
                                     <div className="text-center lg:text-right">
                                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Última Execução</p>
                                         <p className="text-[10px] font-bold text-slate-500 uppercase">{rule.last_run ? new Date(rule.last_run).toLocaleString('pt-PT') : 'Nunca correu'}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => toggleActive(rule.id)} className={`p-3 rounded-xl transition-all ${rule.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                             {rule.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                         </button>
                                         <button onClick={() => deleteRule(rule.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                             <Trash2 size={20}/>
                                         </button>
                                         <button className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                             <ChevronRight size={20}/>
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </main>

            {/* Modal de Criação (Estilo Mobile-Sheet) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full sm:max-w-xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl p-8 sm:p-12 animate-in slide-in-from-bottom duration-400 sm:zoom-in-95 h-[90vh] sm:h-auto overflow-y-auto">
                         <div className="flex justify-between items-center mb-10 sticky top-0 bg-white pb-2 z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Novo Fluxo Inteligente</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Define um gatilho e uma ação</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24}/></button>
                         </div>

                         <form onSubmit={handleCreate} className="space-y-8">
                             {/* Secção Nome */}
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-2 italic underline decoration-blue-500 decoration-2">Identificação da Regra</label>
                                <input required className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-black text-sm italic" 
                                       placeholder="Ex: Briefing de Mails das 9h" value={newRule.nome} onChange={e => setNewRule({...newRule, nome: e.target.value})} />
                             </div>

                             {/* Secção Gatilho (Trigger) */}
                             <div className="bg-blue-50/30 p-8 rounded-[40px] border-2 border-blue-100/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Zap className="text-blue-600 fill-blue-600/20" size={20}/>
                                    <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic">QUANDO acontece isto...</h4>
                                </div>
                                <select className="w-full bg-white p-5 rounded-[24px] border-2 border-transparent shadow-sm font-black text-sm uppercase tracking-tight"
                                        value={newRule.gatilho} onChange={e => setNewRule({...newRule, gatilho: e.target.value as any})}>
                                    <option value="horario">📅 Horário Agendado (Diário)</option>
                                    <option value="email_recebido">📧 Chegada de Novo Email</option>
                                    <option value="saldo_critico">⚠️ Saldo de Horas Crítico</option>
                                    <option value="fatura_vencida">📉 Fatura Vencida</option>
                                </select>
                                {newRule.gatilho === 'horario' && (
                                    <div className="flex items-center gap-4 animate-in zoom-in-95 duration-200">
                                        <input type="time" className="flex-1 bg-white p-5 rounded-[20px] border-2 border-transparent shadow-sm font-black text-lg text-blue-600 text-center" 
                                               value={newRule.gatilho_config.hora} onChange={e => setNewRule({...newRule, gatilho_config: { hora: e.target.value }})} />
                                        <p className="text-[10px] font-black text-blue-400 uppercase italic w-24">Hora local do servidor</p>
                                    </div>
                                )}
                             </div>

                             {/* Secção Ação */}
                             <div className="bg-indigo-50/30 p-8 rounded-[40px] border-2 border-indigo-100/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Play className="text-indigo-600 fill-indigo-600/20" size={18}/>
                                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest italic">FAZER esta ação...</h4>
                                </div>
                                <select className="w-full bg-white p-5 rounded-[24px] border-2 border-transparent shadow-sm font-black text-sm uppercase tracking-tight"
                                        value={newRule.acao} onChange={e => setNewRule({...newRule, acao: e.target.value as any})}>
                                    <option value="enviar_resumo">📩 Enviar Resumo (Para Mim)</option>
                                    <option value="enviar_email_cliente">✉️ Enviar Alerta p/ Cliente (Lead)</option>
                                    <option value="notificacao_push">📱 Notificação no Sino</option>
                                    <option value="mudar_status_lead">🔄 Alterar Status Lead</option>
                                </select>
                                {newRule.acao === 'enviar_resumo' && (
                                    <div className="animate-in zoom-in-95 duration-200">
                                        <label className="block text-[8px] font-black text-indigo-400 mb-2 uppercase tracking-widest ml-4 italic">Destinatário do Relatório</label>
                                        <input type="email" className="w-full bg-white p-5 rounded-[20px] border-2 border-transparent shadow-sm font-black text-xs text-indigo-600" 
                                               placeholder="eu@email.com" value={newRule.acao_config.destinatario} onChange={e => setNewRule({...newRule, acao_config: { destinatario: e.target.value }})} />
                                    </div>
                                )}
                                {newRule.acao === 'enviar_email_cliente' && (
                                    <div className="animate-in zoom-in-95 duration-200 space-y-4">
                                        <label className="block text-[8px] font-black text-indigo-400 mb-2 uppercase tracking-widest ml-4 italic">Template da Mensagem Automática</label>
                                        <textarea className="w-full bg-white p-5 rounded-[20px] border-2 border-transparent shadow-sm font-medium text-xs text-indigo-600 h-24" 
                                               placeholder="Olá [NOME], notamos que..." value={newRule.acao_config.mensagem} onChange={e => setNewRule({...newRule, acao_config: { ...newRule.acao_config, mensagem: e.target.value }})} />
                                    </div>
                                )}
                             </div>

                             <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">
                                 <Save size={20}/> Ativar Automação
                             </button>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationManager;
