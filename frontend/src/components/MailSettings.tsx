import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Save, Loader2, Mail, Server, ShieldCheck, 
  Menu, Bell, Check, Info, ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import Sidebar from './Sidebar';

const MailSettings: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{status: 'success' | 'error' | null, message: string}>({status: null, message: ''});
    
    const [settings, setSettings] = useState({
        imap_host: '',
        imap_port: 993,
        imap_user: '',
        imap_pass: '',
        smtp_host: '',
        smtp_port: 465,
        smtp_user: '',
        smtp_pass: '',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/backend/mailbox.php?action=get_settings');
                if (res.data.status === 'success' && res.data.data.imap_host) {
                    setSettings(res.data.data);
                }
            } catch (err) {
                console.error("Erro ao carregar definições:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/backend/mailbox.php?action=save_settings', settings);
            if (res.data.status === 'success') {
                alert('Configurações guardadas com sucesso!');
            } else {
                alert('Erro: ' + res.data.message);
            }
        } catch (err: any) {
            alert('Falha ao guardar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult({status: null, message: ''});
        try {
            const res = await api.post('/backend/mailbox.php?action=test_connection', settings);
            setTestResult({
                status: res.data.status === 'success' ? 'success' : 'error',
                message: res.data.message
            });
        } catch (err: any) {
            setTestResult({status: 'error', message: 'Erro de rede: ' + err.message});
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-30">
                    <button className="lg:hidden p-2 -ml-2 text-slate-400" onClick={() => setIsMenuOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <h2 className="text-sm lg:text-xl font-black text-slate-800 uppercase tracking-tight">Configuração de <span className="text-blue-600">Email</span></h2>
                    
                    <div className="flex items-center gap-3">
                         <Mail className="text-slate-200 w-8 h-8"/>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-blue-600 rounded-[32px] p-8 lg:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl lg:text-4xl font-black tracking-tighter uppercase italic mb-2">Ligue a sua <span className="text-blue-200">Inbox</span></h3>
                                <p className="text-blue-100 font-bold uppercase text-[10px] lg:text-xs tracking-widest max-w-md">Configure o servidor IMAP/SMTP do seu domínio para gerir mensagens diretamente no CRM.</p>
                            </div>
                            <Mail className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* IMAP Card */}
                            <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm border border-slate-100 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Server size={20}/></div>
                                    <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Servidor de Receção (IMAP)</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Host IMAP</label>
                                        <input required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm focus:border-blue-200 focus:bg-white outline-none transition-all" 
                                               value={settings.imap_host} onChange={e => setSettings({...settings, imap_host: e.target.value})} placeholder="imap.oseudominio.com"/>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Porta</label>
                                            <input type="number" required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm focus:border-blue-200"
                                                   value={settings.imap_port} onChange={e => setSettings({...settings, imap_port: parseInt(e.target.value)})}/>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">SSL/TLS</label>
                                            <div className="w-full bg-slate-100 p-4 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><ShieldCheck size={14}/> Recomendado</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Utilizador IMAP</label>
                                        <input required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm" 
                                               value={settings.imap_user} onChange={e => setSettings({...settings, imap_user: e.target.value})} placeholder="geral@oseudominio.com"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Palavra-passe</label>
                                        <input type="password" required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm" 
                                               value={settings.imap_pass} onChange={e => setSettings({...settings, imap_pass: e.target.value})} placeholder="••••••••"/>
                                    </div>
                                </div>
                            </div>

                            {/* SMTP Card */}
                            <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm border border-slate-100 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Zap size={20}/></div>
                                    <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Servidor de Envio (SMTP)</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Host SMTP</label>
                                        <input required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm" 
                                               value={settings.smtp_host} onChange={e => setSettings({...settings, smtp_host: e.target.value})} placeholder="smtp.oseudominio.com"/>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Porta</label>
                                            <input type="number" required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm"
                                                   value={settings.smtp_port} onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value)})}/>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Segurança</label>
                                            <div className="w-full bg-slate-100 p-4 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Check size={14}/> Autenticação Ativa</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Utilizador SMTP</label>
                                        <input required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm" 
                                               value={settings.smtp_user} onChange={e => setSettings({...settings, smtp_user: e.target.value})} placeholder="geral@oseudominio.com"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Palavra-passe</label>
                                        <input type="password" required className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl font-bold text-sm" 
                                               value={settings.smtp_pass} onChange={e => setSettings({...settings, smtp_pass: e.target.value})} placeholder="••••••••"/>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                                <button type="button" onClick={testConnection} disabled={testing} className="flex-1 bg-white border-2 border-slate-200 text-slate-900 font-black py-4 lg:py-5 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50">
                                    {testing ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                                    {testing ? 'A testar ligação...' : 'Testar Configuração'}
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white font-black py-4 lg:py-5 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50">
                                    {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                    {saving ? 'A guardar...' : 'Guardar e Ativar Inbox'}
                                </button>
                            </div>

                            {testResult.status && (
                                <div className={`md:col-span-2 p-6 rounded-[24px] border-2 animate-in slide-in-from-top duration-300 ${testResult.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${testResult.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {testResult.status === 'success' ? <Check size={20}/> : <ShieldAlert size={20}/>}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-xs tracking-widest leading-none mb-1">{testResult.status === 'success' ? 'Ligação OK' : 'Falha na Ligação'}</p>
                                            <p className="text-sm font-bold opacity-80">{testResult.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MailSettings;
