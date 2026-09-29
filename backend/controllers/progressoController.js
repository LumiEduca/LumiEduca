import { ApiError } from "../middlewares/errorHandler.js";
import * as progressoService from "../services/progressoService.js";

export async function responder(req, res, next) {
  try {
    const { questaoId, resposta } = req.body;
    if (!questaoId || resposta === undefined || resposta === null || resposta === "") {
      throw new ApiError(400, "questaoId e resposta são obrigatórios");
    }
    const resultado = await progressoService.responderQuestao(req.usuario.id, {
      questaoId,
      resposta,
    });
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function progressoDoAluno(req, res, next) {
  try {
    const resultado = await progressoService.progressoGeral(req.usuario, req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function trilha(req, res, next) {
  try {
    const resultado = await progressoService.trilhaDoAluno(req.usuario.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}