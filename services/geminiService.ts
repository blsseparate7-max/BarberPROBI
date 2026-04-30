
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
  month: number
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const totalProducao = monthData.producao.reduce((acc, p) => acc + p.producaoBruta, 0);
  const totalGastos = monthData.gastos.reduce((acc, g) => acc + g.valor, 0);
  const totalReceitasExtras = monthData.receitas.reduce((acc, r) => 
    acc + r.dinheiro + r.cartao + r.pix + r.assinaturas + r.pacotes + r.geladeira + r.outras, 0);
  
  const faturamentoTotal = totalProducao + totalReceitasExtras;
  const resultado = faturamentoTotal - totalGastos;
  
  const metaAnual = annualData.parametros.find(p => p.ano === year);
  
  const rankingBarbeiros = [...monthData.producao]
    .sort((a, b) => b.producaoBruta - a.producaoBruta)
    .map((p, i) => `${i+1}. B${p.profissionalId.substring(0,4)}: R$ ${p.producaoBruta.toLocaleString('pt-BR')}`);

  const prompt = `
    Atue como um Gestor Estratégico Expert em Barbearias. Sua missão é dar clareza e direção para o dono do negócio baseado nos dados reais de ${month}/${year}.

    DADOS DO MÊS:
    - Faturamento Total: R$ ${faturamentoTotal.toLocaleString('pt-BR')} (Serviços + Extras)
    - Gastos Totais: R$ ${totalGastos.toLocaleString('pt-BR')}
    - Resultado Líquido: R$ ${resultado.toLocaleString('pt-BR')}
    - Percentual de Gasto sobre Faturamento: ${((totalGastos / faturamentoTotal) * 100).toFixed(1)}%

    METAS (SE EXISTIREM):
    - Meta Mensal Sugerida (Faturamento): R$ ${metaAnual ? metaAnual.metaFaturamento.toLocaleString('pt-BR') : 'Não definida'}
    - Meta Mensal Máxima (Gastos): R$ ${metaAnual ? metaAnual.metaGastos.toLocaleString('pt-BR') : 'Não definida'}

    RANKING DE PRODUÇÃO DOS BARBEIROS:
    ${rankingBarbeiros.join('\n')}

    POR FAVOR, GERE UMA ANÁLISE ESTRATÉGICA DIRETA:
    1. DIAGNÓSTICO DO MÊS: Classifique o momento entre Pressão Financeira, Estável ou Crescimento. Explique o porquê.
    2. ANÁLISE DE GARGALOS E OPORTUNIDADES: Onde está o perigo (ex: dependência de um barbeiro, gastos altos) e onde está a chance de ganhar mais.
    3. PROJEÇÃO: Se o ritmo continuar assim, qual a visão para os próximos meses?
    4. PLANO DE AÇÃO: O que o dono deve fazer nos próximos 30 dias, 90 dias e até o fim do ano.
    5. DIREÇÃO FINANCEIRA: Decisão prática (ex: "Reduzir gastos agora", "Investir em marketing", "Evitar retiradas excessivas").
    6. RESUMO EXECUTIVO (TEXTO PRONTO PARA O DONO): Um parágrafo curto e potente para tomada de decisão imediata.

    Importante: Não invente números. Fale como um consultor sênior. Use Markdown para formatar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar análise financeira:", error);
    return "Erro ao gerar análise. Verifique sua conexão e dados.";
  }
};

export const getBusinessInsights = async (appData: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
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
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights da IA:", error);
    return "Erro ao consultar a inteligência estratégica.";
  }
};
