import React, { useState, useEffect } from 'react';
import { 
  Zap, Mail, Inbox, Send, Trash, Edit3, Search, 
  Menu, X, RefreshCcw, Loader2, Star, 
  Paperclip, ChevronRight, User, Calendar, MoreVertical
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

interface Message {
    id: number;
    subject: string;
    from: string;
    date: string;
    is_read: boolean;
    snippet?: string;
}

const Mailbox: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [activeFolder, setActiveFolder] = useState('INBOX');

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/backend/mailbox.php?action=list_messages');
            if (res.data.status === 'success') {
                setMessages(res.data.messages || []);
            } else {
                console.error("Erro da API:", res.data.message);
            }
        } catch (err) {
            console.error("Erro ao carregar mensagens:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="h-16 lg:px-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
                    <button className="p-2 -ml-2 text-slate-400" onClick={() => setIsMenuOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Correio <span className="text-blue-600">Inbox</span></h2>
                    <Zap className="text-blue-600 w-5 h-5"/>
                </header>

                <div className="flex-1 flex h-full overflow-hidden">
                    {/* Inbox Sidebar (Desktop) */}
                    <div className="hidden lg:flex w-80 bg-white border-r border-slate-200 flex-col shrink-0">
                        <div className="p-8 pb-4">
                            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest">
                                <Edit3 size={16}/> Compor Email
                            </button>
                        </div>
                        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                            {[
                                { name: 'Entrada', icon: Inbox, count: 12, folder: 'INBOX' },
                                { name: 'Enviados', icon: Send, folder: 'SENT' },
                                { name: 'Lixo', icon: Trash, folder: 'TRASH' },
                            ].map((f) => (
                                <button
                                    key={f.folder}
                                    onClick={() => setActiveFolder(f.folder)}
                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all group ${
                                        activeFolder === f.folder
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <f.icon className={`w-5 h-5 mr-3 ${activeFolder === f.folder ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                        <span className="text-sm">{f.name}</span>
                                    </div>
                                    {f.count && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeFolder === f.folder ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{f.count}</span>}
                                </button>
                            ))}
                        </nav>
                        <div className="p-8 border-t border-slate-100">
                             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">MS</div>
                                <div><p className="text-[10px] font-black text-slate-900 leading-none">MS360 Suporte</p><p className="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">Conectado</p></div>
                             </div>
                        </div>
                    </div>

                    {/* Message List */}
                    <div className={`flex-1 flex flex-col bg-white overflow-hidden transition-all duration-300 ${selectedMessage ? 'w-full lg:w-1/3' : 'w-full'}`}>
                         <div className="h-20 px-4 lg:px-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
                             <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input className="w-full bg-slate-50 border-2 border-slate-50 pl-12 pr-4 py-3 rounded-xl focus:border-blue-200 outline-none transition-all font-bold text-sm" placeholder="Pesquisar mensagens..."/>
                             </div>
                             <button onClick={fetchMessages} className="ml-4 p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
                             </button>
                         </div>

                         <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                            {loading ? (
                                <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600 mb-4" size={32}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A carregar inbox...</p></div>
                            ) : messages.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <Inbox className="text-slate-100 w-24 h-24 mb-4"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">A sua inbox está vazia!</p>
                                </div>
                            ) : messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    onClick={() => setSelectedMessage(msg)}
                                    className={`p-4 lg:p-6 cursor-pointer hover:bg-blue-50/30 transition-all border-l-4 ${selectedMessage?.id === msg.id ? 'bg-blue-50/50 border-blue-600' : (msg.is_read ? 'border-transparent' : 'border-blue-600 bg-white shadow-sm')}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${msg.is_read ? 'bg-transparent' : 'bg-blue-600 shadow-sm shadow-blue-200'}`} />
                                            <p className={`text-xs uppercase tracking-tight ${msg.is_read ? 'text-slate-400 font-bold' : 'text-slate-900 font-black'}`}>{msg.from}</p>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">{msg.date}</span>
                                    </div>
                                    <h4 className={`text-sm tracking-tighter mb-2 leading-tight ${msg.is_read ? 'text-slate-500 font-bold' : 'text-slate-900 font-black'}`}>{msg.subject}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium truncate opacity-80 italic">A carregar pré-visualização...</p>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* Message Reader (Desktop/Modal) */}
                    {selectedMessage && (
                        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-300">
                             <div className="h-20 lg:px-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                 <div className="flex items-center gap-4">
                                     <button onClick={() => setSelectedMessage(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg lg:hidden"><X size={20}/></button>
                                     <div className="flex items-center gap-4">
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Trash size={18}/></button>
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Star size={18}/></button>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <button className="bg-white border border-slate-200 p-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">Responder</button>
                                     <button className="p-3 text-slate-400"><MoreVertical size={18}/></button>
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8">
                                 <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100">
                                     <div className="flex justify-between items-start mb-10 border-b border-slate-50 pb-8">
                                         <div className="flex gap-4">
                                             <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">{selectedMessage.from.charAt(0).toUpperCase()}</div>
                                             <div>
                                                 <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-tight">{selectedMessage.subject}</h3>
                                                 <div className="flex items-center gap-2 mt-1">
                                                     <p className="text-[10px] font-black text-blue-600 uppercase">De:</p>
                                                     <p className="text-[10px] font-bold text-slate-500">{selectedMessage.from}</p>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right flex flex-col items-end">
                                             <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2 mb-2"><Calendar size={12} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedMessage.date}</span></div>
                                             <div className="flex items-center gap-1.5 text-blue-600"><Paperclip size={14}/><span className="text-[8px] font-black uppercase">Sem anexos</span></div>
                                         </div>
                                     </div>

                                     <article className="prose prose-slate max-w-none">
                                         <p className="text-sm lg:text-base leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                             Este conteúdo é puxado em tempo real via IMAP.<br/><br/>
                                             A sua inbox está conectada com sucesso ao servidor do domínio. Todas as mensagens são processadas de forma segura e não ficam armazenadas no servidor do CRM a menos que escolha vincular a uma Lead específica.
                                         </p>
                                     </article>

                                     <div className="mt-16 pt-8 border-t border-slate-50 flex items-center gap-4">
                                         <div className="flex -space-x-2">
                                             <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black">JS</div>
                                             <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white text-[8px] font-black italic">MS</div>
                                         </div>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase leading-none italic">Aguardando resposta da equipa MS360</p>
                                     </div>
                                 </div>

                                 <div className="bg-blue-600 rounded-[32px] p-8 lg:p-10 text-white shadow-2xl shadow-blue-200 flex items-center justify-between">
                                     <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Dica Profissional</p>
                                         <h4 className="text-xl font-black tracking-tight leading-none italic opacity-95">Vincular este email a uma Lead?</h4>
                                     </div>
                                     <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Associar agora</button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Mailbox;
