
import React, { useState } from 'react';
import { TransactionType, Profissional } from '../types';
import { CATEGORIES } from '../constants';

interface TransactionFormProps {
  collaborators: Profissional[];
  onAdd: (transaction: {
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    collaboratorId?: string;
    category: string;
  }) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ collaborators, onAdd }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [collaboratorId, setCollaboratorId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    onAdd({
      description,
      amount: parseFloat(amount),
      date,
      type,
      category,
      collaboratorId: type === TransactionType.INCOME ? collaboratorId : undefined
    });

    setDescription('');
    setAmount('');
  };

  return (
    <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl mb-8">
      <h3 className="text-lg font-semibold text-stone-200 mb-6">Nova Entrada/Saída</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Tipo</label>
          <div className="flex p-1 bg-stone-950 rounded-lg border border-stone-800">
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Despesa
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Corte Degrade"
            className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Valor (R$)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {type === TransactionType.INCOME && (
          <div className="space-y-2">
            <label className="text-xs text-stone-500 uppercase tracking-widest font-bold">Colaborador</label>
            <select
              value={collaboratorId}
              onChange={(e) => setCollaboratorId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600"
            >
              <option value="">Nenhum (Casa)</option>
              {collaborators.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-2 lg:col-span-3 flex justify-end">
          <button
            type="submit"
            className="bg-stone-100 text-stone-950 hover:bg-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            Lançar Registro
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
