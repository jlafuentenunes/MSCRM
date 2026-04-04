import React, { useState, useEffect } from 'react';
import { 
    Plus, Briefcase, Clock, Menu,
    ChevronRight, List, Calendar,
    CheckCircle, PlayCircle, Loader2, X, Save
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface Project {
    id: number;
    lead_id: number;
    lead_nome: string;
    lead_empresa: string;
    servico_nome: string;
    servico_cor: string;
    nome: string;
    descricao: string;
    status: 'Planeamento' | 'Ativo' | 'Pausado' | 'Concluído' | 'Cancelado';
    data_inicio: string;
    data_fim_prevista: string;
    progresso: number;
}

interface Task {
    id: number;
    project_id: number;
    titulo: string;
    descricao: string;
    prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    status: 'Pendente' | 'Em Progresso' | 'Revisão' | 'Concluído';
    horas_estimadas: number;
    horas_gastas: number;
    data_limite: string;
}

const ProjectManager: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [view, setView] = useState<'cards' | 'timeline'>('cards');
    
    // Form States
    const [newProject, setNewProject] = useState({
        lead_id: '', nome: '', descricao: '', tipo_servico_id: '',
        data_inicio: '', data_fim_prevista: '', status: 'Planeamento'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, leadRes, servRes] = await Promise.all([
                api.get('/backend/projects.php'),
                api.get('/backend/api.php'),
                api.get('/backend/services.php')
            ]);
            setProjects(projRes.data.data || []);
            setLeads(leadRes.data || []);
            setServices(servRes.data.data || []);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async (projectId: number) => {
        try {
            const res = await api.get(`/backend/projects.php?action=tasks&project_id=${projectId}`);
            setTasks(res.data.data || []);
        } catch (err) {
            console.error("Erro ao carregar tarefas:", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/backend/projects.php', newProject);
            setIsCreateModalOpen(false);
            setNewProject({
                lead_id: '', nome: '', descricao: '', tipo_servico_id: '',
                data_inicio: '', data_fim_prevista: '', status: 'Planeamento'
            });
            fetchData();
        } catch (err) {
            alert("Erro ao criar projeto.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Planeamento': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Pausado': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Concluído': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative italic">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden not-italic">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-lg lg:rounded-xl items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                            <Briefcase size={16} className="lg:w-5 lg:h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Projetos</h2>
                            <p className="hidden xs:block text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Organização de Entregas</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                            <button onClick={() => setView('cards')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Cards</button>
                            <button onClick={() => setView('timeline')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Timeline</button>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase text-[10px] lg:text-xs tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 leading-none">
                            <Plus size={14} /> <span className="hidden sm:inline">Novo Projeto</span><span className="sm:hidden">Novo</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-12 animate-in fade-in duration-500">
                    {loading && projects.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">A carregar portfólio...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
                            <Briefcase className="mx-auto text-slate-200 mb-6 focus:animate-bounce" size={64} />
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Nenhum Projeto Ativo</h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Começa a organizar o teu fluxo de trabalho criando o teu primeiro projeto agora.</p>
                        </div>
                    ) : view === 'cards' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {projects.map(proj => (
                                <div key={proj.id} onClick={() => { setSelectedProject(proj); fetchTasks(proj.id); }} className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="absolute top-0 right-0 p-8">
                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(proj.status)}`}>
                                            {proj.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black italic shadow-sm" style={{ backgroundColor: proj.servico_cor || '#3b82f6' }}>
                                            {proj.servico_nome?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{proj.lead_empresa || proj.lead_nome}</p>
                                            <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">{proj.servico_nome}</p>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic mb-4 group-hover:text-blue-600 transition-colors">{proj.nome}</h3>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Progresso Geral</span>
                                            <span className="text-sm font-black text-slate-900">{proj.progresso}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-sm" style={{ width: `${proj.progresso}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold uppercase">{new Date(proj.data_inicio).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1 group-hover:gap-2 transition-all text-blue-600 font-black text-[10px] uppercase tracking-widest">
                                            Tasks <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-xl overflow-x-auto">
                            <div className="min-w-[800px]">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 italic flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={18} /> Cronograma de Entregas
                                </h3>
                                <div className="space-y-12">
                                    {projects.map(proj => (
                                            <div key={proj.id} className="relative group/line" onClick={() => { setSelectedProject(proj); fetchTasks(proj.id); }}>
                                                <div className="flex items-center justify-between mb-3 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: proj.servico_cor || '#3b82f6' }} />
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover/line:text-blue-600 transition-colors cursor-pointer">{proj.nome}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400">{new Date(proj.data_inicio).toLocaleDateString()} - {new Date(proj.data_fim_prevista).toLocaleDateString()}</span>
                                                </div>
                                                <div className="h-10 w-full bg-slate-50 rounded-2xl relative overflow-hidden group-hover/line:bg-slate-100 transition-colors cursor-pointer">
                                                    <div 
                                                        className="absolute top-2 bottom-2 bg-blue-600 rounded-lg shadow-lg flex items-center px-4 overflow-hidden" 
                                                        style={{ 
                                                            left: '5%', // Simplificado para demo, em real seria calculado via % do mês
                                                            width: `${Math.min(90, 20 + (proj.progresso * 0.7))}%` 
                                                        }}
                                                    >
                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter whitespace-nowrap">{proj.progresso}% Completo</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Projet Details / Tasks Overlay */}
            {selectedProject && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-all">
                    <div className="w-full lg:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <header className="p-8 lg:p-10 border-b border-slate-100 shrink-0">
                            <div className="flex justify-between items-start mb-6">
                                <button onClick={() => setSelectedProject(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={20}/></button>
                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(selectedProject.status)}`}>{selectedProject.status}</span>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{selectedProject.nome}</h3>
                            <p className="text-slate-400 text-sm font-medium mt-4 line-clamp-2">{selectedProject.descricao}</p>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs italic flex items-center gap-2">
                                    <List size={16} className="text-blue-600" /> Backlog de Tarefas
                                </h4>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Plus size={18}/></button>
                            </div>
                            <div className="space-y-3">
                                {tasks.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Sem tarefas para já.</p>
                                    </div>
                                ) : tasks.map(task => (
                                    <div key={task.id} className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all group flex items-start gap-4">
                                        <div className={`mt-1 h-5 w-5 rounded-full border-2 border-slate-200 flex items-center justify-center transition-all ${task.status === 'Concluído' ? 'bg-blue-600 border-blue-600' : ''}`}>
                                            {task.status === 'Concluído' && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className={`font-black text-slate-900 leading-none uppercase italic transition-all ${task.status === 'Concluído' ? 'line-through text-slate-300' : ''}`}>{task.titulo}</h5>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${task.prioridade === 'Crítica' ? 'bg-red-50 text-red-500' : 'bg-slate-200 text-slate-500'}`}>{task.prioridade}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-2 line-clamp-1">{task.descricao}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase"><Clock size={10}/> {task.horas_estimadas}h</div>
                                                <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase"><PlayCircle size={10}/> {task.status}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <button className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95">Editar Projeto</button>
                            <button className="py-4 text-red-500 bg-red-50 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all active:scale-95">Arquivar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Novo Projeto</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nome do Projeto</label>
                                    <input required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase italic focus:bg-white focus:border-blue-600 transition-all outline-none"
                                           value={newProject.nome} onChange={e => setNewProject({...newProject, nome: e.target.value})} placeholder="P. EX: REDESIGN WEBSITE 2026"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Descrição detalhada</label>
                                    <textarea className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-medium text-sm h-32 focus:bg-white focus:border-blue-600 transition-all outline-none"
                                           value={newProject.descricao} onChange={e => setNewProject({...newProject, descricao: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Cliente / Lead</label>
                                    <select required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-blue-600 transition-all outline-none"
                                            value={newProject.lead_id} onChange={e => setNewProject({...newProject, lead_id: e.target.value})}>
                                        <option value="">Selecionar Cliente...</option>
                                        {leads.map(l => <option key={l.id} value={l.id}>{l.empresa || l.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tipo de Serviço</label>
                                    <select required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-blue-600 transition-all outline-none"
                                            value={newProject.tipo_servico_id} onChange={e => setNewProject({...newProject, tipo_servico_id: e.target.value})}>
                                        <option value="">Selecionar Serviço...</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Data Início</label>
                                    <input type="date" className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase transition-all outline-none"
                                           value={newProject.data_inicio} onChange={e => setNewProject({...newProject, data_inicio: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Entrega Prevista</label>
                                    <input type="date" className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase transition-all outline-none"
                                           value={newProject.data_fim_prevista} onChange={e => setNewProject({...newProject, data_fim_prevista: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4 hover:bg-blue-700 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] mt-4">
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24}/>} {submitting ? 'A CRIAR...' : 'INICIAR PROJETO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;
