import {
  gerarDica,
  gerarQuestoes,
  verificarStatus,
} from "../services/lumiService.js";
import { explicarErroDoAluno } from "../services/lumiExplicacaoService.js";
import {
  listarHistorico,
  registrarDica,
} from "../services/lumiHistoricoService.js";

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
    throw new ApiError(
      400,
      `O campo '${campo}' deve ter no máximo ${max} caracteres.`,
    );
  }

  return texto || undefined;
}

function validarCorpo(corpo) {
  const { pergunta, opcoes, nomeAtividade, contexto, questaoId } = corpo;

  if (typeof pergunta !== "string" || !pergunta.trim()) {
    throw new ApiError(
      400,
      "O campo 'pergunta' é obrigatório e deve ser um texto.",
    );
  }

  if (pergunta.trim().length > LIMITES.pergunta) {
    throw new ApiError(
      400,
      `O campo 'pergunta' deve ter no máximo ${LIMITES.pergunta} caracteres.`,
    );
  }

  let opcoesValidas;

  if (opcoes !== undefined && opcoes !== null) {
    if (!Array.isArray(opcoes)) {
      throw new ApiError(400, "O campo 'opcoes' deve ser uma lista de textos.");
    }

    if (opcoes.length > LIMITES.opcoesItens) {
      throw new ApiError(
        400,
        `O campo 'opcoes' aceita no máximo ${LIMITES.opcoesItens} itens.`,
      );
    }

    opcoesValidas = opcoes.map((opcao) => {
      if (typeof opcao !== "string") {
        throw new ApiError(400, "Cada item de 'opcoes' deve ser um texto.");
      }

      const texto = opcao.trim();

      if (texto.length > LIMITES.opcaoTamanho) {
        throw new ApiError(
          400,
          `Cada item de 'opcoes' deve ter no máximo ${LIMITES.opcaoTamanho} caracteres.`,
        );
      }

      return texto;
    });
  }

  return {
    pergunta: pergunta.trim(),
    opcoes: opcoesValidas,
    nomeAtividade: textoOpcional(
      nomeAtividade,
      "nomeAtividade",
      LIMITES.nomeAtividade,
    ),
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

    // Só dicas bem-sucedidas entram no histórico, e só de aluno (professor não tem histórico).
    // Se a gravação falhar, registrarDica só registra no log e a dica é devolvida normalmente.
    if (req.usuario.tipo === "ALUNO") {
      await registrarDica({
        alunoId: req.usuario.id,
        questaoId: undefined,
        pergunta: dados.pergunta,
        resposta: resultado.dica,
      });
    }

    res.json(resultado);
  } catch (error) {
    // Erros de validação (400) passam com a mensagem original.
    if (error instanceof ApiError) {
      return next(error);
    }

    // Falhas da Gemini/inesperadas: detalhe só no log, mensagem genérica para o cliente.
    // Só a mensagem vai para o log (nunca o objeto inteiro). O cliente recebe texto genérico.
    console.error("[lumi] Falha ao gerar dica:", error.message);
    const statusHttp = error?.statusHttp === 502 ? 502 : 503;
    next(
      new ApiError(
        statusHttp,
        "O Lumi está indisponível no momento. Tente novamente em instantes.",
      ),
    );
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

/**
 * POST /api/v1/lumi/gerar-questoes
 * Só professor. NÃO salva nada: o professor revisa e salva por POST /atividades.
 * O corpo já chega validado pelo gerarQuestoesSchema (ver lumiRoutes.js).
 */
export const gerarQuestoesProfessor = async (req, res, next) => {
  try {
    const resultado = await gerarQuestoes(req.body);
    res.json(resultado);
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    // Detalhe só no log (mensagem, nunca o objeto inteiro). O cliente recebe texto genérico.
    console.error("[lumi] Falha ao gerar questões:", error.message);
    const statusHttp = error?.statusHttp === 502 ? 502 : 503;
    next(
      new ApiError(
        statusHttp,
        "Não foi possível gerar as questões agora. Tente novamente em instantes.",
      ),
    );
  }
};

/**
 * POST /api/v1/lumi/explicar-erro
 * Só aluno. A regra (404, 403, 400, acerto sem IA) fica em lumiExplicacaoService.js.
 * O corpo já chega validado pelo explicarErroSchema (ver lumiRoutes.js).
 */
export const explicarErro = async (req, res, next) => {
  try {
    const resultado = await explicarErroDoAluno(req.usuario.id, req.body);
    res.json(resultado);
  } catch (error) {
    // 404, 403 e 400 passam com a mensagem original.
    if (error instanceof ApiError) {
      return next(error);
    }

    // Falhas do Gemini: detalhe só no log (mensagem), cliente recebe texto genérico.
    console.error("[lumi] Falha ao explicar erro:", error.message);
    const statusHttp = error?.statusHttp === 502 ? 502 : 503;
    next(
      new ApiError(
        statusHttp,
        "O Lumi não conseguiu explicar agora. Tente novamente em instantes.",
      ),
    );
  }
};

/**
 * GET /api/v1/lumi/historico
 * Só aluno, e só as dicas dele. O limite já chega validado (ver lumiRoutes.js).
 */
export const historico = async (req, res, next) => {
  try {
    const resultado = await listarHistorico(
      req.usuario.id,
      req.limiteHistorico,
    );
    res.json(resultado);
  } catch (error) {
    console.error("[lumi] Falha ao listar histórico:", error.message);
    next(
      new ApiError(
        503,
        "Não foi possível carregar o histórico agora. Tente novamente em instantes.",
      ),
    );
  }
};
