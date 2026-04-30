
import React, { useState, useMemo } from 'react';
import { AppData, MeetingNote } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  MessageSquare, 
  BrainCircuit, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Scissors, 
  Target, 
  UserCheck, 
  UserCircle,
  DollarSign, 
  Wallet, 
  ShoppingBag, 
  BarChart2, 
  ListChecks, 
  History,
  Users,
  LayoutList,
  ChevronRight,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';

interface MeetingsProps {
  data: AppData;
  setData: (newData: AppData | ((prev: AppData) => AppData), specificSync?: { type: string, payload: any }) => void;
  year: number;
}

const Meetings: React.FC<MeetingsProps> = ({ data, setData, year }) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'geral'>('individual');
  const [selectedProfId, setSelectedProfId] = useState(data.profissionais[0]?.id || '');
  const [newNote, setNewNote] = useState('');
  const [weeklyNote, setWeeklyNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiScript, setAiScript] = useState('');
  const [generalAiScript, setGeneralAiScript] = useState('');

  const selectedProf = data.profissionais.find(p => p.id === selectedProfId);
  
  const notes = useMemo(() => {
    return (data.meetingNotes || []).filter(n => 
      n.profissionalId === selectedProfId && n.ano === year
    );
  }, [data.meetingNotes, selectedProfId, year]);

  const allNotesYear = useMemo(() => {
    return (data.meetingNotes || []).filter(n => n.ano === year);
  }, [data.meetingNotes, year]);
  
  const performanceData = useMemo(() => {
    const producaoAno = data.producao.filter(p => p.ano === year);
    const receitasAno = data.receitasExtras.filter(r => r.ano === year);
    const faturamentoTotalAno = (producaoAno.reduce((acc, curr) => acc + curr.producaoBruta, 0)) +
                                (receitasAno.reduce((acc, r) => acc + r.assinaturas + r.pacotes + r.geladeira + r.dinheiro + r.cartao + r.pix, 0));

    const profissionaisStats = data.profissionais.filter(p => p.ativo !== false).map(prof => {
      const pProd = producaoAno.filter(p => p.profissionalId === prof.id);
      const ultimoMes = pProd.length > 0 ? Math.max(...pProd.map(p => p.mes)) : 0;
      const d = pProd.find(p => p.mes === ultimoMes);
      const dPrev = pProd.find(p => p.mes === ultimoMes - 1);

      const prodMes = d?.producaoBruta || 0;
      const prodAno = pProd.reduce((acc, curr) => acc + curr.producaoBruta, 0);
      const metaMes = prof.metaMensal || 5000;
      const metaAno = prof.metaAnual || (metaMes * 12);
      
      const crescimento = (dPrev?.producaoBruta || 0) > 0 ? ((prodMes - dPrev!.producaoBruta) / dPrev!.producaoBruta) * 100 : 0;

      return {
        id: prof.id,
        nome: prof.nome,
        prodMes,
        prodAno,
        metaMes,
        metaAno,
        crescimento,
        ultimoMes,
        mesNome: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][ultimoMes - 1]
      };
    });

    const rankingMes = [...profissionaisStats].sort((a, b) => b.prodMes - a.prodMes);
    const rankingAno = [...profissionaisStats].sort((a, b) => b.prodAno - a.prodAno);

    const statsGeral = {
      faturamentoTotalAno,
      producaoMesTotal: profissionaisStats.reduce((acc, p) => acc + p.prodMes, 0),
      producaoAnoTotal: profissionaisStats.reduce((acc, p) => acc + p.prodAno, 0),
      assinaturasTotal: receitasAno.reduce((acc, r) => acc + r.assinaturas, 0),
      geladeiraTotal: receitasAno.reduce((acc, r) => acc + r.geladeira, 0),
      pacotesTotal: receitasAno.reduce((acc, r) => acc + r.pacotes, 0)
    };

    return { profissionaisStats, rankingMes, rankingAno, statsGeral };
  }, [data, year]);

  const performance = useMemo(() => {
    if (!selectedProfId) return null;
    const profStat = performanceData.profissionaisStats.find(p => p.id === selectedProfId);
    if (!profStat) return null;

    const producaoProf = data.producao.filter(p => p.profissionalId === selectedProfId && p.ano === year);
    const d = producaoProf.find(p => p.mes === profStat.ultimoMes);

    if (!d) return null;

    return {
      ...profStat,
      mes: profStat.mesNome,
      atendimentosServico: d.quantidadeAtendimentos || 0,
      atendimentosAssinatura: d.atendimentosAssinatura || 0,
      vendasProdutosBruto: d.vendasProdutos || 0,
      comissaoVendas: d.vendasProdutosComissao || 0,
      producaoServicosBruta: d.producaoBruta || 0,
      recebidoTotais: (d.repasseProfissional || 0) + (d.repasseAssinatura || 0) + (d.vendasProdutosComissao || 0),
      ticketMedio: (d.quantidadeAtendimentos || 0) > 0 ? d.producaoBruta / d.quantidadeAtendimentos : 0,
      progressoMeta: Math.min((profStat.prodMes / profStat.metaMes) * 100, 100),
      porcentagemReal: (profStat.prodMes / profStat.metaMes) * 100
    };
  }, [data, selectedProfId, performanceData, year]);

  const handleAddNote = (text: string, isWeekly: boolean = false) => {
    if (!text) return;
    const note: MeetingNote = {
      id: Math.random().toString(36).substr(2, 9),
      profissionalId: selectedProfId,
      ano: year,
      data: new Date().toISOString(),
      texto: isWeekly ? `[ANÁLISE DA SEMANA] ${text}` : text
    };
    setData(prev => ({ 
      ...prev, 
      meetingNotes: [...(prev.meetingNotes || []), note] 
    }), { type: 'note', payload: note });
    if (isWeekly) setWeeklyNote(''); else setNewNote('');
  };

  const handleDeleteNote = (id: string) => {
    if (confirm("Deseja remover esta nota de reunião?")) {
      setData(prev => ({ 
        ...prev, 
        meetingNotes: (prev.meetingNotes || []).filter(n => n.id !== id) 
      }), { type: 'delete_note', payload: id });
    }
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    setAiScript('');
    const ai = new GoogleGenerativeAI(process.env.API_KEY || '');
    
    // Absorvendo as notas semanais/registros para o prompt
    const notesText = notes.map(n => `- ${n.texto}`).join('\n');
    
    const prompt = `
      Você é um Especialista em Gestão de Barbearias Psicanalista e Cristocêntrico.
      Analise o desempenho atual de ${selectedProf?.nome} em ${performance?.mes}/${year} com base em dados REAIS.

      DADOS DO PROFISSIONAL:
      - Produção Mensal: R$ ${performance?.prodMes.toLocaleString('pt-BR')} (Meta: R$ ${performance?.metaMes.toLocaleString('pt-BR')})
      - Produção Anual Acumulada: R$ ${performance?.prodAno.toLocaleString('pt-BR')} (Meta: R$ ${performance?.metaAno.toLocaleString('pt-BR')})
      - Ticket Médio: R$ ${performance?.ticketMedio.toFixed(2)}
      - Venda de Produtos: R$ ${performance?.vendasProdutosBruto.toLocaleString('pt-BR')}
      - Atendimentos: ${performance?.atendimentosServico}
      - Crescimento vs Mês Anterior: ${performance?.crescimento.toFixed(1)}%
      
      NOTAS DE ACOMPANHAMENTO:
      ${notesText || "Sem notas registradas."}

      CONTEXTO DA EQUIPE:
      - Ranking no Mês: ${performanceData.rankingMes.findIndex(p => p.id === selectedProfId) + 1}º de ${performanceData.profissionaisStats.length}
      - Ranking no Ano: ${performanceData.rankingAno.findIndex(p => p.id === selectedProfId) + 1}º de ${performanceData.profissionaisStats.length}

      Gere um relatório estruturado com:
      1. DIAGNÓSTICO DO PROFISSIONAL: Situação do mês e do ano, destaques e onde está falhando (use os números acima).
      2. ANÁLISE COMPORTAMENTAL E TÉCNICA: Baseada nas notas e no crescimento.
      3. SUGESTÕES PRÁTICAS: O que ele deve fazer amanhã para melhorar o ticket e bater a meta.
      4. TEXTO PRONTO PARA REUNIÃO: Um roteiro de feedback motivador, firme e cristocêntrico.

      REGRAS: Nunca invente números. Use os dados reais. Se o profissional estiver acima da meta, parabenize com foco em não estagnar.
    `;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiScript(response.text() || "Erro ao processar feedback.");
    } catch (error) {
      console.error("Erro na geração de feedback:", error);
      setAiScript("Erro na conexão com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGeneralAgenda = async () => {
    setIsGenerating(true);
    setGeneralAiScript('');
    const ai = new GoogleGenerativeAI(process.env.API_KEY || '');

    // Agrupar notas por profissional para o prompt
    const notesSummary = data.profissionais.map(p => {
      const pNotes = allNotesYear.filter(n => n.profissionalId === p.id);
      if (pNotes.length === 0) return null;
      return `Barbeiro ${p.nome}: ${pNotes.map(n => n.texto).join(' | ')}`;
    }).filter(Boolean).join('\n\n');

    const prompt = `
      Você é um Master Coach de Barbearias Psicanalista e Cristocêntrico.
      Analise o ano de ${year} da barbearia com base em dados REAIS.

      DADOS GERAIS DA LOJA:
      - Faturamento Total (Ano): R$ ${performanceData.statsGeral.faturamentoTotalAno.toLocaleString('pt-BR')}
      - Produção Equipe (Mês Atual): R$ ${performanceData.statsGeral.producaoMesTotal.toLocaleString('pt-BR')}
      - Assinaturas (Acumulado): R$ ${performanceData.statsGeral.assinaturasTotal.toLocaleString('pt-BR')}
      - Consumo Geladeira: R$ ${performanceData.statsGeral.geladeiraTotal.toLocaleString('pt-BR')}
      
      EQUIPE PERFORMANCE (MÊS ATUAL):
      ${performanceData.rankingMes.map((p, i) => `${i + 1}º ${p.nome}: R$ ${p.prodMes.toLocaleString('pt-BR')} (Meta: R$ ${p.metaMes.toLocaleString('pt-BR')})`).join('\n')}

      NOTAS DA EQUIPE:
      ${notesSummary}

      Gere um relatório estruturado para a REUNIÃO GERAL:
      1. DIAGNÓSTICO GERAL DA BARBEARIA: Situação do mês e do ano, análise financeira rápida.
      2. QUEM ESTÁ SE DESTACANDO E QUEM ESTÁ ABAIXO DA META: Cite nomes e números reais do ranking.
      3. PONTOS FORTES E PONTOS DE ATENÇÃO: Baseados nas notas e faturamento.
      4. SUGESTÕES PRÁTICAS PARA O PRÓXIMO MÊS: Ações concretas para a equipe.
      5. TEXTO PRONTO PARA REUNIÃO: Discurso profissional, firme e inspirador para o time todo.

      REGRAS: Use apenas os números reais fornecidos. Se houver assinaturas ou geladeira, inclua na análise de receita extra.
    `;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setGeneralAiScript(response.text() || "Erro ao gerar pauta geral.");
    } catch (error) {
      console.error("Erro na geração de pauta geral:", error);
      setGeneralAiScript("Erro na conexão com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Gestão de Reuniões {year}</h2>
          <p className="text-sm text-slate-400 font-bold uppercase mt-1">Alinhamento estratégico e feedback</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[20px] self-start md:self-auto">
          <button 
            onClick={() => setActiveSubTab('individual')}
            className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeSubTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {/* Added missing UserCircle icon */}
            <UserCircle size={14} /> Individual
          </button>
          <button 
            onClick={() => setActiveSubTab('geral')}
            className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeSubTab === 'geral' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={14} /> Reunião Geral
          </button>
        </div>
      </header>

      {activeSubTab === 'individual' ? (
        <>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
            {data.profissionais.filter(p => p.ativo !== false).map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProfId(p.id); setAiScript(''); }}
                className={`px-8 py-4 rounded-[24px] text-xs font-black whitespace-nowrap transition-all border ${
                  selectedProfId === p.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <BarChart2 size={24} className="text-blue-600" /> Resultados de {performance?.mes || 'Mês Atual'}
                  </h3>
                </div>

                {performance ? (
                  <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Atingimento da Meta de Serviços</p>
                          <h4 className="text-3xl font-black text-slate-800">R$ {(performance.producaoServicosBruta || 0).toLocaleString('pt-BR')}</h4>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-black ${performance.porcentagemReal >= 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                            {Math.round(performance.porcentagemReal || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${performance.porcentagemReal >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${performance.progressoMeta}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <PerformanceMetric label="Atendimentos (Serviço)" value={performance.atendimentosServico || 0} icon={Scissors} color="text-slate-600" />
                      <PerformanceMetric label="Atend. Assinatura" value={performance.atendimentosAssinatura || 0} icon={UserCheck} color="text-emerald-600" />
                      <PerformanceMetric label="Vendas Bruto (Produtos)" value={`R$ ${(performance.vendasProdutosBruto || 0).toLocaleString('pt-BR')}`} icon={ShoppingCart} color="text-purple-600" />
                      <PerformanceMetric label="Produção Serviços" value={`R$ ${(performance.producaoServicosBruta || 0).toLocaleString('pt-BR')}`} icon={Target} color="text-blue-600" />
                      <PerformanceMetric label="Recebido Total" value={`R$ ${(performance.recebidoTotais || 0).toLocaleString('pt-BR')}`} icon={DollarSign} color="text-slate-900" isTotal />
                    </div>

                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><TrendingUp size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-tight">Ticket Médio de Serviços</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold">Produção / Atendimentos</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-blue-700">R$ {(performance.ticketMedio || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs">Sem dados para este profissional em {year}.</div>
                )}
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <History size={20} className="text-blue-600" /> Histórico de Feedbacks ({year})
                </h3>
                <div className="space-y-4">
                  {notes.length > 0 ? notes.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(note => (
                    <div key={note.id} className={`p-6 rounded-[32px] border border-slate-100 group relative ${note.texto.includes('[ANÁLISE DA SEMANA]') ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50'}`}>
                      <button onClick={() => handleDeleteNote(note.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase mb-2">
                        <Calendar size={10} /> {new Date(note.data).toLocaleDateString('pt-BR')} 
                        {note.texto.includes('[ANÁLISE DA SEMANA]') && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md">Nota Semanal</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {note.texto.replace('[ANÁLISE DA SEMANA] ', '')}
                      </p>
                    </div>
                  )) : <p className="text-center py-8 text-slate-400 text-xs uppercase font-bold tracking-widest">Aguardando novo registro para {year}.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ListChecks size={20} /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">Notas da Semana</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Acompanhamento {year}</p>
                  </div>
                </div>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium outline-none min-h-[140px] focus:border-emerald-200 transition-colors" 
                  placeholder="Como foi a semana do barbeiro?" 
                  value={weeklyNote} 
                  onChange={(e) => setWeeklyNote(e.target.value)} 
                />
                <button 
                  onClick={() => handleAddNote(weeklyNote, true)} 
                  disabled={!weeklyNote} 
                  className="w-full mt-4 bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xs uppercase shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95"
                >
                  SALVAR NOTA DA SEMANA
                </button>
              </div>

              <div className="bg-slate-900 p-8 rounded-[48px] shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><BrainCircuit size={24} /></div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight">Gestor IA</h3>
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Feedback Individual</p>
                  </div>
                </div>
                <button onClick={handleGenerateScript} disabled={isGenerating || !performance} className="w-full py-5 rounded-[28px] font-black text-sm uppercase flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50">
                  {isGenerating ? 'ANALISANDO...' : <><Sparkles size={18} className="text-blue-500" /> GERAR FEEDBACK</>}
                </button>
                {aiScript && <div className="mt-8 p-6 bg-white/5 rounded-[32px] border border-white/10 animate-in fade-in zoom-in duration-500 max-h-60 overflow-y-auto custom-scrollbar"><p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line">{aiScript}</p></div>}
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-blue-600" /> Registro Geral</h3>
                <textarea className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium outline-none min-h-[120px]" placeholder="Notas gerais da reunião..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                <button onClick={() => handleAddNote(newNote)} disabled={!newNote} className="w-full mt-4 bg-blue-600 text-white py-5 rounded-[24px] font-black text-xs uppercase shadow-lg disabled:opacity-50">SALVAR REGISTRO</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 p-10 rounded-[56px] shadow-2xl relative overflow-hidden text-white border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20"><BrainCircuit size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Pauta Geral de Equipe</h3>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Sintetizando {allNotesYear.length} feedbacks do ano</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <button 
                    onClick={handleGenerateGeneralAgenda}
                    disabled={isGenerating || allNotesYear.length === 0}
                    className="w-full py-6 rounded-[32px] bg-white text-slate-900 font-black text-sm uppercase flex items-center justify-center gap-3 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? 'PROCESSANDO INTELIGÊNCIA...' : <><Sparkles size={20} className="text-blue-500" /> GERAR PAUTA COLETIVA</>}
                  </button>

                  {generalAiScript ? (
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] animate-in slide-in-from-bottom-4 duration-700 max-h-[500px] overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-slate-300 font-medium leading-loose whitespace-pre-line">
                        {generalAiScript}
                      </p>
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[40px]">
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Aguardando geração da pauta...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                  <LayoutList size={22} className="text-blue-600" /> Resumo de Feedbacks por Barbeiro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.profissionais.map(p => {
                    const count = allNotesYear.filter(n => n.profissionalId === p.id).length;
                    return (
                      <div key={p.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${count > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            {p.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{p.nome}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{p.cargo || 'Profissional'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${count > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                            {count} NOTAS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6"><Users size={40} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-2">Momento Equipe</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">
                  A reunião geral é o momento de alinhar processos, comemorar metas batidas e resolver gargalos operacionais que afetam a experiência do cliente.
                </p>
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Foque em soluções, não em culpados</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Apresente os números coletivos</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Ouça as sugestões dos barbeiros</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceMetric = ({ label, value, icon: Icon, color, isTotal }: any) => (
  <div className={`p-5 ${isTotal ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50/50 border-slate-100 text-slate-800'} rounded-3xl border flex flex-col items-center text-center shadow-sm`}>
    <div className={`mb-2 ${isTotal ? 'text-blue-400' : color}`}>
      <Icon size={18} />
    </div>
    <p className={`text-[8px] font-black uppercase mb-1 ${isTotal ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
    <p className={`text-xs font-black ${isTotal ? 'text-white' : ''}`}>{value}</p>
  </div>
);

export default Meetings;
