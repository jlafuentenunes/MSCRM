import React, { useState, useEffect } from 'react';
import { 
  Zap, Mail, Inbox, Send, Trash, Edit3, Search, 
  Menu, X, RefreshCcw, Loader2, Star, 
  Paperclip, Calendar, MoreVertical
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
    const [error, setError] = useState<string | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [activeFolder, setActiveFolder] = useState('INBOX');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
    const [sending, setSending] = useState(false);

    const fetchMessages = async (folderName: string = 'INBOX') => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/backend/mailbox.php?action=list_messages&folder=${folderName}`);
            if (res.data.status === 'success') {
                setMessages(res.data.messages || []);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError("Falha na ligação ao backend.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (uid: number) => {
        if (!window.confirm("Tem a certeza que pretende eliminar este email?")) return;
        try {
            const res = await api.get(`/backend/mailbox.php?action=delete_message&uid=${uid}&folder=${activeFolder}`);
            if (res.data.status === 'success') {
                setSelectedMessage(null);
                fetchMessages(activeFolder);
            } else {
                alert("Erro ao eliminar: " + res.data.message);
            }
        } catch (err) {
            alert("Erro de ligação ao servidor.");
        }
    };

    const handleSend = async () => {
        if (!composeData.to || !composeData.body) {
            alert("Por favor, preencha o destinatário e a mensagem.");
            return;
        }
        setSending(true);
        try {
            const res = await api.post('/backend/mailbox.php?action=send_message', composeData);
            if (res.data.status === 'success') {
                alert("Email enviado com sucesso!");
                setIsComposeOpen(false);
                setComposeData({ to: '', subject: '', body: '' });
            } else {
                alert("Erro ao enviar: " + res.data.message);
            }
        } catch (err) {
            alert("Erro de ligação.");
        } finally {
            setSending(false);
        }
    };

    const openReply = () => {
        if (!selectedMessage) return;
        setComposeData({
            to: selectedMessage.from,
            subject: `Re: ${selectedMessage.subject}`,
            body: `\n\n--- Em ${selectedMessage.date}, ${selectedMessage.from} escreveu: ---\n\n`
        });
        setIsComposeOpen(true);
    };

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const folder = query.get('folder') || 'INBOX';
        setActiveFolder(folder);
        fetchMessages(folder);
    }, [window.location.search]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg lg:rounded-xl items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
                            <Mail size={16} className="lg:w-5 lg:h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Centro de Mensagens</h2>
                            <p className="hidden xs:block text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{activeFolder} MS360 Conectada</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                setComposeData({ to: '', subject: '', body: '' });
                                setIsComposeOpen(true);
                            }}
                            className="hidden sm:flex bg-blue-600 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-blue-100 items-center justify-center gap-3 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest mr-4"
                        >
                            <Edit3 size={14}/> Compor
                        </button>
                        <div className="flex items-center gap-2">
                            <Zap className="text-blue-600 w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
                            <span className="hidden sm:inline text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex h-full overflow-hidden">
                    {/* Message List */}
                    <div className={`flex-1 flex flex-col bg-white overflow-hidden transition-all duration-300 ${selectedMessage ? 'w-full lg:w-1/3' : 'w-full'}`}>
                         <div className="h-20 px-4 lg:px-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
                             <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input className="w-full bg-slate-50 border-2 border-slate-50 pl-12 pr-4 py-3 rounded-xl focus:border-blue-200 outline-none transition-all font-bold text-sm" placeholder="Pesquisar mensagens..."/>
                             </div>
                             <button onClick={() => fetchMessages(activeFolder)} className="ml-4 p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''}/>
                             </button>
                         </div>

                         <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                            {loading ? (
                                <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600 mb-4" size={32}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A carregar inbox...</p></div>
                            ) : error ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <X className="text-red-400 w-24 h-24 mb-4"/>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{error}</p>
                                    <button onClick={() => fetchMessages(activeFolder)} className="mt-4 text-[10px] font-black text-blue-600 underline">Tentar novamente</button>
                                </div>
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
                                        <button 
                                            onClick={() => selectedMessage && handleDelete(selectedMessage.id)}
                                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        ><Trash size={18}/></button>
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Star size={18}/></button>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <button 
                                        onClick={openReply}
                                        className="bg-white border border-slate-200 p-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                                     >Responder</button>
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

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Nova Mensagem</h3>
                            <button onClick={() => setIsComposeOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Para:</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:border-blue-200 outline-none transition-all font-bold text-sm"
                                    placeholder="email@exemplo.com"
                                    value={composeData.to}
                                    onChange={e => setComposeData({...composeData, to: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Assunto:</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:border-blue-200 outline-none transition-all font-bold text-sm"
                                    placeholder="Assunto da mensagem"
                                    value={composeData.subject}
                                    onChange={e => setComposeData({...composeData, subject: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Mensagem:</label>
                                <textarea 
                                    rows={8}
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:border-blue-200 outline-none transition-all font-medium text-sm resize-none"
                                    placeholder="Escreva a sua mensagem aqui..."
                                    value={composeData.body}
                                    onChange={e => setComposeData({...composeData, body: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                                onClick={() => setIsComposeOpen(false)}
                                className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
                            >Cancelar</button>
                            <button 
                                onClick={handleSend}
                                disabled={sending}
                                className="bg-blue-600 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                                {sending ? 'A enviar...' : 'Enviar Agora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mailbox;
