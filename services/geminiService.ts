
import { GoogleGenAI } from "@google/genai";
import { Transaction, Profissional } from "../types.ts";

/**
 * Serviço de insights estratégico usando a inteligência do Google Gemini.
 */
export const getBusinessInsights = async (transactions: Transaction[], collaborators: Profissional[]) => {
  // Initialize the GenAI client with the mandatory process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, curr) => {
    if (curr.type === 'INCOME') acc.totalIncome += curr.amount;
    else acc.totalExpense += curr.amount;
    return acc;
  }, { totalIncome: 0, totalExpense: 0 });

  const prompt = `
    Como um consultor especialista em Barbearias, analise os seguintes dados financeiros anuais e forneça insights estratégicos curtos:
    
    Total de Entradas: R$ ${summary.totalIncome}
    Total de Saídas: R$ ${summary.totalExpense}
    Número de Colaboradores: ${collaborators.length}
    Transações: ${JSON.stringify(transactions.slice(-5))}

    Responda em Português do Brasil:
    1. Análise direta do lucro.
    2. Uma dica prática para aumentar o faturamento.
  `;

  try {
    // Correct usage of generateContent with model name and prompt
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property to access the result
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights da IA:", error);
    return "Ocorreu um erro ao consultar a inteligência estratégica. Verifique sua conexão.";
  }
};
