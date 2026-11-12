import * as service from "../services/avaliacaoDemoService.js";

export const criar = async (req, res, next) => {
  try {
    const { jogo, nota } = req.body;
    const avaliacao = await service.registrar({ jogo, nota });
    res.status(201).json({ avaliacao });
  } catch (error) {
    next(error);
  }
};

export const resumo = async (req, res, next) => {
  try {
    res.json(await service.resumo());
  } catch (error) {
    next(error);
  }
};