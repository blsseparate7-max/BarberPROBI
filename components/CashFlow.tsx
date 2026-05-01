
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, ProducaoMensal, ReceitasExtras, GastoMensal, ParametrosAnuais, Profissional } from '../types';
import { PlusCircle, X, Save, Edit2, Eye, TrendingUp, UserCheck, Plus, ArrowDownRight, Scissors, Target, PieChart as PieChartIcon, Award, UserPlus, UserMinus, BarChart2, Wallet, Users, DollarSign, Star, Trophy, Sparkles, Settings2, Trash2, Check, CreditCard, Banknote, Smartphone, Gift, ArrowUpRight, Percent, ShoppingBag } from 'lucide-react';

interface CashFlowProps {
  data: AppData;
  setData: (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => void | Promise<void>;
  year: number;
}

const CashFlow: React.FC<CashFlowProps> = ({ data, setData, year }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [tempCatName, setTempCatName] = useState('');
  
  const currentParams = data.parametros.find(p => p.ano === year) || data.parametros[0] || { metaFaturamento: 0 };
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const ativos = useMemo(() => data.profissionais.filter(p => p.ativo !== false), [data.profissionais]);

  const [formData, setFormData] = useState({
    mes: new Date().getMonth() + 1,
    dinheiro: 0,
    cartao: 0,
    pix: 0,
    assinaturas: 0,
    pacotes: 0,
    novosAssinantes: 0,
    cancelamentosAssinantes: 0,
    producoes: ativos.map(p => ({ 
      id: p.id, 
      nome: p.nome, 
      bruta: 0, 
      repasse: 0, 
      assinatura: 0, 
      vendasProdutos: 0, 
      vendasProdutosComissao: 0,
      quantidadeAtendimentos: 0,
      atendimentosAssinatura: 0
    })),
    gastos: data.categoriasGastos.map(cat => ({ categoria: cat, valor: 0 }))
  });

  const handleUpdateMetaAnual = (val: number) => {
    const p = data.parametros.find(x => x.ano === year);
    if (!p) return;
    const updated = { ...p, metaFaturamento: val };
    setData(prev => ({
      ...prev,
      parametros: prev.parametros.map(x => x.ano === year ? updated : x)
    }), { type: 'parametro', payload: updated });
  };

  useEffect(() => {
    if (showModal) {
      const extra = data.receitasExtras.find(r => r.ano === year && r.mes === formData.mes);
      const prods = ativos.map(prof => {
        const p = data.producao.find(p => p.ano === year && p.mes === formData.mes && p.profissionalId === prof.id);
        return { 
          id: prof.id, 
          nome: prof.nome, 
          bruta: p?.producaoBruta || 0, 
          repasse: p?.repasseProfissional || 0,
          assinatura: p?.repasseAssinatura || 0, 
          vendasProdutos: p?.vendasProdutos || 0,
          vendasProdutosComissao: p?.vendasProdutosComissao || 0,
          quantidadeAtendimentos: p?.quantidadeAtendimentos || 0,
          atendimentosAssinatura: p?.atendimentosAssinatura || 0
        };
      });
      const gastos = data.categoriasGastos.map(cat => {
        const g = data.gastos.find(g => g.ano === year && g.mes === formData.mes && g.categoria === cat);
        return { categoria: cat, valor: g?.valor || 0 };
      });

      setFormData(prev => ({
        ...prev,
        dinheiro: extra?.dinheiro || 0, cartao: extra?.cartao || 0, pix: extra?.pix || 0,
        assinaturas: extra?.assinaturas || 0, pacotes: extra?.pacotes || 0,
        novosAssinantes: extra?.novosAssinantes || 0, cancelamentosAssinantes: extra?.cancelamentosAssinantes || 0,
        producoes: prods, gastos: gastos
      }));
    }
  }, [formData.mes, showModal, ativos, data.categoriasGastos, data.receitasExtras, data.producao, data.gastos, year]);

  const matrix = useMemo(() => meses.map((nome, i) => {
    const mes = i + 1;
    const prod = data.producao.filter(p => p.ano === year && p.mes === mes);
    const extra = data.receitasExtras.find(r => r.ano === year && r.mes === mes);
    const gastosList = data.gastos.filter(g => g.ano === year && g.mes === mes);
    
    const gastosTotal = gastosList.reduce((s, c) => s + c.valor, 0);
    
    const faturamentoServicos = prod.reduce((s, c) => s + c.producaoBruta, 0);
    const faturamentoProdutos = prod.reduce((s, c) => s + (c.vendasProdutos || 0), 0);
    const faturamentoExtras = (extra?.dinheiro || 0) + (extra?.cartao || 0) + (extra?.pix || 0) + (extra?.assinaturas || 0) + (extra?.pacotes || 0);
    
    const bruta = faturamentoServicos + faturamentoProdutos + faturamentoExtras;
    
    const repasse = prod.reduce((s, c) => s + c.repasseProfissional + c.repasseAssinatura + (c.vendasProdutosComissao || 0), 0);
    const liquido = bruta - repasse - gastosTotal;
    
    return { nome, mes, bruta, repasse, gastosTotal, liquido, extra, prod, gastosList, faturamentoProdutos, faturamentoServicos };
  }), [data, year]);

  const monthDashboard = useMemo(() => {
    if (selectedMonth === null) return null;
    const m = matrix[selectedMonth - 1];
    
    const uniqueIdsNoMes = Array.from(new Set(m.prod.map(p => p.profissionalId)));
    const profsNoMes = data.profissionais.filter(p => uniqueIdsNoMes.includes(p.id) || p.ativo !== false);

    const profData = profsNoMes.map(prof => {
      const p = m.prod.find(p => p.profissionalId === prof.id);
      const totalProd = p?.producaoBruta || 0;
      const comissaoProducao = p?.repasseProfissional || 0;
      const recebidoAssinatura = p?.repasseAssinatura || 0;
      const comissaoVendas = p?.vendasProdutosComissao || 0;
      const vendasBruto = p?.vendasProdutos || 0;
      
      const totalRecebidoBarbeiro = comissaoProducao + recebidoAssinatura + comissaoVendas;
      const saldoBarbeariaServico = totalProd - comissaoProducao;

      return { 
        id: prof.id,
        nome: prof.nome, 
        totalProd, 
        vendasBruto,
        comissaoProducao, 
        recebidoAssinatura, 
        comissaoVendas,
        totalRecebidoBarbeiro, 
        saldoBarbeariaServico 
      };
    }).filter(p => p.totalProd > 0 || p.vendasBruto > 0 || data.profissionais.find(pr => pr.id === p.id)?.ativo !== false);

    const totalProducaoBruta = profData.reduce((s, p) => s + p.totalProd, 0);
    const totalVendasProdutos = profData.reduce((s, p) => s + p.vendasBruto, 0);
    const totalComissoesPagas = profData.reduce((s, p) => s + p.comissaoProducao, 0);
    const totalRepassesAssinatura = profData.reduce((s, p) => s + p.recebidoAssinatura, 0);
    const totalComissoesVendas = profData.reduce((s, p) => s + p.comissaoVendas, 0);
    
    const saldoFinalFechamento = m.bruta - m.repasse - m.gastosTotal;

    const incomeCategories = [
      { name: 'Dinheiro', value: m.extra?.dinheiro || 0, icon: Banknote },
      { name: 'Cartão', value: m.extra?.cartao || 0, icon: CreditCard },
      { name: 'Pix', value: m.extra?.pix || 0, icon: Smartphone },
      { name: 'Assinaturas', value: m.extra?.assinaturas || 0, icon: UserCheck },
      { name: 'Pacotes', value: m.extra?.pacotes || 0, icon: Gift },
      { name: 'Serviços Diretos', value: totalProducaoBruta, icon: Scissors },
      { name: 'Vendas Produtos', value: totalVendasProdutos, icon: ShoppingBag },
    ].filter(cat => cat.value > 0).sort((a, b) => b.value - a.value);

    const combinedExpenses = [
      ...m.gastosList.map(g => ({ name: g.categoria, value: g.valor, icon: ArrowDownRight, isRepasse: false })),
      { name: 'Comissões de Serviços', value: totalComissoesPagas, icon: Users, isRepasse: true },
      { name: 'Repasses de Assinatura', value: totalRepassesAssinatura, icon: Wallet, isRepasse: true },
      { name: 'Comissões de Vendas', value: totalComissoesVendas, icon: ShoppingBag, isRepasse: true }
    ].filter(ex => ex.value > 0).sort((a, b) => b.value - a.value);

    const totalSaidasGeral = m.repasse + m.gastosTotal;

    const profRanking = profData.sort((a,b) => b.totalProd - a.totalProd);
    
    // Regra específica: Gabriel Alexandre não pode ser destaque
    const destaqueMes = profRanking.filter(p => p.nome.toLowerCase() !== 'gabriel alexandre').sort((a,b) => b.totalProd - a.totalProd)[0];

    return { 
      ...m, 
      incomeCategories,
      combinedExpenses,
      profRanking, 
      destaqueMes,
      totalProducaoBruta, 
      totalVendasProdutos,
      totalComissoesPagas, 
      totalRepassesAssinatura, 
      totalSaidasGeral,
      saldoFinalFechamento
    };
  }, [selectedMonth, matrix, data.profissionais]);

  const handleSaveClosing = () => {
    const newExtra: ReceitasExtras = {
      ano: year, mes: formData.mes, dinheiro: formData.dinheiro, cartao: formData.cartao,
      pix: formData.pix, assinaturas: formData.assinaturas, pacotes: formData.pacotes,
      geladeira: 0, outras: 0, novosAssinantes: formData.novosAssinantes, cancelamentosAssinantes: formData.cancelamentosAssinantes
    };
    const newProducao: ProducaoMensal[] = formData.producoes.map(p => ({
      ano: year, 
      mes: formData.mes, 
      profissionalId: p.id, 
      producaoBruta: p.bruta,
      repasseProfissional: p.repasse, 
      repasseAssinatura: p.assinatura,
      recebidoPelaCasa: p.bruta - p.repasse - p.assinatura,
      vendasProdutos: p.vendasProdutos, 
      vendasProdutosComissao: p.vendasProdutosComissao,
      quantidadeAtendimentos: p.quantidadeAtendimentos,
      atendimentosAssinatura: p.atendimentosAssinatura
    }));
    const newGastos: GastoMensal[] = formData.gastos.map(g => ({ ano: year, mes: formData.mes, categoria: g.categoria, valor: g.valor }));

    setData(prev => ({
      ...prev,
      receitasExtras: [...prev.receitasExtras.filter(r => !(r.ano === year && r.mes === formData.mes)), newExtra],
      producao: [...prev.producao.filter(p => !(p.ano === year && p.mes === formData.mes)), ...newProducao],
      gastos: [...prev.gastos.filter(g => !(g.ano === year && g.mes === formData.mes)), ...newGastos]
    }), { 
      type: 'fechamento_mes', 
      payload: { extra: newExtra, producao: newProducao, gastos: newGastos } 
    });
    setShowModal(false);
  };

  const addCategory = () => {
    if (!newCatName || data.categoriasGastos.includes(newCatName)) return;
    setData({ ...data, categoriasGastos: [...data.categoriasGastos, newCatName] });
    setNewCatName('');
  };

  const removeCategory = (cat: string) => {
    if (confirm(`Ao excluir a categoria "${cat}", todos os gastos históricos registrados nela serão perdidos. Confirmar?`)) {
      setData({
        ...data,
        categoriasGastos: data.categoriasGastos.filter(c => c !== cat),
        gastos: data.gastos.filter(g => g.categoria !== cat)
      });
    }
  };

  const startEditCategory = (index: number, name: string) => {
    setEditingCatIndex(index);
    setTempCatName(name);
  };

  const saveEditedCategory = (oldName: string) => {
    if (!tempCatName || data.categoriasGastos.includes(tempCatName)) {
      setEditingCatIndex(null);
      return;
    }
    const newCategories = [...data.categoriasGastos];
    newCategories[editingCatIndex!] = tempCatName;
    const newGastos = data.gastos.map(g => g.categoria === oldName ? { ...g, categoria: tempCatName } : g);
    setData({ ...data, categoriasGastos: newCategories, gastos: newGastos });
    setEditingCatIndex(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-slate-950 p-10 rounded-[48px] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
        <div className="flex items-center gap-5 z-10">
          <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20 rotate-3">
            <Target size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">Objetivo Estratégico {year}</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase mt-1 tracking-widest text-left">Faturamento anual esperado</p>
          </div>
        </div>
        <div className="w-full md:w-auto flex flex-col items-end z-10">
          <label className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Alvo Anual (R$)</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 font-black text-2xl">R$</span>
            <input 
              type="number" 
              value={currentParams.metaFaturamento} 
              onChange={(e) => handleUpdateMetaAnual(Number(e.target.value))}
              className="bg-white/5 border border-white/10 p-5 pl-14 rounded-[28px] text-white font-black text-3xl w-full md:w-72 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Fluxo de Caixa</h2>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Lançamentos mensais consolidados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)} className="bg-white text-slate-600 px-6 py-4 rounded-[24px] font-black text-xs uppercase shadow-sm border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Settings2 size={18} /> Categorias
          </button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase shadow-xl shadow-blue-100 flex items-center gap-2 hover:scale-105 transition-all">
            <PlusCircle size={18} /> Novo Fechamento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Mês</th>
              <th className="px-8 py-6 text-right">Faturamento Total</th>
              <th className="px-8 py-6 text-right">Saídas (Repasses+Gastos)</th>
              <th className="px-8 py-6 text-right">Lucro Líquido</th>
              <th className="px-8 py-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {matrix.map((m) => (
              <tr key={m.nome} className="hover:bg-blue-50/20 transition-all group">
                <td className="px-8 py-6 font-black text-slate-800 text-base">{m.nome}</td>
                <td className="px-8 py-6 text-right font-bold text-slate-600">R$ {(m.bruta || 0).toLocaleString('pt-BR')}</td>
                <td className="px-8 py-6 text-right text-red-500 font-bold">R$ {((m.repasse || 0) + (m.gastosTotal || 0)).toLocaleString('pt-BR')}</td>
                <td className={`px-8 py-6 text-right font-black text-base ${(m.liquido || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  R$ {(m.liquido || 0).toLocaleString('pt-BR')}
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedMonth(m.mes); setShowDetailModal(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Ver Detalhamento"><Eye size={16} /></button>
                    <button onClick={() => { setFormData(prev => ({ ...prev, mes: m.mes })); setShowModal(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Editar"><Edit2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col my-auto">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Categorias de Despesas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Gerencie custos operacionais</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="bg-slate-100 p-4 rounded-full text-slate-400 hover:bg-slate-200"><X /></button>
            </div>
            <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex gap-2">
                <input type="text" placeholder="Nova categoria..." className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <button onClick={addCategory} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={20} /></button>
              </div>
              <div className="space-y-3">
                {data.categoriasGastos.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    {editingCatIndex === idx ? (
                      <input autoFocus type="text" className="flex-1 bg-white border border-blue-200 p-2 rounded-xl font-bold text-sm outline-none" value={tempCatName} onChange={(e) => setTempCatName(e.target.value)} onBlur={() => saveEditedCategory(cat)} onKeyDown={(e) => e.key === 'Enter' && saveEditedCategory(cat)} />
                    ) : (
                      <span className="font-bold text-slate-700 text-sm">{cat}</span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingCatIndex === idx ? (
                        <button onClick={() => saveEditedCategory(cat)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl"><Check size={16} /></button>
                      ) : (
                        <button onClick={() => startEditCategory(idx, cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 size={16} /></button>
                      )}
                      <button onClick={() => removeCategory(cat)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && monthDashboard && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-7xl h-fit max-md:min-h-[95vh] md:h-[95vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 my-auto">
            <header className="p-10 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Painel Detalhado • {monthDashboard.nome} / {year}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Fechamento consolidado do mês</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="bg-slate-100 p-5 rounded-full text-slate-400 hover:bg-slate-200"><X /></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <SummaryCard label="Serviços (Bruto)" value={`R$ ${(monthDashboard.totalProducaoBruta || 0).toLocaleString('pt-BR')}`} icon={Scissors} color="text-slate-700" bg="bg-white" sub="Geração Direta" />
                <SummaryCard label="Produtos (Bruto)" value={`R$ ${(monthDashboard.totalVendasProdutos || 0).toLocaleString('pt-BR')}`} icon={ShoppingBag} color="text-purple-600" bg="bg-white" sub="Venda no Balcão" />
                <SummaryCard label="Valor das assinaturas" value={`R$ ${(monthDashboard.extra?.assinaturas || 0).toLocaleString('pt-BR')}`} icon={UserCheck} color="text-blue-600" bg="bg-blue-50/50" sub="Faturamento Clube" />
                <SummaryCard label="Total Saídas (Repasses+Gastos)" value={`R$ ${(monthDashboard.totalSaidasGeral || 0).toLocaleString('pt-BR')}`} icon={ArrowDownRight} color="text-rose-500" bg="bg-white" sub="Total de Desembolso" />
                <SummaryCard label="Total Pago aos Barbeiros" value={`R$ ${(monthDashboard.repasse || 0).toLocaleString('pt-BR')}`} icon={Users} color="text-blue-700" bg="bg-blue-100/50" sub="Comissão + Assinatura" />
                <SummaryCard label="Saldo Final Barbearia" value={`R$ ${(monthDashboard.saldoFinalFechamento || 0).toLocaleString('pt-BR')}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" sub="Lucro Real do Mês" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Destaque do Mês */}
                <div className="bg-slate-900 p-10 rounded-[56px] shadow-2xl relative overflow-hidden flex flex-col justify-center border border-white/5">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white"><Trophy size={28} /></div>
                    <div>
                      <h4 className="text-xl font-black text-white leading-tight">Destaque do Mês</h4>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Performance Individual</p>
                    </div>
                  </div>
                  {monthDashboard.destaqueMes ? (
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissional</p>
                        <h5 className="text-3xl font-black text-white uppercase tracking-tighter">{monthDashboard.destaqueMes.nome}</h5>
                      </div>
                      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Recebido no Mês</p>
                        <h6 className="text-4xl font-black text-white">R$ {(monthDashboard.destaqueMes.totalRecebidoBarbeiro || 0).toLocaleString('pt-BR')}</h6>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">(Comissões + Repasse Assinatura)</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-bold text-xs">Sem dados suficientes.</p>
                  )}
                </div>

                <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm flex flex-col h-full relative overflow-hidden">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><TrendingUp size={28} className="text-emerald-500" /> Fontes de Entrada</h4>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {monthDashboard.incomeCategories.map((cat, idx) => {
                      const Icon = cat.icon;
                      const percentage = (cat.value / (monthDashboard.bruta || 1)) * 100;
                      return (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 rounded-xl transition-all">
                                <Icon size={18} />
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">R$ {(cat.value || 0).toLocaleString('pt-BR')}</span>
                              <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1"><Percent size={10} /> {(percentage || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm flex flex-col h-full relative overflow-hidden">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><ArrowDownRight size={28} className="text-rose-500" /> Destino das Saídas</h4>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {monthDashboard.combinedExpenses.map((cat, idx) => {
                      const Icon = cat.icon;
                      const percentage = (cat.value / (monthDashboard.totalSaidasGeral || 1)) * 100;
                      return (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 ${cat.isRepasse ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'} group-hover:text-rose-600 group-hover:bg-rose-50 rounded-xl transition-all`}>
                                <Icon size={18} />
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">R$ {(cat.value || 0).toLocaleString('pt-BR')}</span>
                              <span className="text-[10px] font-bold text-rose-500 flex items-center justify-end gap-1"><Percent size={10} /> {(percentage || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                   <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><BarChart2 size={28} className="text-blue-600" /> Distribuição de Receita por Barbeiro</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-50">
                      <tr>
                        <th className="py-6 px-4">Barbeiro</th>
                        <th className="py-6 px-4 text-right">Prod. Serviços</th>
                        <th className="py-6 px-4 text-right">Venda Produtos</th>
                        <th className="py-6 px-4 text-right text-rose-500">Total Comissões</th>
                        <th className="py-6 px-4 text-right text-blue-500 bg-blue-50/30">Repasse Assinatura</th>
                        <th className="py-6 px-4 text-right font-black text-emerald-700 bg-emerald-50/30">Recebido no Mês</th>
                        <th className="py-6 px-4 text-right font-black text-slate-900">Saldo Barbearia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {monthDashboard.profRanking.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-6 px-4">
                            <span className="font-black text-slate-800 text-sm uppercase block tracking-tight">{p.nome}</span>
                          </td>
                          <td className="py-6 px-4 text-right font-bold text-slate-500">R$ {(p.totalProd || 0).toLocaleString('pt-BR')}</td>
                          <td className="py-6 px-4 text-right font-bold text-purple-500">R$ {(p.vendasBruto || 0).toLocaleString('pt-BR')}</td>
                          <td className="py-6 px-4 text-right font-bold text-rose-400">R$ {(p.comissaoProducao + p.comissaoVendas || 0).toLocaleString('pt-BR')}</td>
                          <td className="py-6 px-4 text-right font-black text-blue-600 bg-blue-50/40">R$ {(p.recebidoAssinatura || 0).toLocaleString('pt-BR')}</td>
                          <td className="py-6 px-4 text-right font-black text-emerald-600 bg-emerald-100/30 border-x border-emerald-50">
                            R$ {(p.totalRecebidoBarbeiro || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-6 px-4 text-right font-black text-slate-700">
                            R$ {(p.totalProd + p.vendasBruto - p.comissaoProducao - p.comissaoVendas || 0).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 p-12 rounded-[56px] text-white relative overflow-hidden flex flex-col justify-between mb-10 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-[120px] group-hover:bg-blue-600/30 transition-all duration-700"></div>
                <h4 className="text-2xl font-black mb-10 flex items-center gap-3"><Sparkles size={28} className="text-blue-400 animate-pulse" /> Lucratividade Consolidada</h4>
                <div className="p-12 bg-white/5 border border-white/10 rounded-[40px] relative backdrop-blur-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-4 tracking-[0.2em]">Resultado Líquido Disponível</p>
                  <h5 className={`text-7xl font-black tracking-tighter ${(monthDashboard.saldoFinalFechamento || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    R$ {(monthDashboard.saldoFinalFechamento || 0).toLocaleString('pt-BR')}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-300 my-auto">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Novo Lançamento Mensal</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Apenas profissionais ativos aparecem aqui</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-slate-100 p-4 rounded-full text-slate-400 hover:bg-slate-200 transition-all"><X /></button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-10 flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mês de Lançamento</label>
                  <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-slate-700 outline-none focus:border-blue-500" value={formData.mes} onChange={(e) => setFormData({...formData, mes: Number(e.target.value)})}>
                    {meses.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <Input label="Valor das Assinaturas (R$)" value={formData.assinaturas} onChange={(v: number) => setFormData({...formData, assinaturas: v})} />
                <Input label="Venda de Pacotes (R$)" value={formData.pacotes} onChange={(v: number) => setFormData({...formData, pacotes: v})} />
                <Input label="Novos Assinantes" value={formData.novosAssinantes} onChange={(v: number) => setFormData({...formData, novosAssinantes: v})} />
                <Input label="Cancelamentos" value={formData.cancelamentosAssinantes} onChange={(v: number) => setFormData({...formData, cancelamentosAssinantes: v})} />
              </div>

              <div>
                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-rose-500"><ArrowDownRight size={22} /> Despesas Reais</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {formData.gastos.map((g, idx) => (
                    <div key={g.categoria}>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 ml-2">{g.categoria}</label>
                      <input type="number" value={g.valor === 0 ? '' : g.valor} onChange={(e) => { let n = [...formData.gastos]; n[idx].valor = Number(e.target.value); setFormData({...formData, gastos: n}); }} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold focus:border-rose-400 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-blue-600"><Scissors size={22} /> Produção por Barbeiro Ativo</h4>
                <div className="space-y-8">
                  {formData.producoes.map((p, idx) => (
                    <div key={p.id} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{p.nome}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MiniInput label="Prod. Serviços" value={p.bruta} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].bruta = v; setFormData({...formData, producoes: n}); }} />
                        <MiniInput label="Comissão Serviços" value={p.repasse} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].repasse = v; setFormData({...formData, producoes: n}); }} />
                        <MiniInput label="Repasse Assinaturas" value={p.assinatura} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].assinatura = v; setFormData({...formData, producoes: n}); }} />
                        <MiniInput label="Qtd. Atendimentos" value={p.quantidadeAtendimentos} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].quantidadeAtendimentos = v; setFormData({...formData, producoes: n}); }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                         <MiniInput label="Venda Produtos (Bruto)" value={p.vendasProdutos} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].vendasProdutos = v; setFormData({...formData, producoes: n}); }} />
                         <MiniInput label="Comissão Prod. (Pago)" value={p.vendasProdutosComissao} onChange={(v: number) => { let n = [...formData.producoes]; n[idx].vendasProdutosComissao = v; setFormData({...formData, producoes: n}); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 shrink-0">
              <button onClick={handleSaveClosing} className="w-full bg-blue-600 text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                <Save size={20} /> SALVAR FECHAMENTO DO MÊS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color, bg, sub }: any) => (
  <div className={`${bg} p-5 rounded-[32px] border border-slate-100 flex flex-col gap-2 shadow-sm`}>
    <div className={`w-8 h-8 bg-slate-50 ${color} rounded-lg flex items-center justify-center`}>
      <Icon size={16} />
    </div>
    <div className="min-h-[60px] flex flex-col justify-between">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <p className={`text-xs font-black ${color}`}>{value}</p>
      <p className="text-[7px] text-slate-300 font-bold uppercase mt-0.5">{sub}</p>
    </div>
  </div>
);

const Input = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
    <input type="number" value={value === 0 ? '' : value} onChange={(e) => onChange(Number(e.target.value))} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-slate-800 outline-none focus:border-blue-500" />
  </div>
);

const MiniInput = ({ label, value, onChange }: any) => (
  <div>
    <label className="text-[8px] font-black text-slate-400 uppercase block mb-2 ml-1">{label}</label>
    <input type="number" value={value === 0 ? '' : value} onChange={(e) => onChange(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 outline-none" />
  </div>
);

export default CashFlow;
