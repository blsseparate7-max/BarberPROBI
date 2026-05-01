
import React, { useState, useMemo } from 'react';
import { AppData, PlanningData } from '../types';
import { 
  TrendingUp, 
  AlertCircle, 
  Save, 
  RefreshCw,
  Sparkles,
  Info,
  Clock,
  LayoutDashboard,
  Target,
  ArrowRight,
  TrendingDown,
  BarChart3,
  ShieldCheck,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { savePlanning } from '../services/dataService';
import { generateFinancialAnalysis } from '../services/geminiService';

interface FinancialPlanningProps {
  data: AppData;
  setData: (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => void;
}

const FinancialPlanning: React.FC<FinancialPlanningProps> = ({ data, setData }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentPlanning = useMemo(() => {
    return data.planejamento?.find(p => p.ano === selectedYear && p.mes === selectedMonth) || {
      ano: selectedYear,
      mes: selectedMonth,
      analiseIA: ''
    } as PlanningData;
  }, [data.planejamento, selectedYear, selectedMonth]);

  // Automated Data Highlights
  const stats = useMemo(() => {
    const monthData = {
      producao: data.producao.filter(p => p.ano === selectedYear && p.mes === selectedMonth),
      gastos: data.gastos.filter(g => g.ano === selectedYear && g.mes === selectedMonth),
      receitas: data.receitasExtras.filter(r => r.ano === selectedYear && r.mes === selectedMonth)
    };

    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    
    const prevMonthData = {
      producao: data.producao.filter(p => p.ano === prevYear && p.mes === prevMonth),
      gastos: data.gastos.filter(g => g.ano === prevYear && g.mes === prevMonth),
      receitas: data.receitasExtras.filter(r => r.ano === prevYear && r.mes === prevMonth)
    };

    const totalProducao = monthData.producao.reduce((acc, p) => acc + p.producaoBruta, 0);
    const totalGastos = monthData.gastos.reduce((acc, g) => acc + g.valor, 0);
    const totalRepasses = monthData.producao.reduce((acc, p) => 
      acc + p.repasseProfissional + p.repasseAssinatura + (p.vendasProdutosComissao || 0), 0);
    const totalSaidas = totalGastos + totalRepasses;

    const totalExtras = monthData.receitas.reduce((acc, r) => 
      acc + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes + r.geladeira + r.outras, 0);
    
    const faturamentoTotal = totalProducao + totalExtras;
    const prevFaturamento = prevMonthData.producao.reduce((acc, p) => acc + p.producaoBruta, 0) + 
                          prevMonthData.receitas.reduce((acc, r) => acc + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes + r.geladeira + r.outras, 0);

    const resultado = faturamentoTotal - totalSaidas;

    console.log('--- Financial Planning Debug ---');
    console.log('Mês/Ano:', selectedMonth, selectedYear);
    console.log('Faturamento Total:', faturamentoTotal);
    console.log('Gastos Diretos:', totalGastos);
    console.log('Repasses Profissionais:', totalRepasses);
    console.log('Total Saídas:', totalSaidas);
    console.log('Resultado (Lucro/Prejuízo):', resultado);
    const crescimento = prevFaturamento > 0 ? ((faturamentoTotal - prevFaturamento) / prevFaturamento) * 100 : 0;

    const ranking = [...monthData.producao]
      .sort((a, b) => b.producaoBruta - a.producaoBruta);

    const meta = data.parametros?.find(p => p.ano === selectedYear);
    
    // Annual Projection
    const mesesPassados = data.producao.filter(p => p.ano === selectedYear && p.mes <= selectedMonth)
      .reduce((acc, p) => {
        if (!acc.includes(p.mes)) acc.push(p.mes);
        return acc;
      }, [] as number[]).length;

    const acumuladoAno = data.producao.filter(p => p.ano === selectedYear && p.mes <= selectedMonth)
      .reduce((acc, p) => acc + p.producaoBruta, 0);
    
    const mediaMensal = acumuladoAno / Math.max(1, mesesPassados);
    const projecaoFinalAno = mediaMensal * 12;

    return {
      totalProducao,
      totalGastos,
      totalRepasses,
      totalSaidas,
      faturamentoTotal,
      resultado,
      ranking,
      meta,
      crescimento,
      acumuladoAno,
      mediaMensal,
      projecaoFinalAno
    };
  }, [data, selectedYear, selectedMonth]);

  const diagnosis = useMemo(() => {
    const { faturamentoTotal, totalGastos, meta, crescimento } = stats;
    const gastoPercentual = faturamentoTotal > 0 ? (totalGastos / faturamentoTotal) * 100 : 0;
    
    if (gastoPercentual > 80 || (stats.resultado < 0)) return { 
      status: 'Pressão Financeira', 
      color: 'text-red-500', 
      bg: 'bg-red-50', 
      icon: <TrendingDown size={14} />,
      message: 'Margem curta ou prejuízo. Foco total em redução de custos fixos e aumento de ticket médio.' 
    };
    if (crescimento < 5 && meta && faturamentoTotal < meta.metaFaturamento) return { 
      status: 'Estável', 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      icon: <BarChart3 size={14} />,
      message: 'Operação rodando com segurança, mas crescimento estagnado. Hora de novas estratégias.' 
    };
    return { 
      status: 'Crescimento', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50', 
      icon: <TrendingUp size={14} />,
      message: 'Indicadores positivos. Excelente momento para reinvestir em melhorias ou expansão.' 
    };
  }, [stats]);

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const monthData = {
        producao: data.producao.filter(p => p.ano === selectedYear && p.mes === selectedMonth),
        gastos: data.gastos.filter(g => g.ano === selectedYear && g.mes === selectedMonth),
        receitas: data.receitasExtras.filter(r => r.ano === selectedYear && r.mes === selectedMonth)
      };

      const report = await generateFinancialAnalysis(
        monthData,
        data,
        selectedYear,
        selectedMonth,
        data.geminiKey
      );

      const upd: PlanningData = { ...currentPlanning, analiseIA: report };
      setData(prev => {
        const others = prev.planejamento?.filter(p => !(p.ano === selectedYear && p.mes === selectedMonth)) || [];
        return { ...prev, planejamento: [...others, upd] };
      }, { type: 'planning', payload: upd });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filters */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gestão Estratégica</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Diagnóstico Baseado em Dados Reais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl w-full md:w-auto">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border-none rounded-xl px-4 py-2 text-xs font-black text-slate-700 uppercase focus:ring-2 focus:ring-blue-100"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border-none rounded-xl px-4 py-2 text-xs font-black text-slate-700 uppercase focus:ring-2 focus:ring-blue-100"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button 
              onClick={() => {}} 
              className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Automation & Stats */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-slate-300">
             <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-white/10 rounded-lg text-blue-400"><LayoutDashboard size={18} /></div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-nowrap">Diagnóstico Automático</h3>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Faturamento Mês</span>
                    <span className="text-[10px] font-bold text-slate-500">{stats.crescimento >= 0 ? '+' : ''}{stats.crescimento.toFixed(1)}% vs mês ant.</span>
                  </div>
                  <span className="text-sm font-black tracking-tighter">R$ {stats.faturamentoTotal.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Saídas Totais</span>
                  <span className="text-sm font-black tracking-tighter text-red-400">R$ {stats.totalSaidas.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Margem Líquida</span>
                  <span className={`text-sm font-black tracking-tighter ${stats.resultado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.faturamentoTotal > 0 ? ((stats.resultado / stats.faturamentoTotal) * 100).toFixed(1) : 0}%
                  </span>
                </div>
             </div>

             <div className={`mt-8 p-4 rounded-2xl ${diagnosis.bg} border border-white/5 shadow-inner`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={diagnosis.color}>{diagnosis.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${diagnosis.color}`}>{diagnosis.status}</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                  {diagnosis.message}
                </p>
             </div>
           </div>

           {/* Annual Projection */}
           <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Target size={18} /></div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projeção do Ano {selectedYear}</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Progresso da Meta Anual</span>
                    <span className="text-xs font-black text-slate-800">{stats.meta ? ((stats.acumuladoAno / stats.meta.metaFaturamento) * 100).toFixed(1) : '0'}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.meta ? Math.min(100, (stats.acumuladoAno / stats.meta.metaFaturamento) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Média Mensal</span>
                     <p className="text-xs font-black text-slate-800">R$ {stats.mediaMensal.toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Expectativa Final</span>
                     <p className="text-xs font-black text-slate-800">R$ {stats.projecaoFinalAno.toLocaleString('pt-BR')}</p>
                   </div>
                </div>

                {stats.meta && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                      Para bater a meta de R$ {stats.meta.metaFaturamento.toLocaleString('pt-BR')}, você precisa faturar em média <span className="font-black underline">R$ {((stats.meta.metaFaturamento - stats.acumuladoAno) / Math.max(1, (12 - selectedMonth))).toLocaleString('pt-BR')}</span> nos meses restantes.
                    </p>
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* Right Column: AI Analysis & Strategic Panels */}
        <div className="lg:col-span-8 space-y-6">
           {/* Quick Strategic Panels */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
                 <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={16} className="text-red-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gargalos Identificados</h3>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-start gap-2">
                       <ChevronRight size={12} className="mt-1 text-slate-400" />
                       <p className="text-[11px] font-medium text-slate-600">
                         {stats.ranking.length > 0 && (stats.ranking[0].producaoBruta / stats.totalProducao) > 0.4 
                           ? "Alta dependência do barbeiro principal (acima de 40% da produção)." 
                           : "Distribuição de equipe equilibrada."}
                       </p>
                    </div>
                    <div className="flex items-start gap-2">
                       <ChevronRight size={12} className="mt-1 text-slate-400" />
                       <p className="text-[11px] font-medium text-slate-600">
                         {stats.totalGastos > (stats.totalProducao * 0.7) 
                           ? "Custo fixo elevado em relação à produção bruta (alerta de margem)." 
                           : "Custos operacionais dentro da zona de segurança."}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
                 <div className="flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-emerald-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Oportunidades</h3>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-start gap-2">
                       <ChevronRight size={12} className="mt-1 text-slate-400" />
                       <p className="text-[11px] font-medium text-slate-600">
                         {stats.crescimento > 10 
                           ? "Tendência de alta confirmada. Oportunidade de aumentar investimento em anúncios." 
                           : "Foco em fidelização e aumento de frequência de clientes atuais."}
                       </p>
                    </div>
                    <div className="flex items-start gap-2">
                       <ChevronRight size={12} className="mt-1 text-slate-400" />
                       <p className="text-[11px] font-medium text-slate-600">
                         {data.receitasExtras.find(r => r.ano === selectedYear && r.mes === selectedMonth && (r.assinaturas + r.pacotes) === 0) 
                           ? "Baixa penetração de assinaturas. Oportunidade de receita recorrente." 
                           : "Receita recorrente ativa. Manter foco na retenção."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* AI Analysis Button & Result */}
           <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-blue-100 border border-blue-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Feedback do Consultor IA</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise Estratégica & Decisão Prática</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleAiAnalysis}
                  disabled={isAiLoading}
                  className="group w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-100"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      Gerar Análise Estratégica <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isAiLoading ? (
                   <motion.div 
                   key="loading"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4"
                 >
                   <div className="relative">
                     <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                     <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-widest">O Gemini está analisando seus números...</p>
                 </motion.div>
                ) : currentPlanning.analiseIA ? (
                  <motion.div 
                    key="report"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-slate max-w-none prose-sm"
                  >
                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
                      <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {currentPlanning.analiseIA}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-20 text-center opacity-40">
                    <TrendingUp size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nenhuma análise gerada para este mês</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialPlanning;
