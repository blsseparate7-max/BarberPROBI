
import React, { useState, useMemo } from 'react';
import { AppData, Profissional, ProfissionalPerfil } from '../types.ts';
import { Plus, Trash2, X, Edit3, Scissors, UserPlus, Save, Target, UserMinus, UserCheck, UserX, Briefcase } from 'lucide-react';

interface ProfessionalsProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  year: number;
}

const Professionals: React.FC<ProfessionalsProps> = ({ data, setData, year }) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formProf, setFormProf] = useState({ 
    nome: '', 
    cargo: '',
    cadeira: 1, 
    comissao: 50,
    metaMensal: 5000,
    metaAnual: 60000,
    ativo: true 
  });
  
  const [formPerfil, setFormPerfil] = useState<ProfissionalPerfil>({
    experiencia: '',
    perfilComportamental: '',
    especialidade: '',
    objetivo: ''
  });

  const { ativos, inativos, totalGeralAno } = useMemo(() => {
    const producaoAno = data.producao.filter(p => p.ano === year);
    const faturamentoTotalAno = producaoAno.reduce((acc, curr) => acc + curr.producaoBruta, 0);

    const list = data.profissionais.map(prof => {
      const records = producaoAno.filter(p => p.profissionalId === prof.id);
      const totalProd = records.reduce((s, c) => s + c.producaoBruta, 0);
      
      const mensalData = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        return records.find(r => r.mes === mes)?.producaoBruta || 0;
      });

      const mesesComDados = mensalData.filter(v => v > 0);
      const mediaMensal = mesesComDados.length > 0 ? totalProd / mesesComDados.length : 0;
      
      const valoresValidos = mensalData.map((v, i) => ({ v, i })).filter(x => x.v > 0);
      const melhorMesVal = valoresValidos.length > 0 ? Math.max(...valoresValidos.map(x => x.v)) : 0;
      const melhorMesIdx = melhorMesVal > 0 ? valoresValidos.find(x => x.v === melhorMesVal)?.i : -1;
      const melhorMesNome = melhorMesIdx !== -1 ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][melhorMesIdx!] : '-';

      const piorMesVal = valoresValidos.length > 0 ? Math.min(...valoresValidos.map(x => x.v)) : 0;
      const piorMesIdx = piorMesVal > 0 ? valoresValidos.find(x => x.v === piorMesVal)?.i : -1;
      const piorMesNome = piorMesIdx !== -1 ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][piorMesIdx!] : '-';

      const participacao = faturamentoTotalAno > 0 ? (totalProd / faturamentoTotalAno) * 100 : 0;
      
      const ultimoMesComDados = producaoAno.length > 0 ? Math.max(...producaoAno.map(p => p.mes)) : new Date().getMonth() + 1;
      const prodMesAtual = records.find(r => r.mes === ultimoMesComDados)?.producaoBruta || 0;

      const isAtivo = prof.ativo !== false; 
      return { 
        ...prof, 
        totalProd, 
        mediaMensal, 
        melhorMesNome, 
        piorMesNome, 
        participacao, 
        mensalData, 
        isAtivo,
        prodMesAtual
      };
    });
    
    return {
      ativos: list.filter(p => p.isAtivo).sort((a, b) => b.totalProd - a.totalProd),
      inativos: list.filter(p => !p.isAtivo).sort((a, b) => b.totalProd - a.totalProd),
      totalGeralAno: faturamentoTotalAno
    };
  }, [data.profissionais, data.producao, year]);

  const openAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setFormProf({ nome: '', cargo: '', cadeira: 1, comissao: 50, metaMensal: 5000, metaAnual: 60000, ativo: true });
    setFormPerfil({ experiencia: '', perfilComportamental: '', especialidade: '', objetivo: '' });
  };

  const openEdit = (prof: Profissional) => {
    setModalMode('edit');
    setEditingId(prof.id);
    setFormProf({ 
      nome: prof.nome, 
      cargo: prof.cargo || '',
      cadeira: prof.cadeira, 
      comissao: prof.comissao || 50,
      metaMensal: prof.metaMensal || 5000,
      metaAnual: prof.metaAnual || (prof.metaMensal ? prof.metaMensal * 12 : 60000),
      ativo: prof.ativo !== false 
    });
    setFormPerfil(prof.perfil || { experiencia: '', perfilComportamental: '', especialidade: '', objetivo: '' });
  };

  const handleSave = () => {
    if (!formProf.nome) return;

    if (modalMode === 'add') {
      const nProf: Profissional = {
        id: Math.random().toString(36).substr(2, 9),
        ...formProf,
        perfil: formPerfil
      };
      setData(prev => ({ 
        ...prev, 
        profissionais: [...prev.profissionais, nProf] 
      }));
    } else if (modalMode === 'edit' && editingId) {
      setData(prev => ({
        ...prev,
        profissionais: prev.profissionais.map(p => 
          p.id === editingId ? { ...p, ...formProf, perfil: formPerfil } : p
        )
      }));
    }
    setModalMode(null);
  };

  const handleDelete = (id: string, nome: string) => {
    if (window.confirm(`⚠️ EXCLUIR PERMANENTEMENTE?\n\nDeseja apagar o registro de "${nome}"?\nEsta ação não pode ser desfeita. Para apenas tirar da lista de hoje, use "Inativar".`)) {
      setData(prev => ({
        ...prev,
        profissionais: prev.profissionais.filter(p => p.id !== id)
      }));
    }
  };

  const toggleStatus = (id: string, isCurrentlyAtivo: boolean) => {
    const msg = isCurrentlyAtivo 
      ? "Deseja INATIVAR este profissional? Ele não aparecerá mais nos fechamentos de caixa, mas o histórico dele será mantido."
      : "Deseja REATIVAR este profissional? Ele voltará para a equipe ativa e poderá receber novos lançamentos.";

    if (window.confirm(msg)) {
      setData(prev => ({
        ...prev,
        profissionais: prev.profissionais.map(p => 
          p.id === id ? { ...p, ativo: !isCurrentlyAtivo } : p
        )
      }));
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Equipe & Performance</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de barbeiros e metas</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white flex items-center gap-2 px-8 py-4 rounded-[24px] shadow-xl shadow-blue-200 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shrink-0">
          <UserPlus size={18} /> Novo Profissional
        </button>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <UserCheck size={22} className="text-emerald-500" /> Profissionais Ativos
          </h3>
          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">{ativos.length} NA EQUIPE</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ativos.map((prof, idx) => (
            <ProfCard 
              key={prof.id} 
              prof={prof} 
              idx={idx} 
              onEdit={() => openEdit(prof)} 
              onDelete={() => handleDelete(prof.id, prof.nome)}
              onToggleStatus={() => toggleStatus(prof.id, true)}
            />
          ))}
          {ativos.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum barbeiro ativo.</p>
            </div>
          )}
        </div>
      </section>

      {inativos.length > 0 && (
        <section className="pt-10 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserX size={22} className="text-slate-300" /> Histórico de Profissionais (Inativos)
            </h3>
            <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black">{inativos.length} INATIVOS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inativos.map((prof, idx) => (
              <ProfCard 
                key={prof.id} 
                prof={prof} 
                idx={idx} 
                inactive
                onEdit={() => openEdit(prof)} 
                onDelete={() => handleDelete(prof.id, prof.nome)}
                onToggleStatus={() => toggleStatus(prof.id, false)}
              />
            ))}
          </div>
        </section>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{modalMode === 'add' ? 'Novo' : 'Editar'} Barbeiro</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Dados Profissionais</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-3 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200"><X /></button>
            </div>
            
            <div className="p-10 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Nome Completo</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500" value={formProf.nome} onChange={(e) => setFormProf({...formProf, nome: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Cargo / Função</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="Ex: Barbeiro Master, Recepcionista..." value={formProf.cargo} onChange={(e) => setFormProf({...formProf, cargo: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Cadeira</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500" value={formProf.cadeira} onChange={(e) => setFormProf({...formProf, cadeira: Number(e.target.value)})} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">% Comissão</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500" value={formProf.comissao} onChange={(e) => setFormProf({...formProf, comissao: Number(e.target.value)})} />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 bg-blue-50 p-6 rounded-[32px] border border-blue-100 mt-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase ml-2 mb-2 block flex items-center gap-2 tracking-widest">
                      <Target size={14} /> Metas Manuais
                    </label>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-blue-400 uppercase ml-2 mb-1 block">Meta Mensal (R$)</label>
                    <input type="number" className="w-full p-4 bg-white border border-blue-200 rounded-2xl font-black text-blue-700 outline-none focus:border-blue-500" value={formProf.metaMensal} onChange={(e) => setFormProf({...formProf, metaMensal: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-blue-400 uppercase ml-2 mb-1 block">Meta Anual (R$)</label>
                    <input type="number" className="w-full p-4 bg-white border border-blue-200 rounded-2xl font-black text-blue-700 outline-none focus:border-blue-500" value={formProf.metaAnual} onChange={(e) => setFormProf({...formProf, metaAnual: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-50 shrink-0">
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-sm uppercase shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95">
                <Save size={18} /> {modalMode === 'add' ? 'CADASTRAR' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfCard = ({ prof, idx, inactive, onEdit, onDelete, onToggleStatus }: any) => {
  const [expanded, setExpanded] = useState(false);

  const metaMensal = prof.metaMensal || 0;
  const metaAnual = prof.metaAnual || 0;
  const pctMensal = metaMensal > 0 ? (prof.prodMesAtual / metaMensal) * 100 : -1;
  const pctAnual = metaAnual > 0 ? (prof.totalProd / metaAnual) * 100 : -1;

  const getStatus = (pct: number) => {
    if (pct === -1) return { label: 'Meta não definida', color: 'text-slate-400 bg-slate-50' };
    if (pct >= 100) return { label: 'Acima da Meta', color: 'text-emerald-600 bg-emerald-50' };
    if (pct >= 85) return { label: 'Próximo da Meta', color: 'text-blue-600 bg-blue-50' };
    if (pct >= 50) return { label: 'Abaixo da Meta', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Crítico', color: 'text-red-600 bg-red-50' };
  };

  const statusMensal = getStatus(pctMensal);
  const statusAnual = getStatus(pctAnual);

  return (
    <div className={`bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm relative overflow-hidden transition-all border-b-4 ${
      inactive 
        ? 'opacity-60 grayscale border-b-slate-200' 
        : 'hover:border-blue-200 border-b-blue-600'
    }`}>
      <div className="absolute top-6 right-6 flex gap-2">
        <div className="flex gap-1.5 bg-slate-50/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-100">
          <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors" title="Editar">
            <Edit3 size={15} />
          </button>
          <button onClick={onToggleStatus} className={`p-2 rounded-xl transition-colors ${inactive ? 'text-emerald-600 hover:bg-emerald-100' : 'text-orange-500 hover:bg-orange-100'}`}>
            {inactive ? <UserCheck size={15} /> : <UserMinus size={15} />}
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-100 rounded-xl transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${
          inactive ? 'bg-slate-300' : (idx === 0 ? 'bg-blue-600 rotate-2' : idx === 1 ? 'bg-slate-700' : 'bg-slate-900')
        }`}>
          {inactive ? 'OFF' : `${idx + 1}º`}
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg leading-tight uppercase">{prof.nome}</h3>
          <span className="text-[10px] font-black text-blue-600 uppercase">{prof.cargo || 'Profissional'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Produção do Mês</p>
          <p className="text-lg font-black text-slate-800">R$ {prof.prodMesAtual.toLocaleString('pt-BR')}</p>
          <div className={`inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 ${statusMensal.color}`}>
            {statusMensal.label} {pctMensal !== -1 && `${Math.round(pctMensal)}%`}
          </div>
        </div>
        <div className="p-4 bg-blue-50/50 rounded-3xl border border-blue-100/30">
          <p className="text-[8px] font-black text-blue-400 uppercase mb-1">Produção do Ano</p>
          <p className="text-lg font-black text-blue-800">R$ {prof.totalProd.toLocaleString('pt-BR')}</p>
          <div className={`inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 ${statusAnual.color}`}>
            {statusAnual.label} {pctAnual !== -1 && `${Math.round(pctAnual)}%`}
          </div>
        </div>
      </div>

      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="w-full py-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase rounded-2xl hover:bg-slate-100 transition-colors">Ver Detalhes e Metas</button>
      ) : (
        <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <DataPoint label="Média Mensal" value={`R$ ${prof.mediaMensal.toLocaleString('pt-BR')}`} />
            <DataPoint label="Participação" value={`${prof.participacao.toFixed(1)}%`} />
            <DataPoint label="Melhor Mês" value={prof.melhorMesNome} />
            <DataPoint label="Pior Mês" value={prof.piorMesNome} />
          </div>

          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Desempenho no Ano (R$)</p>
            <div className="flex items-end gap-1 h-12">
              {prof.mensalData.map((val: number, i: number) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-sm relative group" style={{ height: `${Math.max(5, (val / (Math.max(...prof.mensalData) || 1)) * 100)}%` }}>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[7px] p-1 rounded font-bold z-10 whitespace-nowrap">
                    R$ {val.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[7px] font-bold text-slate-300 uppercase">Jan</span>
              <span className="text-[7px] font-bold text-slate-300 uppercase">Dez</span>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/30">
            <h4 className="text-[9px] font-black text-blue-500 uppercase mb-3 flex items-center gap-2">
              <Target size={12} /> Comparativo de Metas
            </h4>
            <div className="space-y-3">
              <ProgressBar label="Meta Mensal" current={prof.prodMesAtual} target={metaMensal} />
              <ProgressBar label="Meta Anual" current={prof.totalProd} target={metaAnual} />
            </div>
          </div>

          <button onClick={() => setExpanded(false)} className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-slate-800 transition-colors">Fechar Detalhes</button>
        </div>
      )}
    </div>
  );
};

const DataPoint = ({ label, value }: any) => (
  <div>
    <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
    <p className="text-xs font-black text-slate-700">{value}</p>
  </div>
);

const ProgressBar = ({ label, current, target }: any) => {
  const pct = target > 0 ? (current / target) * 100 : 0;
  const dif = target - current;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase">
        <span className="text-slate-500">{label}</span>
        <span className={dif > 0 ? 'text-blue-600' : 'text-emerald-600'}>
          {dif > 0 ? `Faltam R$ ${dif.toLocaleString('pt-BR')}` : 'Meta Batida!'}
        </span>
      </div>
      <div className="h-1.5 bg-white rounded-full overflow-hidden border border-blue-100/50">
        <div 
          className={`h-full transition-all duration-1000 ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

export default Professionals;
