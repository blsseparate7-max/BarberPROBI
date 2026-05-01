
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell as BarCell, Legend } from 'recharts';
import { AppData } from '../types';
import { DollarSign, Crown, ArrowDownCircle, Wallet, UserCheck, Target, Scissors, TrendingUp, ChevronRight, Award } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  year: number;
}

const Dashboard: React.FC<DashboardProps> = ({ data, year }) => {
  const calculations = useMemo(() => {
    // Fallsave for empty parameters
    const safeParams = data.parametros || [];
    const params = safeParams.find(p => p.ano === year) || safeParams[0] || {
      metaFaturamento: 0,
      metaPorCadeira: 0,
      metaGastos: 0,
    };
    
    const metaAnual = params?.metaFaturamento || 0;
    
    const profissionaisAtivos = (data.profissionais || []).filter(p => p.ativo !== false);
    const metaMensalOperacional = profissionaisAtivos.reduce((acc, p) => acc + (p.metaMensal || params?.metaPorCadeira || 0), 0);
    const metaProducaoAnual = metaMensalOperacional * 12;

    const producaoAno = (data.producao || []).filter(p => p.ano === year);
    const receitasAno = (data.receitasExtras || []).filter(r => r.ano === year);
    const gastosAno = (data.gastos || []).filter(g => g.ano === year);

    const faturamentoServicos = producaoAno.reduce((acc, curr) => acc + curr.producaoBruta, 0);
    const faturamentoVendasProdutos = producaoAno.reduce((acc, curr) => acc + (curr.vendasProdutos || 0), 0);
    const faturamentoAssinaturas = receitasAno.reduce((acc, r) => acc + r.assinaturas, 0);
    const faturamentoOutros = receitasAno.reduce((acc, r) => acc + r.pacotes + r.geladeira + r.dinheiro + r.cartao + r.pix, 0);
    
    const faturamentoTotal = faturamentoServicos + faturamentoOutros + faturamentoAssinaturas + faturamentoVendasProdutos;
    const faltaParaMetaAnual = Math.max(0, metaAnual - faturamentoTotal);
    
    const ultimoMesComDados = producaoAno.length > 0 ? Math.max(...producaoAno.map(p => p.mes)) : new Date().getMonth() + 1;
    const mesesRestantes = 12 - ultimoMesComDados + 1;
    const mediaMensalNecessaria = mesesRestantes > 0 ? faltaParaMetaAnual / mesesRestantes : 0;

    const producaoMesAtual = producaoAno.filter(p => p.mes === ultimoMesComDados).reduce((acc, curr) => acc + curr.producaoBruta + (curr.vendasProdutos || 0), 0);

    const totalGastos = gastosAno.reduce((acc, curr) => acc + curr.valor, 0);
    const totalRepasses = producaoAno.reduce((acc, curr) => acc + curr.repasseProfissional + curr.repasseAssinatura + (curr.vendasProdutosComissao || 0), 0);
    const saidaTotal = totalGastos + totalRepasses;
    const saldoFinal = faturamentoTotal - saidaTotal;

    const meses = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const pMes = (producaoAno || []).filter(p => p.mes === mes);
      const rMes = (receitasAno || []).find(r => r.mes === mes);
      const prodServices = pMes.reduce((s, c) => s + c.producaoBruta, 0);
      const prodVendas = pMes.reduce((s, c) => s + (c.vendasProdutos || 0), 0);
      const subRevenue = rMes ? rMes.assinaturas : 0;
      const otherRevenue = rMes ? (rMes.pacotes + rMes.geladeira + rMes.dinheiro + rMes.cartao + rMes.pix) : 0;
      const totalMes = prodServices + prodVendas + subRevenue + otherRevenue;
      
      const repMes = pMes.reduce((s, c) => s + c.repasseProfissional + c.repasseAssinatura + (c.vendasProdutosComissao || 0), 0);
      const gMes = (gastosAno || []).filter(g => g.mes === mes).reduce((s, c) => s + c.valor, 0);
      
      const percentSub = totalMes > 0 ? (subRevenue / totalMes) * 100 : 0;

      return { 
        name: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i], 
        Faturamento: totalMes,
        Servicos: prodServices,
        Assinaturas: subRevenue,
        PercentAssinatura: percentSub,
        Lucro: totalMes - repMes - gMes
      };
    });

    const performanceIndividuais = profissionaisAtivos.map(prof => {
      const prodMesAtual = producaoAno
        .filter(p => p.mes === ultimoMesComDados && p.profissionalId === prof.id)
        .reduce((acc, curr) => acc + curr.producaoBruta, 0);
      
      const prodAnoTotal = producaoAno
        .filter(p => p.profissionalId === prof.id)
        .reduce((acc, curr) => acc + curr.producaoBruta, 0);

      const prodMesAnterior = producaoAno
        .filter(p => p.mes === (ultimoMesComDados - 1) && p.profissionalId === prof.id)
        .reduce((acc, curr) => acc + curr.producaoBruta, 0);

      const meta = prof.metaMensal || params?.metaPorCadeira || 5000;
      const porcentagem = meta > 0 ? (prodMesAtual / meta) * 100 : 0;
      
      const crescimento = prodMesAnterior > 0 ? ((prodMesAtual - prodMesAnterior) / prodMesAnterior) * 100 : 0;

      return {
        id: prof.id,
        nome: prof.nome,
        real: prodMesAtual,
        anoTotal: prodAnoTotal,
        meta: meta,
        porcentagem: Math.min(porcentagem, 100),
        rawPorcentagem: porcentagem,
        crescimento
      };
    }).sort((a, b) => b.real - a.real);

    const rankingAnual = [...performanceIndividuais].sort((a, b) => b.anoTotal - a.anoTotal);

    const alertas = [];
    if (faltaParaMetaAnual > 0) {
      alertas.push({ text: `Faltam R$ ${faltaParaMetaAnual.toLocaleString('pt-BR')} para bater a meta anual`, color: 'blue' });
    } else {
      alertas.push({ text: `Meta anual de faturamento atingida! Parabéns!`, color: 'emerald' });
    }

    performanceIndividuais.forEach(p => {
      if (p.real < p.meta && p.real > 0) {
        alertas.push({ text: `${p.nome} está abaixo da meta mensal (R$ ${p.real.toLocaleString('pt-BR')} / R$ ${p.meta.toLocaleString('pt-BR')})`, color: 'orange' });
      }
      if (p.crescimento > 10) {
        alertas.push({ text: `${p.nome} cresceu ${p.crescimento.toFixed(1)}% em relação ao mês anterior!`, color: 'emerald' });
      }
    });

    const melhorMes = [...meses].sort((a, b) => b.Lucro - a.Lucro)[0];

    // Calculo adicional de participação de assinaturas
    const mesReferencia = meses[ultimoMesComDados - 1];
    const percentSubMesAtual = mesReferencia?.Faturamento > 0 
      ? (mesReferencia.Assinaturas / mesReferencia.Faturamento) * 100 
      : 0;

    return { 
      faturamentoTotal, faturamentoAssinaturas, saidaTotal, saldoFinal, 
      melhorMes, metaAnual, metaProducaoAnual, faturamentoServicos, meses, 
      metaMensalOperacional, performanceIndividuais, ultimoMesComDados,
      producaoMesAtual, faltaParaMetaAnual, mediaMensalNecessaria, rankingAnual, alertas,
      percentSubMesAtual
    };
  }, [data, year]);

  const { 
    faturamentoTotal, faturamentoAssinaturas, saidaTotal, saldoFinal, 
    melhorMes, metaAnual, metaProducaoAnual, faturamentoServicos, meses, 
    metaMensalOperacional, performanceIndividuais, ultimoMesComDados,
    producaoMesAtual, faltaParaMetaAnual, mediaMensalNecessaria, rankingAnual, alertas,
    percentSubMesAtual
  } = calculations;

  const dataMetaAnual = [
    { name: 'Realizado', value: faturamentoTotal, fill: '#2563eb' },
    { name: 'Meta Restante', value: Math.max(0, metaAnual - faturamentoTotal), fill: '#f1f5f9' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Faturamento Ano" value={`R$ ${(faturamentoTotal || 0).toLocaleString('pt-BR')}`} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard label="Produção Mês" value={`R$ ${(producaoMesAtual || 0).toLocaleString('pt-BR')}`} icon={Scissors} color="text-indigo-600" bg="bg-indigo-50" />
        <MetricCard label="Partic. Assinaturas" value={`${(percentSubMesAtual || 0).toFixed(1)}%`} icon={UserCheck} color="text-purple-600" bg="bg-purple-50" />
        <MetricCard label="Falta para Meta" value={`R$ ${(faltaParaMetaAnual || 0).toLocaleString('pt-BR')}`} icon={Target} color="text-red-500" bg="bg-red-50" />
        <MetricCard label="Média p/ Meta" value={`R$ ${(mediaMensalNecessaria || 0).toLocaleString('pt-BR')}`} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-50" />
        <MetricCard label="Mês Destaque" value={melhorMes?.name} icon={Crown} color="text-amber-500" bg="bg-amber-50" />
      </div>

      {alertas.length > 0 && (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" /> Alertas Inteligentes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertas.map((alerta, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${alerta.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : alerta.color === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-blue-50 border-blue-100 text-blue-700'} animate-in slide-in-from-left duration-300`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-2 h-2 rounded-full ${alerta.color === 'emerald' ? 'bg-emerald-400' : alerta.color === 'orange' ? 'bg-orange-400' : 'bg-blue-400'} animate-pulse`} />
                <span className="text-[11px] font-bold">{alerta.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Target size={20} className="text-blue-600" /> Meta x Realidade Anual
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Faturamento Global vs Objetivo {year}</p>
            </div>
          </div>
          <div className="h-64 relative flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataMetaAnual} innerRadius={70} outerRadius={95} paddingAngle={0} dataKey="value" startAngle={90} endAngle={450}>
                  {dataMetaAnual.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} cornerRadius={10} />)}
                </Pie>
                <Tooltip formatter={(value: any) => value != null ? `R$ ${Number(value).toLocaleString('pt-BR')}` : ''} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[9px] font-black text-slate-400 uppercase">Progresso</p>
              <p className="text-2xl font-black text-slate-800">{metaAnual > 0 ? Math.round((faturamentoTotal / metaAnual) * 100) : 0}%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase">Realizado</p>
              <p className="text-sm font-black">R$ {(faturamentoTotal || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
              <p className="text-[8px] font-black text-blue-400 uppercase">Meta Anual</p>
              <p className="text-sm font-black">R$ {(metaAnual || 0).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Award size={20} className="text-purple-600" /> Meta Individual x Real
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Produção no mês de {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][ultimoMesComDados - 1]}</p>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {performanceIndividuais.map((prof) => (
              <div key={prof.id} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase">{prof.nome}</span>
                    <p className="text-[9px] font-bold text-slate-400">R$ {(prof.real || 0).toLocaleString('pt-BR')} de R$ {(prof.meta || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black ${prof.rawPorcentagem >= 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                      {Math.round(prof.rawPorcentagem)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${prof.rawPorcentagem >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
                    style={{ width: `${prof.porcentagem}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50">
            <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-2">
              <ChevronRight size={12} className="text-blue-500" /> Gerencie metas na aba "Equipe"
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <TrendingUp size={24} className="text-blue-600" /> Histórico de Crescimento
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Análise de produção bruta acumulada</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={meses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(value) => `R$ ${value / 1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
                formatter={(value: any, name: string) => {
                  if (name === 'PercentAssinatura') return [`${Number(value).toFixed(1)}%`, 'Partic. Assinaturas'];
                  return [`R$ ${Number(value).toLocaleString('pt-BR')}`, name];
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              <Bar dataKey="Servicos" name="Serviços" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
              <Bar dataKey="Assinaturas" name="Assinaturas" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={25} />
              <ReferenceLine y={metaMensalOperacional} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: 'META OP.', fill: '#ef4444', fontSize: 10, fontWeight: 'black' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-6 uppercase tracking-tighter">
            <Award size={20} className="text-amber-500" /> Ranking Produção MÊS ({['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][ultimoMesComDados - 1]})
          </h3>
          <div className="space-y-3">
            {performanceIndividuais.length > 0 ? performanceIndividuais.slice(0, 5).map((prof, i) => (
              <div key={prof.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[9px] ${i === 0 ? 'bg-amber-500 shadow-lg shadow-amber-100' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-600' : 'bg-slate-300'}`}>
                    {i + 1}º
                  </div>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{prof.nome}</span>
                </div>
                <span className="text-[11px] font-black text-slate-900 leading-none">R$ {(prof.real || 0).toLocaleString('pt-BR')}</span>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase py-4">Sem dados para este período</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-6 uppercase tracking-tighter">
            <Crown size={20} className="text-blue-600" /> Ranking Produção ANO ({year})
          </h3>
          <div className="space-y-3">
            {rankingAnual.length > 0 ? rankingAnual.slice(0, 5).map((prof, i) => (
              <div key={prof.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:bg-white transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[9px] ${i === 0 ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-400'}`}>
                    {i + 1}º
                  </div>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{prof.nome}</span>
                </div>
                <span className="text-[11px] font-black text-slate-900 leading-none">R$ {(prof.anoTotal || 0).toLocaleString('pt-BR')}</span>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold uppercase py-4">Sem dados para este período</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-2 group hover:scale-[1.02] transition-all">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-1`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-sm font-black text-slate-800 truncate">{value}</h3>
    </div>
  </div>
);

export default Dashboard;
