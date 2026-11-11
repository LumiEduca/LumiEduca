import { gerarDica, verificarStatus } from "../services/lumiService.js";
import { ApiError } from "../middlewares/errorHandler.js";

// Limites de tamanho: protegem o custo de tokens da Gemini.
const LIMITES = {
  pergunta: 1000,
  opcoesItens: 10,
  opcaoTamanho: 300,
  nomeAtividade: 200,
  contexto: 1000,
  questaoId: 100,
};

function textoOpcional(valor, campo, max) {
  if (valor === undefined || valor === null) {
    return undefined;
  }

  if (typeof valor !== "string") {
    throw new ApiError(400, `O campo '${campo}' deve ser um texto.`);
  }

  const texto = valor.trim();

  if (texto.length > max) {
    throw new ApiError(400, `O campo '${campo}' deve ter no máximo ${max} caracteres.`);
  }

  return texto || undefined;
}

function validarCorpo(corpo) {
  const { pergunta, opcoes, nomeAtividade, contexto, questaoId } = corpo;

  if (typeof pergunta !== "string" || !pergunta.trim()) {
    throw new ApiError(400, "O campo 'pergunta' é obrigatório e deve ser um texto.");
  }

  if (pergunta.trim().length > LIMITES.pergunta) {
    throw new ApiError(400, `O campo 'pergunta' deve ter no máximo ${LIMITES.pergunta} caracteres.`);
  }

  let opcoesValidas;

  if (opcoes !== undefined && opcoes !== null) {
    if (!Array.isArray(opcoes)) {
      throw new ApiError(400, "O campo 'opcoes' deve ser uma lista de textos.");
    }

    if (opcoes.length > LIMITES.opcoesItens) {
      throw new ApiError(400, `O campo 'opcoes' aceita no máximo ${LIMITES.opcoesItens} itens.`);
    }

    opcoesValidas = opcoes.map((opcao) => {
      if (typeof opcao !== "string") {
        throw new ApiError(400, "Cada item de 'opcoes' deve ser um texto.");
      }

      const texto = opcao.trim();

      if (texto.length > LIMITES.opcaoTamanho) {
        throw new ApiError(
          400,
          `Cada item de 'opcoes' deve ter no máximo ${LIMITES.opcaoTamanho} caracteres.`
        );
      }

      return texto;
    });
  }

  return {
    pergunta: pergunta.trim(),
    opcoes: opcoesValidas,
    nomeAtividade: textoOpcional(nomeAtividade, "nomeAtividade", LIMITES.nomeAtividade),
    contexto: textoOpcional(contexto, "contexto", LIMITES.contexto),
    questaoId: textoOpcional(questaoId, "questaoId", LIMITES.questaoId),
  };
}

/**
 * POST /api/v1/lumi/dica
 * Protegida (verificarToken) e com rate limit por usuário (ver lumiRoutes.js).
 */
export const dica = async (req, res, next) => {
  try {
    const dados = validarCorpo(req.body ?? {});
    const resultado = await gerarDica(dados);

    res.json(resultado);
  } catch (error) {
    // Erros de validação (400) passam com a mensagem original.
    if (error instanceof ApiError) {
      return next(error);
    }

    // Falhas da Gemini/inesperadas: detalhe só no log, mensagem genérica para o cliente.
    console.error("[lumi] Falha ao gerar dica:", error);
    next(new ApiError(503, "O Lumi está indisponível no momento. Tente novamente em instantes."));
  }
};

/**
 * GET /api/v1/lumi/status
 * Pública, com rate limit por IP e cache de 60s no service.
 */
export const status = async (req, res) => {
  try {
    const resultado = await verificarStatus();
    res.json(resultado);
  } catch (error) {
    console.error("[lumi] Falha ao verificar status:", error);
    res.json({ disponivel: false });
  }
};
