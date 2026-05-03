import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { AppData, AIFeedback } from '../types';
import { 
  DollarSign, 
  Crown, 
  ArrowDownCircle, 
  Wallet, 
  UserCheck, 
  Target, 
  Scissors, 
  TrendingUp, 
  ChevronRight, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  BrainCircuit,
  Zap,
  LineChart,
  ArrowDownRight
} from 'lucide-react';
import { generateFinancialAnalysis } from '../services/geminiService';

interface DashboardProps {
  data: AppData;
  setData: (data: AppData | ((prev: AppData) => AppData), updateInfo?: { type: string; payload: any }) => void;
  year: number;
}

const Dashboard: React.FC<DashboardProps> = ({ data, setData, year }) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const calculations = useMemo(() => {
    const safeParams = data.parametros || [];
    const params = safeParams.find(p => p.ano === year) || safeParams[0] || {
      metaFaturamento: 0,
      metaPorCadeira: 0,
      metaGastos: 0,
    };
    
    const metaAnual = params?.metaFaturamento || 0;
    const metaGastosMensal = params?.metaGastos || 0;
    
    const profissionaisAtivos = (data.profissionais || []).filter(p => p.ativo !== false);
    const metaMensalOperacional = profissionaisAtivos.reduce((acc, p) => acc + (p.metaMensal || params?.metaPorCadeira || 0), 0);

    const producaoAno = (data.producao || []).filter(p => p.ano === year);
    const receitasAno = (data.receitasExtras || []).filter(r => r.ano === year);
    const gastosAno = (data.gastos || []).filter(g => g.ano === year);

    // Mês atual (baseado em dados ou no sistema)
    const ultimoMesComDados = producaoAno.length > 0 ? Math.max(...producaoAno.map(p => p.mes)) : new Date().getMonth() + 1;
    
    // Dados Mês Atual
    const pMes = producaoAno.filter(p => p.mes === ultimoMesComDados);
    const rMes = receitasAno.find(r => r.mes === ultimoMesComDados);
    const gMes = gastosAno.filter(g => g.mes === ultimoMesComDados);

    const faturamentoServicosMes = pMes.reduce((acc, curr) => acc + curr.producaoBruta, 0);
    const faturamentoProdutosMes = pMes.reduce((acc, curr) => acc + (curr.vendasProdutos || 0), 0);
    const faturamentoAssinaturasMes = rMes?.assinaturas || 0;
    const faturamentoPacotesMes = rMes?.pacotes || 0;
    const faturamentoOutrosMes = rMes ? (rMes.geladeira + rMes.dinheiro + rMes.cartao + rMes.pix + rMes.outras) : 0;
    
    const totalReceitaMes = faturamentoServicosMes + faturamentoProdutosMes + faturamentoAssinaturasMes + faturamentoPacotesMes + faturamentoOutrosMes;
    
    const gastosDiretosMes = gMes.reduce((acc, curr) => acc + curr.valor, 0);
    const repassesProfissionaisMes = pMes.reduce((acc, curr) => acc + curr.repasseProfissional + curr.repasseAssinatura + (curr.vendasProdutosComissao || 0), 0);
    const totalSaidasMes = gastosDiretosMes + repassesProfissionaisMes;
    const lucroMes = totalReceitaMes - totalSaidasMes;
    
    const percentGastoMes = totalReceitaMes > 0 ? (totalSaidasMes / totalReceitaMes) * 100 : 0;

    // Métricas Anuais
    const faturamentoServicosAno = producaoAno.reduce((acc, curr) => acc + curr.producaoBruta, 0);
    const faturamentoProdutosAno = producaoAno.reduce((acc, curr) => acc + (curr.vendasProdutos || 0), 0);
    const faturamentoAssinaturasAno = receitasAno.reduce((acc, r) => acc + r.assinaturas, 0);
    const faturamentoPacotesAno = receitasAno.reduce((acc, r) => acc + r.pacotes, 0);
    const faturamentoOutrosAno = receitasAno.reduce((acc, r) => acc + r.geladeira + r.dinheiro + r.cartao + r.pix + r.outras, 0);
    const faturamentoTotalAno = faturamentoServicosAno + faturamentoProdutosAno + faturamentoAssinaturasAno + faturamentoPacotesAno + faturamentoOutrosAno;
    
    const repassesAno = producaoAno.reduce((acc, curr) => acc + curr.repasseProfissional + curr.repasseAssinatura + (curr.vendasProdutosComissao || 0), 0);
    const gastosAnoTotal = (gastosAno || []).reduce((acc, curr) => acc + curr.valor, 0);
    const totalSaidasAno = gastosAnoTotal + repassesAno;
    const lucroAno = faturamentoTotalAno - totalSaidasAno;
    const percentGastoAno = faturamentoTotalAno > 0 ? (totalSaidasAno / faturamentoTotalAno) * 100 : 0;

    // Cálculo Mês a Mês para Dashboard Anual
    const mesesData = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const pMesLocal = producaoAno.filter(p => p.mes === mes);
      const rMesLocal = receitasAno.find(r => r.mes === mes);
      const gMesLocal = (gastosAno || []).filter(g => g.mes === mes);

      const fServicos = pMesLocal.reduce((s, c) => s + c.producaoBruta, 0);
      const fProdutos = pMesLocal.reduce((s, c) => s + (c.vendasProdutos || 0), 0);
      const fAssinaturas = rMesLocal?.assinaturas || 0;
      const fPacotes = rMesLocal?.pacotes || 0;
      const fOutros = rMesLocal ? (rMesLocal.geladeira + rMesLocal.dinheiro + rMesLocal.cartao + rMesLocal.pix + rMesLocal.outras) : 0;
      
      const totalFaturamento = fServicos + fProdutos + fAssinaturas + fPacotes + fOutros;
      
      const respassesMes = pMesLocal.reduce((s, c) => s + c.repasseProfissional + c.repasseAssinatura + (c.vendasProdutosComissao || 0), 0);
      const gastosMes = gMesLocal.reduce((s, c) => s + c.valor, 0);
      const totalSaidasMes = respassesMes + gastosMes;
      
      return {
        name: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        Faturamento: totalFaturamento,
        Saidas: totalSaidasMes,
        Lucro: totalFaturamento - totalSaidasMes,
        mes
      };
    });

    // Mês Destaque e Mês Mais Caro
    const mesDestaque = [...mesesData].sort((a, b) => b.Faturamento - a.Faturamento)[0];
    const mesMaisCaro = [...mesesData].sort((a, b) => b.Saidas - a.Saidas)[0];

    // Projeções
    const mediaMensalFaturamento = ultimoMesComDados > 0 ? faturamentoTotalAno / ultimoMesComDados : 0;
    const projecaoAnual = mediaMensalFaturamento * 12;
    const mesesRestantes = 12 - ultimoMesComDados;
    const faltaParaMetaAnual = Math.max(0, metaAnual - faturamentoTotalAno);
    const valorMensalNecessarioParaMeta = mesesRestantes > 0 ? faltaParaMetaAnual / mesesRestantes : 0;

    // Performance Individual % Participação ANUAL
    const performanceIndividuais = profissionaisAtivos.map(prof => {
      const pProfAno = producaoAno.filter(p => p.profissionalId === prof.id);
      const valProfAno = pProfAno.reduce((acc, curr) => acc + curr.producaoBruta, 0);
      const participacao = faturamentoTotalAno > 0 ? (valProfAno / faturamentoTotalAno) * 100 : 0;
      
      return {
        id: prof.id,
        nome: prof.nome,
        ano: valProfAno,
        participacao,
        meta: (prof.metaMensal || params?.metaPorCadeira || 0) * 12
      };
    }).sort((a, b) => b.ano - a.ano);

    // Alertas Automáticos Estratégicos
    const alertas = [];
    
    // Alerta de Lucratividade
    if (lucroAno < 0) {
      alertas.push({ text: "Operação Anual com prejuízo acumulado. Revisão urgente de custos.", severity: "danger", icon: AlertTriangle });
    }

    // Alerta de % de Gasto
    if (percentGastoAno > 65) {
      alertas.push({ text: "Eficiência de custos crítica: Despesas consomem >65% da receita.", severity: "danger", icon: DollarSign });
    } else if (percentGastoAno > 50) {
      alertas.push({ text: "Atenção: Despesas acima de 50% do faturamento bruto.", severity: "warning", icon: Info });
    }
    
    // Queda de crescimento (Comparar último mês com anterior)
    const fatUltimoMes = mesesData[ultimoMesComDados - 1]?.Faturamento || 0;
    const fatMesAnterior = mesesData[ultimoMesComDados - 2]?.Faturamento || 0;
    if (ultimoMesComDados > 1 && fatUltimoMes < fatMesAnterior * 0.9) {
      alertas.push({ text: "Alerta de desaceleração: Faturamento em queda vs mês anterior.", severity: "danger", icon: TrendingUp });
    }
    
    // Alerta de Dependência
    if (performanceIndividuais.length > 0 && performanceIndividuais[0].participacao > 40) {
      alertas.push({ text: `Risco de concentração: ${performanceIndividuais[0].nome} detém ${performanceIndividuais[0].participacao.toFixed(1)}% do faturamento anual.`, severity: "warning", icon: UserCheck });
    }

    // Alerta de Meta Anual
    if (projecaoAnual < metaAnual && metaAnual > 0) {
      alertas.push({ text: `Meta Anual em Risco: Projeção atual indica ${Math.round((projecaoAnual/metaAnual)*100)}% de alcance.`, severity: "danger", icon: Target });
    }

    // Meses Fracos
    const mesesFracos = mesesData.filter(m => m.mes <= ultimoMesComDados && m.Faturamento < mediaMensalFaturamento * 0.7);
    if (mesesFracos.length > 0) {
      alertas.push({ text: `Identificados ${mesesFracos.length} meses com desempenho crítico (abaixo de 70% da média).`, severity: "warning", icon: ArrowDownCircle });
    }

    return {
      faturamentoTotalAno,
      faturamentoServicosAno,
      faturamentoAssinaturasAno,
      faturamentoPacotesAno,
      faturamentoProdutosAno,
      faturamentoOutrosAno,
      totalSaidasAno,
      lucroAno,
      percentGastoAno,
      performanceIndividuais,
      alertas,
      projecaoAnual,
      faltaParaMetaAnual,
      valorMensalNecessarioParaMeta,
      mediaMensalFaturamento,
      metaAnual,
      mesesData,
      ultimoMesComDados,
      mesDestaque,
      mesMaisCaro,
      params,
      totalReceitaMes: fatUltimoMes,
      lucroMes: mesesData[ultimoMesComDados-1]?.Lucro || 0
    };

  }, [data, year]);

  const stats = calculations;
  const { params } = stats;

  // Carregar análise da IA salva ou gerar
  useEffect(() => {
    const savedFeedback = (data.aiFeedbacks || []).find(f => 
      f.ano === year && f.mes === stats.ultimoMesComDados && f.tipo === 'geral'
    );
    if (savedFeedback) {
      setAiAnalysis(savedFeedback.conteudo);
    } else {
      setAiAnalysis(null);
    }
  }, [data.aiFeedbacks, year, stats.ultimoMesComDados]);

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const monthData = {
        producao: (data.producao || []).filter(p => p.ano === year && p.mes === stats.ultimoMesComDados),
        gastos: (data.gastos || []).filter(g => g.ano === year && g.mes === stats.ultimoMesComDados),
        receitas: (data.receitasExtras || []).filter(r => r.ano === year && r.mes === stats.ultimoMesComDados)
      };

      const analysis = await generateFinancialAnalysis(monthData, data, year, stats.ultimoMesComDados, data.geminiKey);
      setAiAnalysis(analysis);

      // Salvar como feedback geral
      const feedback: AIFeedback = {
        id: `dashboard-${year}-${stats.ultimoMesComDados}`,
        ano: year,
        mes: stats.ultimoMesComDados,
        conteudo: analysis,
        timestamp: new Date().toISOString(),
        tipo: 'geral'
      };

      setData(prev => ({
        ...prev,
        aiFeedbacks: [...(prev.aiFeedbacks || []).filter(f => f.id !== feedback.id), feedback]
      }), { type: 'ai_feedback', payload: feedback });

    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32">
      {/* 1. TOP OVERVIEW - ANNUAL STRATEGY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DecisionCard 
          label="Receita Total Anual" 
          value={`R$ ${stats.faturamentoTotalAno.toLocaleString('pt-BR')}`} 
          subLabel="Acumulado bruto do ano"
          icon={TrendingUp} 
          color="blue"
          highlight
        />
        <DecisionCard 
          label="Despesas Anuais" 
          value={`R$ ${stats.totalSaidasAno.toLocaleString('pt-BR')}`} 
          subLabel="Custos + Repasses + Gastos"
          icon={ArrowDownCircle} 
          color="red"
        />
        <DecisionCard 
          label="Resultado Líquido" 
          value={`R$ ${stats.lucroAno.toLocaleString('pt-BR')}`} 
          subLabel={stats.lucroAno >= 0 ? "Margem de Lucro Real" : "Prejuízo Operacional"}
          icon={Wallet} 
          color={stats.lucroAno >= 0 ? "emerald" : "red"}
          highlight
        />
        <DecisionCard 
          label="Eficiência de Custos" 
          value={`${stats.percentGastoAno.toFixed(1)}%`} 
          subLabel={stats.percentGastoAno < 50 ? "Verde: < 50% de gasto" : stats.percentGastoAno <= 65 ? "Amarelo: 50-65%" : "Vermelho: > 65%"}
          icon={Zap} 
          color={stats.percentGastoAno < 50 ? "emerald" : stats.percentGastoAno <= 65 ? "amber" : "red"}
          indicator
        />
      </div>

      {/* 2. STRATEGIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Destaque (Faturamento)</p>
            <p className="text-lg font-black text-slate-800">{stats.mesDestaque ? `${stats.mesDestaque.name} — R$ ${stats.mesDestaque.Faturamento.toLocaleString('pt-BR')}` : 'Sem dados'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Mais Caro (Despesa)</p>
            <p className="text-lg font-black text-slate-800">{stats.mesMaisCaro ? `${stats.mesMaisCaro.name} — R$ ${stats.mesMaisCaro.Saidas.toLocaleString('pt-BR')}` : 'Sem dados'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <LineChart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média Mensal</p>
            <p className="text-lg font-black text-slate-800">R$ {stats.mediaMensalFaturamento.toLocaleString('pt-BR')} /mês</p>
          </div>
        </div>
      </div>

      {/* 2. META ANUAL PROGRESS */}
      <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Progresso da Meta Anual</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Realizado vs Objetivo</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-blue-600">
              {stats.metaAnual > 0 ? ((stats.faturamentoTotalAno / stats.metaAnual) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-1000" 
            style={{ width: `${Math.min(100, (stats.faturamentoTotalAno / (stats.metaAnual || 1)) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: GROWTH & PROJECTION */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PROJECTION BANNER */}
          <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Estimativa de Encerramento</h4>
              <p className="text-xl font-medium">Se o ritmo persistir, o ano fechará em <span className="font-black text-blue-400">R$ {stats.projecaoAnual.toLocaleString('pt-BR')}</span></p>
            </div>
            <div className="flex gap-4">
              <div className="text-center md:text-right px-6 border-l border-slate-700">
                <p className="text-[10px] font-black text-slate-500 uppercase">Gap p/ Meta</p>
                <p className={`text-xl font-black ${stats.projecaoAnual >= stats.metaAnual ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.projecaoAnual >= stats.metaAnual ? '+' : '-'} R$ {Math.abs(stats.metaAnual - stats.projecaoAnual).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-center md:text-right px-6 border-l border-slate-700">
                <p className="text-[10px] font-black text-slate-500 uppercase">Meta Mensal Restante</p>
                <p className="text-xl font-black text-white">R$ {stats.valorMensalNecessarioParaMeta.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* HISTORIC CHART */}
          <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100">
             <header className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-indigo-600" /> Evolução Financeira Anual
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo mensal de faturamento e lucro</p>
              </div>
            </header>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mesesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} />
                  <Bar dataKey="Faturamento" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="Lucro" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REVENUES, TEAM, ALERTS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* ANNUAL REVENUE SPLIT */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" /> Composição Anual
            </h3>
            <div className="space-y-4">
              <RevenueRow label="Serviços" value={stats.faturamentoServicosAno} icon={Scissors} />
              <RevenueRow label="Assinaturas" value={stats.faturamentoAssinaturasAno} icon={UserCheck} color="purple" />
              <RevenueRow label="Pacotes" value={stats.faturamentoPacotesAno} icon={Zap} color="amber" />
              <RevenueRow label="Produtos" value={stats.faturamentoProdutosAno} icon={Crown} color="blue" />
            </div>
          </div>

          {/* TEAM RANKING (ANNUAL) */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
             <header className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <Award size={18} className="text-amber-500" /> Ranking Anual
                </h3>
             </header>
             <div className="space-y-5">
               {stats.performanceIndividuais.length > 0 ? stats.performanceIndividuais.slice(0, 5).map((p, i) => (
                 <div key={p.id}>
                   <div className="flex justify-between items-center mb-1.5">
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{i+1}º {p.nome}</span>
                     <span className="text-[10px] font-black text-slate-400">R$ {p.ano.toLocaleString('pt-BR')} ({p.participacao.toFixed(1)}%)</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                     <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${p.participacao}%` }}
                     />
                   </div>
                 </div>
               )) : <p className="text-xs text-slate-400 font-bold uppercase">Sem dados</p>}
             </div>
          </div>

          {/* STRATEGIC ALERTS */}
          <div className={`p-8 rounded-[40px] shadow-sm border ${stats.alertas.length > 0 ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Diagnóstico de Risco
            </h3>
            <div className="space-y-3">
              {stats.alertas.length > 0 ? stats.alertas.map((alerta, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${
                    alerta.severity === 'danger' ? 'bg-red-50 border-red-100 text-red-700' : 
                    alerta.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                    'bg-blue-50 border-blue-100 text-blue-700'
                  }`}
                >
                  <alerta.icon size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold leading-tight">{alerta.text}</p>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <CheckCircle2 size={32} strokeWidth={1.5} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase">KPIs Anuais em Conformidade</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. SMART AI SUMMARY */}
      <div className="bg-slate-900 p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={120} className="text-blue-400" />
        </div>
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/20 p-2 rounded-xl">
                <BrainCircuit size={24} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Resumo Inteligente do Gestor</h3>
            </div>
            <p className="text-blue-400/60 text-xs font-bold uppercase tracking-widest">Análise estratégica baseada em IA ({['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][stats.ultimoMesComDados - 1]})</p>
          </div>
          
          <button
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl shadow-blue-900/20"
          >
            {isGeneratingAi ? 'Processando Dados...' : aiAnalysis ? 'Atualizar Insights' : 'Gerar Diagnóstico'}
          </button>
        </header>

        <div className="relative z-10 min-h-[120px] flex items-center">
          {isGeneratingAi ? (
            <div className="w-full space-y-4">
              <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse" />
            </div>
          ) : aiAnalysis ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 whitespace-pre-wrap font-medium leading-relaxed">
                 {aiAnalysis}
               </div>
            </div>
          ) : (
            <div className="text-slate-500 italic text-center w-full">
              Solicite um diagnóstico para que a IA analise o comportamento financeiro deste mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DecisionCard = ({ label, value, subLabel, icon: Icon, color, highlight, indicator }: any) => {
  const colors: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50/30 text-blue-600',
    indigo: 'border-indigo-100 bg-indigo-50/30 text-indigo-600',
    emerald: 'border-emerald-100 bg-emerald-50/30 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50/30 text-amber-600',
    red: 'border-red-100 bg-red-50/30 text-red-600',
  };

  return (
    <div className={`p-6 rounded-[32px] border transition-all ${highlight ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${highlight ? 'bg-blue-600 text-white' : colors[color]}`}>
          <Icon size={20} />
        </div>
        {indicator && (
          <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
            Meta
          </div>
        )}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <h3 className="text-xl font-black tracking-tight">{value}</h3>
        <p className={`text-[9px] font-bold mt-1 ${highlight ? 'text-blue-400' : 'text-slate-400'}`}>{subLabel}</p>
      </div>
    </div>
  );
};

const RevenueRow = ({ label, value, icon: Icon, color = 'blue' }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900">R$ {value.toLocaleString('pt-BR')}</span>
    </div>
  );
};

export default Dashboard;
