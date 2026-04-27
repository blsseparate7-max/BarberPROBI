
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AppData } from '../types.ts';

interface ExpensesProps {
  data: AppData;
  year: number;
}

const Expenses: React.FC<ExpensesProps> = ({ data, year }) => {
  const gastosAno = data.gastos.filter(g => g.ano === year);
  
  const porCategoria = Object.entries(
    gastosAno.reduce((acc: any, curr) => {
      acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  const totalGastos = porCategoria.reduce((s, c) => s + (c.value as number), 0);

  return (
    <div className="space-y-6 animate-in zoom-in duration-500">
      <h2 className="text-2xl font-extrabold text-slate-800">Análise de Gastos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Distribuição por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porCategoria}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {porCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value: any) => value != null ? `R$ ${Number(value).toLocaleString('pt-BR')}` : ''}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Investimento Total do Ano</p>
            <p className="text-2xl font-black text-slate-800">R$ {(totalGastos || 0).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Ranking de Despesas</h3>
          <div className="flex-1 space-y-4">
            {porCategoria.sort((a, b) => (b.value as number) - (a.value as number)).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800">R$ {(Number(item.value) || 0).toLocaleString('pt-BR')}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{totalGastos > 0 ? Math.round(((item.value as number) / totalGastos) * 100) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
