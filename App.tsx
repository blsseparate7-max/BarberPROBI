
import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_DATA } from './constants.tsx';
import { AppData, ParametrosAnuais } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import Professionals from './components/Professionals.tsx';
import CashFlow from './components/CashFlow.tsx';
import Expenses from './components/Expenses.tsx';
import Config from './components/Config.tsx';
import Meetings from './components/Meetings.tsx';
import Subscriptions from './components/Subscriptions.tsx';
import Navigation from './components/Navigation.tsx';
import { Save, Cloud, CloudOff, RefreshCw, LogOut, Database } from 'lucide-react';
import { auth } from './services/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Login, LogoutButton } from './components/Auth.tsx';
import { loadAppData, migrateToCloud, saveProfissional, saveProducao, saveReceitaExtra, saveGasto, saveParametros, saveMeetingNote } from './services/dataService.ts';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AppData>(MOCK_DATA);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [showMigration, setShowMigration] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data from Firestore when user logs in
  const fetchData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const cloudData = await loadAppData();
      
      // If cloud data is virtually empty, maybe suggest migration from local
      const hasCloudData = (cloudData.profissionais?.length ?? 0) > 0 || (cloudData.parametros?.length ?? 0) > 0;
      const localDataStr = localStorage.getItem('barber_bi_data');
      
      if (!hasCloudData && localDataStr) {
        setShowMigration(true);
      }

      if (hasCloudData) {
        setData(prev => ({
          ...prev,
          ...cloudData,
          // Ensure structure
          parametros: cloudData.parametros || prev.parametros,
          profissionais: cloudData.profissionais || prev.profissionais,
          producao: cloudData.producao || prev.producao,
          receitasExtras: cloudData.receitasExtras || prev.receitasExtras,
          gastos: cloudData.gastos || prev.gastos,
          meetingNotes: cloudData.meetingNotes || prev.meetingNotes,
          categoriasGastos: prev.categoriasGastos // This is usually constant
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setSyncStatus('error');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Sync to Cloud on every state change (Debounced / Specific)
  // For simplicity in this turn, I will manually call sync functions if possible or use a master sync
  // But wait, the user wants "Ao salvar/editar/excluir qualquer dado, atualizar no Firestore"
  // I will wrap the setData for better control

  const updateDataAndSync = useCallback(async (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => {
    setData(prev => {
      const updated = typeof newData === 'function' ? newData(prev) : newData;
      
      // Perform background sync if authenticated
      if (user) {
        setSyncStatus('syncing');
        // If specificSync is provided, we can be efficient. 
        // If not, we have to guess or sync the whole lot (expensive).
        // Since many components call setData with the whole object, we'll try to be smart or just do it.
        
        // For this implementation, I'll use a simplified background sync of the whole data set 
        // to subcollections (only if it changed) or I'll just sync the whole thing to fulfill the requirement.
        // Actually, let's use the individual save functions for the whole arrays for now to ensure all is synced.
        
        const syncAll = async () => {
             try {
                // To avoid overloading, we'd ideally only sync what changed.
                // But without a diff, we'll just iterate. 
                // In a production app, we'd pass specific update functions instead of generic setData.
                
                // Let's implement the specific sync logic here to be more efficient
                if (specificSync) {
                    switch(specificSync.type) {
                        case 'profissional': await saveProfissional(specificSync.payload); break;
                        case 'producao': await saveProducao(specificSync.payload); break;
                        case 'receita': await saveReceitaExtra(specificSync.payload); break;
                        case 'gasto': await saveGasto(specificSync.payload); break;
                        case 'parametro': await saveParametros(specificSync.payload); break;
                        case 'note': await saveMeetingNote(specificSync.payload); break;
                    }
                } else {
                    // Fallback: sync everything (Migration-like but for updates)
                    await migrateToCloud(updated);
                }
                setSyncStatus('synced');
                setLastSaved(new Date().toLocaleTimeString());
             } catch (e) {
                setSyncStatus('error');
             }
        };
        syncAll();
      } else {
          localStorage.setItem('barber_bi_data', JSON.stringify(updated));
          setLastSaved(new Date().toLocaleTimeString());
      }
      
      return updated;
    });
  }, [user]);

  const handleMigration = async () => {
    if (!user) return;
    const localDataStr = localStorage.getItem('barber_bi_data');
    if (!localDataStr) return;
    
    setDataLoading(true);
    try {
      const localData = JSON.parse(localDataStr);
      await migrateToCloud(localData);
      await fetchData();
      setShowMigration(false);
      alert('Dados migrados com sucesso!');
    } catch (err) {
      alert('Erro na migração.');
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="text-blue-600 animate-spin mb-4" size={40} />
        <p className="text-slate-500 font-bold text-sm">Verificando acesso...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => {}} />;
  }

  const renderContent = () => {
    if (dataLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="text-blue-600 animate-spin mb-4" size={32} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando dados da nuvem...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} year={selectedYear} />;
      case 'professionals': return <Professionals data={data} setData={updateDataAndSync} year={selectedYear} />;
      case 'fluxo': return <CashFlow data={data} setData={updateDataAndSync} year={selectedYear} />;
      case 'assinaturas': return <Subscriptions data={data} year={selectedYear} />;
      case 'reuniao': return <Meetings data={data} setData={updateDataAndSync} year={selectedYear} />;
      case 'gastos': return <Expenses data={data} year={selectedYear} />;
      case 'config': return <Config data={data} setData={updateDataAndSync} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />;
      default: return <Dashboard data={data} year={selectedYear} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
             <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 leading-none">BarberPro BI</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Ano: {selectedYear}</span>
              <span className="text-[8px] text-slate-300">•</span>
              <div className={`flex items-center gap-1 text-[9px] font-bold uppercase ${syncStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                {syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : syncStatus === 'error' ? <CloudOff size={10} /> : <Cloud size={10} />}
                {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro de Sync' : `Salvo ${lastSaved}`}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-slate-800 uppercase">{user.email?.split('@')[0]}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Conta Ativa</span>
          </div>
          <LogoutButton />
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-slate-200">
            GBCortes7
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence>
          {showMigration && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-blue-600 text-white p-6 rounded-[32px] shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl"><RefreshCw size={24} /></div>
                  <div>
                    <h4 className="font-black text-sm uppercase">Migrar Dados Locais</h4>
                    <p className="text-[10px] font-bold text-blue-100 uppercase mt-0.5">Detectamos dados antigos neste computador. Deseja levar para a nuvem?</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleMigration}
                    className="flex-1 md:flex-none px-6 py-3 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-colors"
                  >
                    MIGRAR AGORA
                  </button>
                  <button 
                    onClick={() => setShowMigration(false)}
                    className="flex-1 md:flex-none px-6 py-3 bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-800 transition-colors"
                  >
                    AGORA NÃO
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
