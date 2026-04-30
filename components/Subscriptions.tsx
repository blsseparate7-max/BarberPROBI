
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppData } from '../types';
import { UserCheck, UserMinus, TrendingUp, DollarSign, Activity, BrainCircuit, Sparkles } from 'lucide-react';

interface SubscriptionsProps {
  data: AppData;
  year: number;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ data, year }) => {
  const stats = useMemo(() => {
    const receitasAno = data.receitasExtras.filter(r => r.ano === year);
    
    const totalNovos = receitasAno.reduce((acc, curr) => acc + (curr.novosAssinantes || 0), 0);
    const totalCancelados = receitasAno.reduce((acc, curr) => acc + (curr.cancelamentosAssinantes || 0), 0);
    const churnRate = (totalNovos + totalCancelados) > 0 ? (totalCancelados / (totalNovos + totalCancelados)) * 100 : 0;
    
    const faturamentoRecorrente = receitasAno.reduce((acc, curr) => acc + curr.assinaturas, 0);
    const mediaMensal = faturamentoRecorrente / (receitasAno.length || 1);
    
    const ltv = churnRate > 0 ? (mediaMensal / (totalNovos + totalCancelados)) * (100 / churnRate) : mediaMensal * 12;

    const meses = Array.from({ length: 12 }, (_, i) => {
      const rMes = receitasAno.find(r => r.mes === i + 1);
      return {
        name: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        Assinantes: rMes?.assinaturas || 0,
        Novos: rMes?.novosAssinantes || 0,
        Cancelados: rMes?.cancelamentosAssinantes || 0
      };
    });

    return { totalNovos, totalCancelados, churnRate, mediaMensal, ltv, meses };
  }, [data, year]);

  const { totalNovos, totalCancelados, churnRate, mediaMensal, ltv, meses } = stats;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Clube de Assinatura</h2>
        <p className="text-sm text-slate-500 font-medium italic">Gestão da recorrência e saúde da base</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SubCard label="Crescimento (Ano)" value={`+${totalNovos || 0}`} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <SubCard label="Churn (Cancelamentos)" value={`${(churnRate || 0).toFixed(1)}%`} icon={UserMinus} color="text-red-500" bg="bg-red-50" />
        <SubCard label="Ticket Recorrente" value={`R$ ${(mediaMensal || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
        <SubCard label="Potencial LTV" value={`R$ ${(ltv || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} icon={Activity} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-xl mb-8 flex items-center gap-2">
            <UserCheck size={20} className="text-blue-600" /> Evolução da Base de Assinantes
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={meses}>
                <defs>
                  <linearGradient id="colorAss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                  formatter={(value: any) => value != null ? `R$ ${Number(value).toLocaleString('pt-BR')}` : ''}
                />
                <Area type="monotone" dataKey="Assinantes" stroke="#2563eb" fillOpacity={1} fill="url(#colorAss)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl"><BrainCircuit size={20} /></div>
            <h3 className="font-black text-lg">IA Estrategista</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Diagnóstico de Churn</p>
              <p className="text-xs font-medium leading-relaxed">
                {(churnRate || 0) > 5 ? 'Sua taxa de cancelamento está acima da média de mercado (3%).' : 'Excelente retenção! Sua base está muito fiel.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
      <Icon size={20} />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className={`text-xl font-black ${color}`}>{value}</h3>
  </div>
);

export default Subscriptions;
