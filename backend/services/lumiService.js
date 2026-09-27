import { GoogleGenerativeAI } from "@google/generative-ai";

// A chave da Gemini fica SOMENTE no backend (variável de ambiente).
// Nunca expor essa chave para o frontend (nunca usar prefixo REACT_APP_ nela).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Modelo padrão — usa o alias "latest", que a Google aponta automaticamente
// para a versão estável mais recente do Flash (evita quebrar quando um
// modelo específico é descontinuado).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

let genAI = null;

/**
 * Inicializa o client da Gemini de forma preguiçosa (lazy),
 * para não quebrar o boot do servidor caso a env var não esteja setada.
 */
function getClient() {
  if (!GEMINI_API_KEY) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return genAI;
}

/**
 * Verifica se a integração com a Gemini está disponível.
 * Usado pelo endpoint público GET /lumi/status (e pelo fallback do frontend).
 */
export async function verificarStatus() {
  const client = getClient();

  if (!client) {
    return {
      disponivel: false,
      motivo: "GEMINI_API_KEY não configurada no backend",
    };
  }

  try {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });

    // Chamada mínima só para validar que a chave/API respondem.
    await model.generateContent("ping");

    return { disponivel: true };
  } catch (error) {
    console.error("[lumiService] Falha ao verificar status da Gemini:", error.message);
    return {
      disponivel: false,
      motivo: "Falha ao comunicar com a Gemini API",
    };
  }
}

/**
 * Gera uma dica pedagógica com base na questão/contexto enviado.
 *
 * @param {Object} params
 * @param {string} [params.pergunta] - pergunta livre do aluno/professor.
 * @param {string} [params.contexto] - enunciado da questão ou contexto adicional.
 * @param {string} [params.questaoId] - id da questão, se a dica for sobre uma questão específica do banco.
 */
export async function gerarDica({ pergunta, contexto, questaoId }) {
  const client = getClient();

  if (!client) {
    const erro = new Error("Integração com a Gemini API não está disponível");
    erro.status = 503;
    throw erro;
  }

  if (!pergunta && !contexto) {
    const erro = new Error("Informe 'pergunta' e/ou 'contexto' para gerar a dica");
    erro.status = 400;
    throw erro;
  }

  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = montarPrompt({ pergunta, contexto, questaoId });

  const resultado = await model.generateContent(prompt);
  const texto = resultado.response.text();

  return { dica: texto };
}

function montarPrompt({ pergunta, contexto, questaoId }) {
  const partes = [
    "Você é um assistente pedagógico do LumiEduca.",
    "Gere uma dica curta, didática e encorajadora para ajudar o aluno a avançar,",
    "SEM entregar a resposta final diretamente.",
  ];

  if (questaoId) {
    partes.push(`ID da questão: ${questaoId}`);
  }

  if (contexto) {
    partes.push(`Contexto/enunciado da questão: ${contexto}`);
  }

  if (pergunta) {
    partes.push(`Dúvida do aluno: ${pergunta}`);
  }

  return partes.join("\n");
}
