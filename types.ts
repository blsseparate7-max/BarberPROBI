
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id?: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  collaboratorId?: string;
  category: string;
}

export interface MeetingNote {
  id: string;
  profissionalId: string;
  ano: number;
  data: string;
  texto: string;
}

export interface ParametrosAnuais {
  ano: number;
  metaFaturamento: number;
  metaLucro: number;
  metaAssinaturas: number;
  metaGeladeira: number;
  metaGastos: number;
  metaPorCadeira: number;
}

export interface ProfissionalPerfil {
  experiencia: string;
  perfilComportamental: string;
  especialidade: string;
  objetivo: string;
}

export interface Profissional {
  id: string;
  nome: string;
  cargo?: string;
  cadeira: number;
  comissao: number;
  ativo: boolean;
  metaMensal?: number;
  metaAnual?: number;
  perfil?: ProfissionalPerfil;
}

export interface ProducaoMensal {
  ano: number;
  mes: number;
  profissionalId: string;
  producaoBruta: number;
  repasseProfissional: number;
  repasseAssinatura: number;
  recebidoPelaCasa: number;
  vendasProdutos: number;
  vendasProdutosComissao: number;
  quantidadeAtendimentos: number;
  atendimentosAssinatura: number;
}

export interface ReceitasExtras {
  ano: number;
  mes: number;
  dinheiro: number;
  cartao: number;
  pix: number;
  assinaturas: number;
  pacotes: number; 
  geladeira: number;
  outras: number;
  novosAssinantes: number;
  cancelamentosAssinantes: number;
}

export interface GastoMensal {
  ano: number;
  mes: number;
  categoria: string;
  valor: number;
}

export interface AppData {
  parametros: ParametrosAnuais[];
  profissionais: Profissional[];
  producao: ProducaoMensal[];
  receitasExtras: ReceitasExtras[];
  gastos: GastoMensal[];
  meetingNotes: MeetingNote[];
  categoriasGastos: string[];
}
