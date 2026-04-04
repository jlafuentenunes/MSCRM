import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Zap, FileText, Ticket, LogOut, Mail, Settings, Box, Briefcase
} from 'lucide-react';

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Leads', path: '/dashboard', icon: Users },
    { name: 'Faturação', path: '/billing', icon: FileText },
    { name: 'Suporte', path: '/tickets', icon: Ticket },
    { 
      name: 'Correio', 
      path: '/mail', 
      icon: Mail,
      subItems: [
        { name: 'Entrada', path: '/mail?folder=INBOX' },
        { name: 'Enviados', path: '/mail?folder=Sent' },
        { name: 'Lixo', path: '/mail?folder=Trash' },
        { name: 'Rascunhos', path: '/mail?folder=Drafts' },
      ]
    },
    { name: 'Projetos', path: '/projects', icon: Briefcase },
    { name: 'Automações', path: '/automations', icon: Zap },
    { name: 'Serviços', path: '/services', icon: Box },
  ];

  const isActive = (path: string) => {
    if (path === '/mail') return location.pathname.startsWith('/mail');
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden" 
          onClick={() => setIsMenuOpen(false)} 
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-all duration-300 lg:relative lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 lg:p-8 flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="text-white w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <span className="font-black text-xl lg:text-2xl tracking-tighter uppercase italic">
            MS<span className="text-blue-600 not-italic">360</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <div key={item.path} className="space-y-1">
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-5 py-4 rounded-2xl font-bold transition-all group ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">{item.name}</span>
                </button>
                
                {/* Sub-itens (Apenas se o item pai estiver ativo ou se quisermos mostrar sempre) */}
                {item.subItems && active && (
                  <div className="pl-12 space-y-1 py-2">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => {
                          navigate(sub.path);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          location.search.includes(sub.path.split('?')[1])
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-4 mb-2">
            <button
                onClick={() => navigate('/mail/settings')}
                className={`w-full flex items-center px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    isActive('/mail/settings')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
                <Settings className="w-4 h-4 mr-3" />
                Config. Email
            </button>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center px-5 py-3 text-red-500 font-bold w-full uppercase text-[10px] tracking-widest hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" /> 
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
