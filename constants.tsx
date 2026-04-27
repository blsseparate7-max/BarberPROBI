
import { AppData } from './types.ts';

export const CATEGORIAS_GASTOS = ['Aluguel', 'Água/Luz', 'Produtos', 'Marketing', 'Manutenção', 'Outros'];
export const CATEGORIES = CATEGORIAS_GASTOS;

export const MOCK_DATA: AppData = {
  parametros: [
    {
      ano: 2024,
      metaFaturamento: 250000,
      metaLucro: 120000,
      metaAssinaturas: 36000,
      metaGeladeira: 12000,
      metaGastos: 100000,
      metaPorCadeira: 5000
    },
    {
      ano: 2025,
      metaFaturamento: 300000,
      metaLucro: 150000,
      metaAssinaturas: 48000,
      metaGeladeira: 15000,
      metaGastos: 110000,
      metaPorCadeira: 6000
    }
  ],
  profissionais: [
    { id: '1', nome: 'João Tesoura', cadeira: 1, comissao: 50, ativo: true },
    { id: '2', nome: 'Ricardo Navalha', cadeira: 2, comissao: 45, ativo: true },
    { id: '3', nome: 'Marcos Corte', cadeira: 3, comissao: 40, ativo: true },
    { id: '4', nome: 'Pedro Fade', cadeira: 4, comissao: 50, ativo: true }
  ],
  producao: [
    ...Array.from({ length: 12 }, (_, i) => [
      { ano: 2024, mes: i + 1, profissionalId: '1', producaoBruta: 6000, repasseProfissional: 3000, repasseAssinatura: 200, recebidoPelaCasa: 3000, quantidadeAtendimentos: 150, atendimentosAssinatura: 20, vendasProdutos: 500, vendasProdutosComissao: 50 },
      { ano: 2024, mes: i + 1, profissionalId: '2', producaoBruta: 4500, repasseProfissional: 2000, repasseAssinatura: 150, recebidoPelaCasa: 2500, quantidadeAtendimentos: 120, atendimentosAssinatura: 15, vendasProdutos: 400, vendasProdutosComissao: 40 }
    ]).flat(),
    // Dados iniciais para 2025
    { ano: 2025, mes: 1, profissionalId: '1', producaoBruta: 6500, repasseProfissional: 3250, repasseAssinatura: 250, recebidoPelaCasa: 3000, quantidadeAtendimentos: 160, atendimentosAssinatura: 25, vendasProdutos: 600, vendasProdutosComissao: 60 },
    { ano: 2025, mes: 1, profissionalId: '2', producaoBruta: 4800, repasseProfissional: 2160, repasseAssinatura: 180, recebidoPelaCasa: 2460, quantidadeAtendimentos: 125, atendimentosAssinatura: 18, vendasProdutos: 450, vendasProdutosComissao: 45 }
  ],
  receitasExtras: [
    ...Array.from({ length: 12 }, (_, i) => ({
      ano: 2024,
      mes: i + 1,
      dinheiro: 1000,
      cartao: 5000,
      pix: 2000,
      assinaturas: 2800,
      pacotes: 1500,
      geladeira: 900,
      outras: 200,
      novosAssinantes: 10,
      cancelamentosAssinantes: 2
    })),
    {
      ano: 2025,
      mes: 1,
      dinheiro: 1200,
      cartao: 5500,
      pix: 2500,
      assinaturas: 3200,
      pacotes: 1800,
      geladeira: 1000,
      outras: 300,
      novosAssinantes: 12,
      cancelamentosAssinantes: 1
    }
  ],
  gastos: [
    ...Array.from({ length: 12 }, (_, i) => [
      { ano: 2024, mes: i + 1, categoria: 'Aluguel', valor: 3500 },
      { ano: 2024, mes: i + 1, categoria: 'Água/Luz', valor: 850 }
    ]).flat(),
    { ano: 2025, mes: 1, categoria: 'Aluguel', valor: 3800 },
    { ano: 2025, mes: 1, categoria: 'Água/Luz', valor: 900 }
  ],
  meetingNotes: [],
  categoriasGastos: CATEGORIAS_GASTOS
};
