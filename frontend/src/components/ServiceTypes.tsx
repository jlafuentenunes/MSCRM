import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, 
  Menu, X, Save, 
  ChevronRight, HelpCircle,
  Layout, TrendingUp, Shield, Settings, Terminal,
  Code, Megaphone, Smartphone, Box
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface ServiceType {
    id: number;
    nome: string;
    descricao: string;
    icone: string;
    cor: string;
}

const ServiceTypes: React.FC = () => {
    const [services, setServices] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<ServiceType | null>(null);

    const [newService, setNewService] = useState({
        nome: '',
        descricao: '',
        icone: 'Terminal',
        cor: '#3b82f6'
    });

    const icons = { Layout, TrendingUp, Shield, Settings, Terminal, Code, Megaphone, Smartphone, Box };

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/backend/services.php');
            setServices(response.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchServices(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put('/backend/services.php', { ...newService, id: editing.id });
            } else {
                await api.post('/backend/services.php', newService);
            }
            setIsModalOpen(false);
            setEditing(null);
            fetchServices();
        } catch (err) { alert('Erro ao guardar serviço'); }
    };

    const deleteService = async (id: number) => {
        if (!confirm('Deseja eliminar este tipo de serviço?')) return;
        try {
            await api.delete(`/backend/services.php?id=${id}`);
            fetchServices();
        } catch (err) { console.error(err); }
    };

    const editService = (s: ServiceType) => {
        setEditing(s);
        setNewService({ nome: s.nome, descricao: s.descricao, icone: s.icone, cor: s.cor });
        setIsModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(true)}><Menu size={20}/></button>
                        <div>
                             <h2 className="text-sm lg:text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic underline decoration-blue-500 decoration-4">Service <span className="text-blue-600">Types</span></h2>
                             <p className="text-[9px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Portfólio MS360</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditing(null); setNewService({ nome:'', descricao:'', icone:'Terminal', cor:'#3b82f6'}); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95">
                        <Plus size={16}/> <span>Novo Serviço</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {loading ? (
                             <div className="col-span-full p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando serviços...</div>
                         ) : services.length === 0 ? (
                             <div className="col-span-full p-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                                 <HelpCircle className="mx-auto text-slate-100 mb-4" size={48}/>
                                 <p className="text-xs font-black text-slate-400 uppercase italic">Nenhum serviço definido.</p>
                             </div>
                         ) : services.map((s) => {
                             const Icon = (icons as any)[s.icone] || Terminal;
                             return (
                                 <div key={s.id} className="bg-white p-6 lg:p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                         <button onClick={() => editService(s)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl"><Edit2 size={16}/></button>
                                         <button onClick={() => deleteService(s.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl"><Trash2 size={16}/></button>
                                     </div>
                                     <div className="w-16 h-16 rounded-[24px] mb-6 flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: s.cor }}>
                                         <Icon size={28} />
                                     </div>
                                     <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{s.nome}</h3>
                                     <p className="text-xs text-slate-400 font-medium leading-relaxed mt-4 line-clamp-2">
                                         {s.descricao || "Sem descrição disponível para este serviço."}
                                     </p>
                                     <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ativo no Portfólio</span>
                                         <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                </div>
            </main>

            {/* Modal de Criação / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full sm:max-w-xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl p-8 sm:p-12 animate-in slide-in-from-bottom duration-400">
                         <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{editing ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Personaliza o teu portfólio MS360</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24}/></button>
                         </div>

                         <form onSubmit={handleSave} className="space-y-6">
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2 italic">Nome do Serviço</label>
                                <input required className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-black text-sm italic" 
                                       placeholder="Ex: Web Design" value={newService.nome} onChange={e => setNewService({...newService, nome: e.target.value})} />
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2 italic">Ícone</label>
                                    <select className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent outline-none font-black text-sm uppercase italic"
                                            value={newService.icone} onChange={e => setNewService({...newService, icone: e.target.value})}>
                                        {Object.keys(icons).map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2 italic">Cor da Marca</label>
                                    <input type="color" className="w-full h-15 bg-slate-50 p-2 rounded-[24px] border-2 border-transparent cursor-pointer" 
                                           value={newService.cor} onChange={e => setNewService({...newService, cor: e.target.value})} />
                                 </div>
                             </div>

                             <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2 italic">Descrição (Opcional)</label>
                                <textarea className="w-full bg-slate-50 p-5 rounded-[24px] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none font-medium text-sm h-32" 
                                       placeholder="Descreve o serviço..." value={newService.descricao} onChange={e => setNewService({...newService, descricao: e.target.value})} />
                             </div>

                             <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">
                                 <Save size={20}/> Guardar Alterações
                             </button>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceTypes;
