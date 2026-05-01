
import React, { useState, useRef, useMemo } from 'react';
import { AppData, ParametrosAnuais } from '../types';
import { CalendarPlus, Save, Trash2, Download, Upload, ShieldCheck, Plus, X, CheckCircle2, ArrowRightLeft, TrendingUp, TrendingDown, Database, ClipboardList, RefreshCw } from 'lucide-react';

interface ConfigProps {
  data: AppData;
  setData: (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => void | Promise<void>;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const Config: React.FC<ConfigProps> = ({ data, setData, selectedYear, setSelectedYear }) => {
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [compareYearA, setCompareYearA] = useState<number>(data.parametros[0]?.ano || 2024);
  const [compareYearB, setCompareYearB] = useState<number>(data.parametros[1]?.ano || data.parametros[0]?.ano || 2024);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newYearForm, setNewYearForm] = useState<ParametrosAnuais>({
    ano: new Date().getFullYear() + 1,
    metaFaturamento: 250000,
    metaLucro: 120000,
    metaAssinaturas: 36000,
    metaGeladeira: 12000,
    metaGastos: 100000,
    metaPorCadeira: 5000
  });

  const yearsWithData = useMemo(() => {
    const years = new Set<number>();
    data.producao.forEach(p => years.add(p.ano));
    data.gastos.forEach(g => years.add(g.ano));
    data.receitasExtras.forEach(r => years.add(r.ano));
    return years;
  }, [data]);

  const exportBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_barber_bi_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const [isImporting, setIsImporting] = useState(false);

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as AppData;
        
        // 1. Validação Básica
        if (!json.profissionais || !Array.isArray(json.profissionais)) {
          throw new Error('Arquivo de backup inválido: Coleção de profissionais não encontrada.');
        }

        if (!confirm('Esta ação irá substituir os dados atuais pelos dados do backup. Deseja continuar?')) {
          return;
        }

        setIsImporting(true);

        // 2. Normalização e Regeneração de IDs
        const idMap: Record<string, string> = {};
        const normalizedData: AppData = {
          parametros: (json.parametros || []).map(p => ({
            ano: Number(p.ano),
            metaFaturamento: Number(p.metaFaturamento || 0),
            metaLucro: Number(p.metaLucro || 0),
            metaAssinaturas: Number(p.metaAssinaturas || 0),
            metaGeladeira: Number(p.metaGeladeira || 0),
            metaGastos: Number(p.metaGastos || 0),
            metaPorCadeira: Number(p.metaPorCadeira || 0)
          })),
          profissionais: (json.profissionais || []).map(p => {
            const newId = Math.random().toString(36).substring(2, 11);
            idMap[p.id] = newId;
            return {
              ...p,
              id: newId,
              comissao: Number(p.comissao || 0),
              cadeira: Number(p.cadeira || 0),
              metaMensal: p.metaMensal ? Number(p.metaMensal) : undefined
            };
          }),
          producao: (json.producao || []).map(p => ({
            ...p,
            ano: Number(p.ano),
            mes: Number(p.mes),
            profissionalId: idMap[p.profissionalId] || p.profissionalId,
            producaoBruta: Number(p.producaoBruta || 0),
            repasseProfissional: Number(p.repasseProfissional || 0),
            repasseAssinatura: Number(p.repasseAssinatura || 0),
            recebidoPelaCasa: Number(p.recebidoPelaCasa || 0),
            vendasProdutos: Number(p.vendasProdutos || 0),
            quantidadeAtendimentos: Number(p.quantidadeAtendimentos || 0)
          })),
          receitasExtras: (json.receitasExtras || []).map(r => ({
            ...r,
            ano: Number(r.ano),
            mes: Number(r.mes),
            dinheiro: Number(r.dinheiro || 0),
            cartao: Number(r.cartao || 0),
            pix: Number(r.pix || 0),
            assinaturas: Number(r.assinaturas || 0),
            pacotes: Number(r.pacotes || 0),
            geladeira: Number(r.geladeira || 0),
            outras: Number(r.outras || 0)
          })),
          gastos: (json.gastos || []).map(g => ({
            ...g,
            ano: Number(g.ano),
            mes: Number(g.mes),
            valor: Number(g.valor || 0)
          })),
          meetingNotes: (json.meetingNotes || []).map(n => ({
            ...n,
            id: Math.random().toString(36).substring(2, 11),
            profissionalId: idMap[n.profissionalId] || n.profissionalId,
            ano: Number(n.ano)
          })),
          categoriasGastos: json.categoriasGastos || [
            'PRODUTOS', 'ALUGUEL', 'ENERGIA', 'ÁGUA', 'INTERNET', 'MARKETING', 'REPAROS', 'SISTEMAS', 'OUTROS'
          ],
          planejamento: (json.planejamento || []).map(p => ({
            ...p,
            ano: Number(p.ano),
            mes: Number(p.mes)
          }))
        };

        // 3. Sincronização Segura
        await setData(normalizedData);
        alert('Importação concluída com sucesso!');
        
      } catch (err) {
        console.error('Erro na importação:', err);
        alert(`Erro ao importar dados: ${err instanceof Error ? err.message : 'Arquivo corrompido.'}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNewYear = () => {
    if (data.parametros.some(p => p.ano === newYearForm.ano)) {
      alert('Ano já existente!');
      return;
    }
    
    // Garantia de dados zerados para o novo ano: 
    // Como os dados de produção/gastos já são armazenados com o campo 'ano', 
    // criar o novo parâmetro é suficiente, pois as listas de dados do novo ano estarão vazias inicialmente.
    
    setData(prev => ({ 
      ...prev, 
      parametros: [...prev.parametros, newYearForm] 
    }), { type: 'parametro', payload: newYearForm });
    setSelectedYear(newYearForm.ano);
    setShowNewYearModal(false);
  };

  const handleRemoveYear = (ano: number) => {
    if (data.parametros.length <= 1) return;
    if (confirm(`Excluir as configurações de ${ano}? Todas as produções e gastos deste ano serão mantidos mas o ciclo parametrizado será removido.`)) {
      setData(prev => ({ 
        ...prev, 
        parametros: prev.parametros.filter(p => p.ano !== ano) 
      }));
      if (selectedYear === ano) {
        const remaining = data.parametros.filter(p => p.ano !== ano);
        if (remaining.length > 0) setSelectedYear(remaining[0].ano);
      }
    }
  };

  const comparisonResults = useMemo(() => {
    const getYearStats = (yr: number) => {
      const prod = data.producao.filter(p => p.ano === yr);
      const extra = data.receitasExtras.filter(r => r.ano === yr);
      const gastos = data.gastos.filter(g => g.ano === yr);

      const faturamento = prod.reduce((s, c) => s + c.producaoBruta, 0) +
        extra.reduce((s, r) => s + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes, 0);
      
      const repasses = prod.reduce((s, c) => s + c.repasseProfissional + c.repasseAssinatura, 0);
      const gastosOperacionais = gastos.reduce((s, g) => s + g.valor, 0);
      const saidas = repasses + gastosOperacionais;
      const lucro = faturamento - saidas;
      const assinaturas = extra.reduce((s, r) => s + r.assinaturas, 0);

      return { faturamento, saidas, lucro, assinaturas };
    };

    const statsA = getYearStats(compareYearA);
    const statsB = getYearStats(compareYearB);

    const calcDiff = (valA: number, valB: number) => {
      const diff = valB - valA;
      const pct = valA !== 0 ? (diff / valA) * 100 : 0;
      return { diff, pct };
    };

    return {
      statsA,
      statsB,
      faturamento: calcDiff(statsA.faturamento, statsB.faturamento),
      saidas: calcDiff(statsA.saidas, statsB.saidas),
      lucro: calcDiff(statsA.lucro, statsB.lucro),
      assinaturas: calcDiff(statsA.assinaturas, statsB.assinaturas),
    };
  }, [data, compareYearA, compareYearB]);

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-32">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Ajustes do Sistema</h2>
        <p className="text-sm text-slate-400 font-bold uppercase">Gestão de dados e planejamento temporal</p>
      </header>

      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <CalendarPlus size={22} className="text-blue-600" /> Ciclos de Gestão
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cada novo ano inicia com produção zerada automaticamente</p>
          </div>
          <button onClick={() => setShowNewYearModal(true)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 hover:scale-105 transition-all">
            <Plus size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.parametros.sort((a,b) => b.ano - a.ano).map(p => {
            const hasData = yearsWithData.has(p.ano);
            const isSelected = selectedYear === p.ano;

            return (
              <div 
                key={p.ano} 
                className={`p-8 rounded-[40px] border transition-all relative overflow-hidden group ${
                  isSelected 
                  ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-100 text-white' 
                  : 'bg-white border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <span className={`text-4xl font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>{p.ano}</span>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase">
                          <CheckCircle2 size={10} /> Logado
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400">
                          Sessão Fechada
                        </div>
                      )}
                      
                      {hasData && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${isSelected ? 'bg-emerald-400 text-emerald-900' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Database size={10} /> Com Dados
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {hasData && !isSelected && (
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                      <ClipboardList size={20} />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {!isSelected ? (
                    <button 
                      onClick={() => setSelectedYear(p.ano)} 
                      className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800 transition-colors"
                    >
                      Acessar Ano
                    </button>
                  ) : (
                    <div className="flex-1 bg-white text-blue-600 py-4 rounded-2xl text-[10px] font-black uppercase text-center border border-white/20">
                      Visualizando Agora
                    </div>
                  )}
                  
                  {!isSelected && (
                    <button 
                      onClick={() => handleRemoveYear(p.ano)} 
                      className="p-4 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 p-10 rounded-[48px] border border-slate-100 border-dashed">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <ArrowRightLeft size={24} className="text-purple-600" /> Comparativo de Performance
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Analise o crescimento entre períodos</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
            <select 
              value={compareYearA} 
              onChange={(e) => setCompareYearA(Number(e.target.value))}
              className="bg-slate-50 border-none text-xs font-black p-2 rounded-xl outline-none"
            >
              {data.parametros.map(p => <option key={p.ano} value={p.ano}>{p.ano}</option>)}
            </select>
            <span className="text-[10px] font-black text-slate-300 uppercase">VS</span>
            <select 
              value={compareYearB} 
              onChange={(e) => setCompareYearB(Number(e.target.value))}
              className="bg-slate-50 border-none text-xs font-black p-2 rounded-xl outline-none"
            >
              {data.parametros.map(p => <option key={p.ano} value={p.ano}>{p.ano}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CompareCard 
            label="Faturamento Bruto" 
            valA={comparisonResults.statsA.faturamento} 
            valB={comparisonResults.statsB.faturamento} 
            diff={comparisonResults.faturamento} 
          />
          <CompareCard 
            label="Saídas Totais" 
            valA={comparisonResults.statsA.saidas} 
            valB={comparisonResults.statsB.saidas} 
            diff={comparisonResults.saidas} 
            inverse 
          />
          <CompareCard 
            label="Lucro Líquido" 
            valA={comparisonResults.statsA.lucro} 
            valB={comparisonResults.statsB.lucro} 
            diff={comparisonResults.lucro} 
          />
          <CompareCard 
            label="Rec. Assinaturas" 
            valA={comparisonResults.statsA.assinaturas} 
            valB={comparisonResults.statsB.assinaturas} 
            diff={comparisonResults.assinaturas} 
          />
        </div>
      </section>

      <section className="bg-slate-950 p-10 rounded-[48px] shadow-2xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
        <h3 className="font-black text-lg mb-8 flex items-center gap-2"><ShieldCheck size={22} className="text-emerald-400" /> Segurança dos Dados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={exportBackup} className="bg-white/5 hover:bg-white/10 border border-white/10 p-8 rounded-[32px] flex items-center justify-between transition-all group">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><Download size={24} /></div>
              <div className="text-left">
                <p className="font-black text-sm">EXPORTAR BACKUP</p>
                <p className="text-[9px] text-slate-400 uppercase mt-1">Salva .json no computador</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className={`bg-white/5 hover:bg-white/10 border border-white/10 p-8 rounded-[32px] flex items-center justify-between transition-all group ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                {isImporting ? <RefreshCw size={24} className="animate-spin" /> : <Upload size={24} />}
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase">{isImporting ? 'IMPORTANDO...' : 'RESTAURAR SISTEMA'}</p>
                <p className="text-[9px] text-slate-400 uppercase mt-1">Carregar dados externos</p>
              </div>
            </div>
          </button>
          <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
        </div>
      </section>

      {showNewYearModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-md:max-w-md max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in duration-300 my-auto overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-3 mb-2">
                <RefreshCw size={24} className="text-blue-600 animate-spin-slow" />
                <h3 className="text-2xl font-black text-slate-800">Novo Ciclo Anual</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase mb-8">O sistema iniciará este ano com faturamento ZERADO.</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Ano de Referência</label>
                <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={newYearForm.ano} onChange={(e) => setNewYearForm({...newYearForm, ano: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Meta de Faturamento Inicial (R$)</label>
                <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={newYearForm.metaFaturamento} onChange={(e) => setNewYearForm({...newYearForm, metaFaturamento: Number(e.target.value)})} />
              </div>
              <button onClick={handleCreateNewYear} className="w-full bg-blue-600 text-white py-5 rounded-[32px] font-black shadow-xl flex items-center justify-center gap-2">
                <CalendarPlus size={20} /> INICIAR NOVO ANO ZERADO
              </button>
              <button onClick={() => setShowNewYearModal(false)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CompareCardProps {
  label: string;
  valA: number;
  valB: number;
  diff: { diff: number; pct: number };
  inverse?: boolean;
}

const CompareCard = ({ label, valA, valB, diff, inverse = false }: CompareCardProps) => {
  const isPositive = diff.diff >= 0;
  const colorClass = isPositive 
    ? (inverse ? 'text-red-500' : 'text-emerald-500') 
    : (inverse ? 'text-emerald-500' : 'text-red-500');
  
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
      
      <div className="flex justify-between items-end border-b border-slate-50 pb-3">
        <div className="space-y-1">
          <p className="text-[8px] font-bold text-slate-300 uppercase">Ciclo A</p>
          <p className="text-xs font-bold text-slate-400">R$ {valA.toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[8px] font-bold text-slate-300 uppercase">Ciclo B</p>
          <p className="text-sm font-black text-slate-800">R$ {valB.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className={`flex items-center gap-1 font-black text-[11px] ${colorClass}`}>
          <Icon size={14} />
          {isPositive ? '+' : ''}{Math.round(diff.pct)}%
        </div>
        <div className={`text-[10px] font-black ${colorClass}`}>
          {isPositive ? '+' : ''} R$ {Math.abs(diff.diff).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default Config;
