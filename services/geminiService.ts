
import { GoogleGenAI } from "@google/genai";
import { AppData, PlanningData, ProducaoMensal, GastoMensal, ReceitasExtras } from "../types.ts";

/**
 * Serviço de inteligência financeira para Barbearias.
 */
export const generateFinancialAnalysis = async (
  monthData: {
    producao: ProducaoMensal[];
    gastos: GastoMensal[];
    receitas: ReceitasExtras[];
  },
  annualData: AppData,
  year: number,
  month: number,
  apiKey?: string
) => {
  const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: finalApiKey! });

  // Métricas do Mês
  const totalProducaoMes = monthData.producao.reduce((acc, p) => acc + p.producaoBruta, 0);
  const totalGastosMes = monthData.gastos.reduce((acc, g) => acc + g.valor, 0);
  const totalReceitasExtrasMes = monthData.receitas.reduce((acc, r) => 
    acc + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes + r.geladeira + r.outras, 0);
  const faturamentoTotalMes = totalProducaoMes + totalReceitasExtrasMes;
  
  // Métricas do Ano
  const producaoAno = (annualData.producao || []).filter(p => p.ano === year);
  const receitasAno = (annualData.receitasExtras || []).filter(r => r.ano === year);
  const gastosAno = (annualData.gastos || []).filter(g => g.ano === year);
  
  const faturamentoTotalAno = producaoAno.reduce((acc, p) => acc + p.producaoBruta + (p.vendasProdutos || 0), 0) +
    receitasAno.reduce((acc, r) => acc + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes + r.geladeira + r.outras, 0);
  
  const totalGastosAno = gastosAno.reduce((acc, g) => acc + g.valor, 0) +
    producaoAno.reduce((acc, p) => acc + p.repasseProfissional + p.repasseAssinatura + (p.vendasProdutosComissao || 0), 0);

  const metaAnual = annualData.parametros.find(p => p.ano === year);
  
  const rankingBarbeiros = [...annualData.profissionais]
    .map(prof => {
      const prodProf = producaoAno.filter(p => p.profissionalId === prof.id).reduce((acc, p) => acc + p.producaoBruta, 0);
      return { nome: prof.nome, prod: prodProf };
    })
    .sort((a, b) => b.prod - a.prod)
    .slice(0, 3)
    .map((p, i) => `${i+1}. ${p.nome}: R$ ${p.prod.toLocaleString('pt-BR')}`);

  const prompt = `
    Atue como um mentor e estrategista de negócios senior para Barbearias Premium. Você tem formação em Psicanálise (gestão de pessoas), Vendas e Experiência do Cliente, com base bíblica de prosperidade.

    OBJETIVO: Gerar um Diagnóstico Estratégico Anual para a barbearia referente ao ano de ${year}.

    DADOS DO ANO ATÉ O MOMENTO (MÊS ${month}):
    - Faturamento Acumulado: R$ ${faturamentoTotalAno.toLocaleString('pt-BR')}
    - Gastos/Saídas Totais: R$ ${totalGastosAno.toLocaleString('pt-BR')}
    - Lucro Líquido Acumulado: R$ ${(faturamentoTotalAno - totalGastosAno).toLocaleString('pt-BR')}
    - Meta do Ano: R$ ${metaAnual ? metaAnual.metaFaturamento.toLocaleString('pt-BR') : 'Não definida'}

    DADOS DO MÊS ATUAL (${month}/${year}):
    - Faturamento: R$ ${faturamentoTotalMes.toLocaleString('pt-BR')}
    - Gastos: R$ ${totalGastosMes.toLocaleString('pt-BR')}

    TOP 3 BARBEIROS (PRODUÇÃO ANUAL):
    ${rankingBarbeiros.join('\n')}

    ESTILO DA RESPOSTA: Mentor sênior, autoridade, direto ao ponto, confrontador mas encorajador.

    ESTRUTURA OBRIGATÓRIA:
    1. DIAGNÓSTICO DO ANO: Como o negócio está caminhando em relação à meta anual.
    2. PONTO CEGO: Onde o dinheiro está fugindo ou o que o dono não está vendo.
    3. OPORTUNIDADE DE OURO: Onde focar nos próximos meses para maximizar o lucro.
    4. CUIDADO COM O TIME: Insight sobre a equipe baseado no ranking.
    5. PRINCÍPIO BÍBLICO: Uma palavra de sabedoria sobre gestão e abundância.

    REGRAS: Use apenas dados reais. Seja curto e grosso.
  `;


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Erro ao gerar análise. Verifique sua conexão e dados.";
  }
};

export const getBusinessInsights = async (appData: AppData, apiKey?: string) => {
  const finalApiKey = apiKey || appData.geminiKey || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: finalApiKey! });
  
  const totalIncome = appData.producao.reduce((acc, p) => acc + p.producaoBruta, 0);
  const totalExpense = appData.gastos.reduce((acc, g) => acc + g.valor, 0);

  const prompt = `
    Analise os dados financeiros da barbearia e forneça 2 insights rápidos:
    Total Faturado (Serviços): R$ ${totalIncome.toLocaleString('pt-BR')}
    Total Gasto: R$ ${totalExpense.toLocaleString('pt-BR')}
    Número de Colaboradores: ${appData.profissionais.length}

    Responda em Português do Brasil:
    1. Destaque do Lucro.
    2. Dica prática de gestão.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Erro ao consultar a inteligência estratégica.";
  }
};
