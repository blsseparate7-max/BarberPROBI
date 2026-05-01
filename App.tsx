
import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_DATA } from './constants';
import { AppData, ParametrosAnuais } from './types';
import Dashboard from './components/Dashboard.tsx';
import Professionals from './components/Professionals.tsx';
import CashFlow from './components/CashFlow.tsx';
import Expenses from './components/Expenses.tsx';
import Config from './components/Config.tsx';
import Meetings from './components/Meetings.tsx';
import Subscriptions from './components/Subscriptions.tsx';
import FinancialPlanning from './components/FinancialPlanning.tsx';
import Navigation from './components/Navigation.tsx';
import { Save, Cloud, CloudOff, RefreshCw, LogOut, Database } from 'lucide-react';
import { auth } from './services/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Login, LogoutButton } from './components/Auth.tsx';
import { loadAppData, migrateToCloud, saveProfissional, saveProducao, saveReceitaExtra, saveGasto, saveParametros, saveMeetingNote, deleteProfissional, deleteMeetingNote, saveFechamentoMes, savePlanning } from './services/dataService.ts';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AppData>({
    ...MOCK_DATA,
    profissionais: MOCK_DATA.profissionais || [],
    producao: MOCK_DATA.producao || [],
    receitasExtras: MOCK_DATA.receitasExtras || [],
    gastos: MOCK_DATA.gastos || [],
    parametros: MOCK_DATA.parametros || [],
    meetingNotes: MOCK_DATA.meetingNotes || [],
    planejamento: MOCK_DATA.planejamento || [],
    categoriasGastos: MOCK_DATA.categoriasGastos || []
  });
  const [lastSaved, setLastSaved] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [showMigration, setShowMigration] = useState(false);

  // Auth Listener
  useEffect(() => {
    console.log("App: Iniciando listener de autenticação (onAuthStateChanged)...");
    
    if (!auth) {
        console.error("App: Objeto 'auth' é nulo. O Firebase falhou ao inicializar.");
        setAuthLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("App: Resultado do listener de auth ->", u ? `Usuário: ${u.email}` : "Nenhum usuário logado");
      setUser(u);
      if (!u) {
        setData({
          ...MOCK_DATA,
          profissionais: MOCK_DATA.profissionais || [],
          producao: MOCK_DATA.producao || [],
          receitasExtras: MOCK_DATA.receitasExtras || [],
          gastos: MOCK_DATA.gastos || [],
          parametros: MOCK_DATA.parametros || [],
          meetingNotes: MOCK_DATA.meetingNotes || [],
          planejamento: MOCK_DATA.planejamento || [],
          categoriasGastos: MOCK_DATA.categoriasGastos || []
        });
        setActiveTab('dashboard');
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("App: Erro no listener onAuthStateChanged:", error);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Data from Firestore when user logs in
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    console.log("App: Iniciando carregamento de dados para:", user.email);
    setDataLoading(true);
    setSyncStatus('syncing');
    
    try {
      const cloudData = await loadAppData();
      console.log("App: Dados brutos recebidos da nuvem.");
      
      // Critério de integridade: existem dados reais salvos?
      const hasRealData = 
        (cloudData.profissionais?.length ?? 0) > 0 || 
        (cloudData.parametros?.length ?? 0) > 0 ||
        (cloudData.producao?.length ?? 0) > 0 ||
        (cloudData.receitasExtras?.length ?? 0) > 0 ||
        (cloudData.gastos?.length ?? 0) > 0;

      if (hasRealData) {
        console.log("App: Restaurando estado do sistema via Firestore.");
        setData({
          profissionais: cloudData.profissionais || [],
          producao: cloudData.producao || [],
          receitasExtras: cloudData.receitasExtras || [],
          gastos: cloudData.gastos || [],
          parametros: cloudData.parametros || [],
          meetingNotes: cloudData.meetingNotes || [],
          planejamento: cloudData.planejamento || [],
          categoriasGastos: MOCK_DATA.categoriasGastos
        });
        setSyncStatus('synced');
        setLastSaved(new Date().toLocaleTimeString());
      } else {
        // Se o usuário está logado mas não há nada na nuvem, inicializamos vazio
        // Isso evita que mocks apareçam e desapareçam ou se misturem
        console.log("App: Perfil novo detectado. Aguardando importação ou novos dados.");
        setData({
          profissionais: [],
          producao: [],
          receitasExtras: [],
          gastos: [],
          parametros: [],
          meetingNotes: [],
          planejamento: [],
          categoriasGastos: MOCK_DATA.categoriasGastos
        });
        
        // Verificar se existe backup local para sugerir migração
        const localDataStr = localStorage.getItem('barber_bi_data');
        if (localDataStr) {
          setShowMigration(true);
        }
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error("App: Falha no carregamento inicial:", err);
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

  const syncToCloud = useCallback(async (updated: AppData, specificSync?: { type: string, payload: any }) => {
    if (!user) {
      localStorage.setItem('barber_bi_data', JSON.stringify(updated));
      setLastSaved(new Date().toLocaleTimeString());
      return;
    }

    setSyncStatus('syncing');
    console.log("App: Sincronizando com a nuvem...", specificSync?.type || 'Migração Geral');
    
    try {
      if (specificSync) {
        const { type, payload } = specificSync;
        
        switch(type) {
          case 'profissional': await saveProfissional(payload); break;
          case 'delete_profissional': await deleteProfissional(payload); break;
          case 'producao': await saveProducao(payload); break;
          case 'receita': await saveReceitaExtra(payload); break;
          case 'gasto': await saveGasto(payload); break;
          case 'parametro': await saveParametros(payload); break;
          case 'fechamento_mes': await saveFechamentoMes(payload); break;
          case 'note': await saveMeetingNote(payload); break;
          case 'delete_note': await deleteMeetingNote(payload); break;
          case 'planning': await savePlanning(payload); break;
          default: 
            console.warn("App: Tipo de sincronização desconhecido:", type);
            await migrateToCloud(updated);
        }
      } else {
        await migrateToCloud(updated);
      }
      setSyncStatus('synced');
      setLastSaved(new Date().toLocaleTimeString());
      console.log("App: Sincronização finalizada com sucesso.");
    } catch (e) {
      console.error("App: Erro na sincronização:", e);
      setSyncStatus('error');
    }
  }, [user]);

  const updateDataAndSync = useCallback(async (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => {
    setSyncStatus('syncing');
    
    try {
      // 1. Calculate updated data
      let updatedData: AppData;
      
      // We perform a sync update first to get the result
      await new Promise<void>((resolve) => {
        setData(prev => {
          updatedData = typeof newData === 'function' ? newData(prev) : newData;
          resolve();
          return updatedData;
        });
      });

      // @ts-ignore - updatedData is assigned in the promise
      const dataToSync = updatedData;

      // 2. Perform background sync
      await syncToCloud(dataToSync, specificSync);
      
      setSyncStatus('synced');
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("App: Erro crítico no updateDataAndSync:", err);
      setSyncStatus('error');
      throw err; // Re-throw to caller (like Config.tsx)
    }
  }, [syncToCloud]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="text-blue-600 animate-spin mb-4" size={40} />
        <p className="text-slate-800 font-bold text-sm uppercase">Verificando acesso...</p>
        <p className="text-slate-400 text-[10px] uppercase font-bold mt-2 tracking-widest">BarberPro BI Intelligence</p>
      </div>
    );
  }

  // Se o objeto auth for nulo, significa que o Firebase nem conseguiu iniciar
  if (!auth) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100">
          <Database size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-4 uppercase">Erro de Conexão</h1>
        <p className="text-slate-500 text-sm font-bold max-w-xs mx-auto mb-8">
          Não foi possível inicializar o Firebase. Verifique se as chaves da API estão configuradas corretamente nas variáveis de ambiente.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
        >
          Tentar Novamente
        </button>
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
      case 'planejamento': return <FinancialPlanning data={data} setData={updateDataAndSync} />;
      case 'assinaturas': return <Subscriptions data={data} year={selectedYear} />;
      case 'reuniao': return <Meetings data={data} setData={updateDataAndSync} year={selectedYear} />;
      case 'gastos': return <Expenses data={data} year={selectedYear} />;
      case 'config': return <Config data={data} setData={updateDataAndSync} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />;
      default: return <Dashboard data={data} year={selectedYear} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-32 bg-slate-50 relative">
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
