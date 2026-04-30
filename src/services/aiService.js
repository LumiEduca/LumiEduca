import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuração da API usando variável de ambiente
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_KEY);

/**
 * Solicita uma dica pedagógica ao Lumi baseada na pergunta e opções da tarefa.
 */
export const pedirDicaAoLumi = async (pergunta, opcoes, nomeAtividade) => {
  try {
    // 1. Validação básica de entrada
    if (!pergunta) {
      throw new Error("A pergunta da atividade não foi fornecida.");
    }

    // 2. Inicialização do modelo (Gemini 3 Flash)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      // O System Instruction mantém a IA no "eixo" pedagógico
      systemInstruction: `Você é o Lumi, tutor da LumiEduca. 
      REGRAS: 
      1. NUNCA dê a resposta correta.
      2. Use apenas a pergunta e opções enviadas.
      3. Dê dicas curtas e motivadoras.
      4. Use emojis 🦊⭐.`
    });

    // 3. Formatação do prompt de dados
    const inputDoEstudante = `
      ATIVIDADE: ${nomeAtividade}
      QUESTÃO: ${pergunta}
      OPÇÕES: ${Array.isArray(opcoes) ? opcoes.join(", ") : "Não fornecidas"}
      
      Dê uma dica para o aluno sem revelar qual alternativa é a correta.
    `;

    // 4. Chamada da API
    // CORREÇÃO: Agora o nome da variável coincide com a definição acima
    const result = await model.generateContent(inputDoEstudante);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("O Lumi não conseguiu gerar uma resposta.");
    }

    return text;

  } catch (error) {
    // Log detalhado para o console do desenvolvedor
    console.error("Erro na integração com Gemini API:", {
      mensagem: error.message,
      contexto: { nomeAtividade, pergunta }
    });

    // Retorno amigável para o aluno em Saquarema
    return "Ops! O Lumi precisou dar uma corridinha na floresta e não conseguiu responder agora. 🦊 Tente clicar no botão novamente em alguns segundos!";
  }
};