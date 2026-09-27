import { gerarDica, verificarStatus } from "../services/lumiService.js";
import { ApiError } from "../middlewares/errorHandler.js";

/**
 * POST /api/v1/lumi/dica
 * Protegida (usa middlewares/auth.js -> verificarToken).
 * Gera uma dica pedagógica com base na questão/contexto enviado.
 */
export const dica = async (req, res, next) => {
  try {
    const { pergunta, contexto, questaoId } = req.body;

    const resultado = await gerarDica({ pergunta, contexto, questaoId });

    res.json(resultado);
  } catch (error) {
    // ApiError(status, message) — segue a ordem real da classe em errorHandler.js
    next(new ApiError(error.status || 500, error.message || "Erro ao gerar dica"));
  }
};

/**
 * GET /api/v1/lumi/status
 * Pública. Verifica se a integração com a Gemini API está disponível.
 * Usada pelo frontend para decidir se cai no fallback.
 */
export const status = async (req, res, next) => {
  try {
    const resultado = await verificarStatus();
    res.json(resultado);
  } catch (error) {
    next(new ApiError(500, "Erro ao verificar status da integração com a Gemini"));
  }
};
