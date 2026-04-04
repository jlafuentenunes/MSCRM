import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Command, Users, Briefcase, 
    CheckSquare, Zap, CreditCard, Ticket, 
    Mail, Loader2, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Açôes Rápidas pré-definidas
    const quickActions = [
        { title: 'Novo Lead', type: 'Ação', icon: Users, url: '/dashboard' },
        { title: 'Nova Fatura', type: 'Ação', icon: CreditCard, url: '/billing' },
        { title: 'Criar Tarefa', type: 'Ação', icon: CheckSquare, url: '/projects' },
        { title: 'Ver Suporte', type: 'Ação', icon: Ticket, url: '/tickets' },
        { title: 'Ver Correio', type: 'Ação', icon: Mail, url: '/mail' },
        { title: 'Ver Automações', type: 'Ação', icon: Zap, url: '/automations' },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get(`/backend/search_global.php?q=${query}`);
                setResults(res.data.results || []);
                setSelectedIndex(0);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (url: string) => {
        navigate(url);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = (query.length < 2 ? quickActions.length : results.length);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = query.length < 2 ? quickActions[selectedIndex] : results[selectedIndex];
            if (selected) handleSelect(selected.url);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-indigo-500/20 border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[60vh]">
                <div className="relative border-b border-slate-100 flex items-center px-8">
                    <Search className={`w-6 h-6 mr-4 transition-colors ${loading ? 'text-blue-600' : 'text-slate-300'}`} />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onKeyDown={handleKeyDown}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="O que procuras hoje? (Lead, Projeto, Tarefa...)"
                        className="flex-1 py-10 bg-transparent outline-none font-black text-2xl text-slate-800 placeholder:text-slate-200 tracking-tighter uppercase italic"
                    />
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
                        <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 select-none">ESC</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white/50">
                    <div className="px-4 py-2 mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                            {query.length < 2 ? '⚡ Ações Rápidas' : `🔍 Resultados para "${query}"`}
                        </h4>
                    </div>

                    <div className="space-y-1">
                        {(query.length < 2 ? quickActions : results).map((item, i) => {
                            const Icon = item.icon || (item.type === 'Lead' ? Users : (item.type === 'Projeto' ? Briefcase : CheckSquare));
                            const isSelected = i === selectedIndex;

                            return (
                                <button 
                                    key={i}
                                    onClick={() => handleSelect(item.url)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase tracking-tighter italic leading-none mb-1 text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>{item.title}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{item.subtitle || item.type}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">↑↓</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Navegar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">↵</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Selecionar</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Command size={12} className="text-slate-300" />
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Ms360 Intelligence</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CommandPalette;
