import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, Zap } from 'lucide-react';
import api from '../services/api';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/backend/login.php', { username, password });
            if (response.data.status === 'success') {
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao tentar login. Verifique o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-6 lg:mb-12">
                    <div className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl lg:rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-300 mb-4 lg:mb-6 transform transition-transform hover:scale-110 active:rotate-6">
                        <Zap className="text-white w-8 h-8 lg:w-12 lg:h-12 fill-white/20" />
                    </div>
                    <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">MS<span className="text-blue-600 not-italic">360</span></h1>
                    <p className="text-slate-500 mt-1 lg:mt-2 font-bold uppercase tracking-widest text-[10px] lg:text-xs">Monitor de Surpresas CRM</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-3xl lg:rounded-[40px] shadow-2xl shadow-slate-300/40 p-6 lg:p-12 border border-white/50 ring-1 ring-slate-200/50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 lg:p-5 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs border border-red-100 animate-in fade-in slide-in-from-top-4 duration-300 font-bold uppercase tracking-wide">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Utilizador</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 lg:pl-14 pr-5 py-3.5 lg:py-5 bg-white border-2 border-slate-100 rounded-xl lg:rounded-2xl focus:ring-0 focus:border-blue-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-sm"
                                        placeholder="Seu utilizador"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">Palavra-passe</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 lg:pl-14 pr-5 py-3.5 lg:py-5 bg-white border-2 border-slate-100 rounded-xl lg:rounded-2xl focus:ring-0 focus:border-blue-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 lg:py-5 rounded-xl lg:rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center group disabled:opacity-70 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-5 h-5 mr-3" />
                            ) : (
                                <>
                                    ENTRAR NO MS360
                                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="text-center mt-6 lg:mt-12 text-slate-400 text-[9px] lg:text-[10px] font-black tracking-[0.25em] uppercase px-4">
                    © 2026 MS360 • Monitor de Surpresas
                </p>
            </div>
        </div>
    );
};

export default Login;
