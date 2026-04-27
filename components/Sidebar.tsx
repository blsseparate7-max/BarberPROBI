
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transações', icon: '💸' },
    { id: 'collaborators', label: 'Colaboradores', icon: '💈' },
    { id: 'closing', label: 'Fechamento Anual', icon: '📅' },
  ];

  return (
    <div className="w-64 bg-stone-900 border-r border-stone-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-8 border-b border-stone-800">
        <h1 className="text-2xl font-serif text-amber-500 tracking-wider">BARBER<span className="text-stone-100">PRO</span></h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">Management System</p>
      </div>
      
      <nav className="flex-1 mt-6 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all ${
              activeTab === item.id 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-stone-800">
        <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700">
          <p className="text-xs text-stone-500 mb-1">Status do Caixa</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-sm font-semibold text-stone-200 uppercase">Aberto</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
