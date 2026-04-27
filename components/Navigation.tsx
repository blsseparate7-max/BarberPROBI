
import React from 'react';
import { LayoutDashboard, Users, Repeat, Settings, MessageSquareQuote, UserCheck } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'professionals', label: 'Equipe', icon: Users },
    { id: 'fluxo', label: 'Fluxo', icon: Repeat },
    { id: 'assinaturas', label: 'Assinantes', icon: UserCheck },
    { id: 'reuniao', label: 'Reunião', icon: MessageSquareQuote },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 h-24 px-4 flex justify-around items-center z-50 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.6)]">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center space-y-2 transition-all duration-300 relative ${
              isActive ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-3 rounded-2xl transition-all ${
              isActive ? 'bg-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.3)]' : ''
            }`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-3 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_12px_#60a5fa]"></div>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
