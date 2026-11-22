import { GoogleGenerativeAI } from "@google/generative-ai";

// A chave da Gemini fica SOMENTE no backend (variável de ambiente).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

// Limita o tamanho da resposta (controle de custo por chamada).
const MAX_OUTPUT_TOKENS = 300;

// Tempo máximo de espera pela Gemini (em ms), para a rota não ficar pendurada.
const TIMEOUT_MS = 8000;

// O /status pode fazer no máximo 1 chamada real à Gemini a cada 60s.
const STATUS_CACHE_MS = 60 * 1000;

const SYSTEM_INSTRUCTION =
  "Você é o Lumi, tutor da LumiEduca. REGRAS: 1. NUNCA dê a resposta correta. 2. Use apenas a pergunta e opções enviadas. 3. Dê dicas curtas e motivadoras. 4. Use emojis 🦊⭐.";

/**
 * Erro do serviço de IA, com o status HTTP que a rota deve devolver:
 * 503 = Gemini indisponível, lenta ou sobrecarregada
 * 502 = Gemini respondeu, mas com algo inutilizável (ex.: resposta vazia)
 */
export class GeminiError extends Error {
  constructor(mensagem, statusHttp = 503) {
    super(mensagem);
    this.name = "GeminiError";
    this.statusHttp = statusHttp;
  }
}

let genAI = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

// ---------- STATUS (com cache em memória) ----------
let statusCache = { valor: null, expiraEm: 0 };
let statusEmAndamento = null; // evita chamadas simultâneas na mesma janela

/**
 * Informa se a Gemini está disponível.
 * - Sem GEMINI_API_KEY: responde { disponivel: false } sem chamar nada.
 * - Com chave: no máximo 1 chamada real por minuto, o resto vem do cache.
 *   (uma falha também fica em cache por 60s, para não martelar a API fora do ar)
 */
export async function verificarStatus() {
  const client = getClient();

  if (!client) {
    return { disponivel: false };
  }

  if (statusCache.valor && Date.now() < statusCache.expiraEm) {
    return statusCache.valor;
  }

  if (statusEmAndamento) {
    return statusEmAndamento;
  }

  statusEmAndamento = (async () => {
    let resultado;

    try {
      const model = client.getGenerativeModel(
        {
          model: GEMINI_MODEL,
          generationConfig: { maxOutputTokens: 10 },
        },
        { timeout: TIMEOUT_MS },
      );

      await model.generateContent("ping");
      resultado = { disponivel: true };
    } catch (error) {
      console.error(
        "[lumiService] Falha ao verificar status da Gemini:",
        error.message,
      );
      resultado = { disponivel: false };
    }

    statusCache = { valor: resultado, expiraEm: Date.now() + STATUS_CACHE_MS };
    return resultado;
  })();

  try {
    return await statusEmAndamento;
  } finally {
    statusEmAndamento = null;
  }
}

// ---------- DICA ----------
/**
 * Gera uma dica pedagógica no tom do Lumi.
 * Os dados já chegam validados pelo controller.
 * Lança GeminiError (503 ou 502) quando a Gemini falha.
 *
 * @param {Object} params
 * @param {string} params.pergunta
 * @param {string[]} [params.opcoes]
 * @param {string} [params.nomeAtividade]
 * @param {string} [params.contexto]   - opcional (compatibilidade)
 * @param {string} [params.questaoId]  - opcional (compatibilidade)
 */
export async function gerarDica({
  pergunta,
  opcoes,
  nomeAtividade,
  contexto,
  questaoId,
}) {
  const client = getClient();

  if (!client) {
    throw new GeminiError("GEMINI_API_KEY não configurada", 503);
  }

  const model = client.getGenerativeModel(
    {
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    },
    { timeout: TIMEOUT_MS },
  );

  let resultado;

  try {
    resultado = await model.generateContent(
      montarEntradaDoAluno({
        pergunta,
        opcoes,
        nomeAtividade,
        contexto,
        questaoId,
      }),
    );
  } catch (error) {
    // Timeout, rede, 429/503 do Google, chave inválida...: tudo vira "indisponível".
    throw new GeminiError(error.message, 503);
  }

  let texto;

  try {
    texto = resultado.response.text();
  } catch (error) {
    // Ex.: resposta bloqueada por filtro de segurança
    throw new GeminiError(error.message, 502);
  }

  if (!texto || !texto.trim()) {
    throw new GeminiError("A Gemini retornou uma resposta vazia", 502);
  }

  return { dica: texto.trim() };
}

function montarEntradaDoAluno({
  pergunta,
  opcoes,
  nomeAtividade,
  contexto,
  questaoId,
}) {
  const listaOpcoes =
    Array.isArray(opcoes) && opcoes.length > 0
      ? opcoes.join(", ")
      : "Não fornecidas";

  const linhas = [
    `ATIVIDADE: ${nomeAtividade || "Não informada"}`,
    `QUESTÃO: ${pergunta}`,
    `OPÇÕES: ${listaOpcoes}`,
  ];

  if (contexto) {
    linhas.push(`CONTEXTO: ${contexto}`);
  }

  if (questaoId) {
    linhas.push(`ID DA QUESTÃO: ${questaoId}`);
  }

  linhas.push(
    "",
    "Dê uma dica para o aluno sem revelar qual alternativa é a correta.",
  );

  return linhas.join("\n");
}
