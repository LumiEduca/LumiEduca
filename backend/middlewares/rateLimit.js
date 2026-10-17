import rateLimit from "express-rate-limit";

const base = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Nos testes automatizados o limite fica desligado, a menos que ENABLE_RATE_LIMIT_IN_TEST esteja definido
  skip: () => process.env.NODE_ENV === "test" && !process.env.ENABLE_RATE_LIMIT_IN_TEST,
  handler: (req, res) =>
    res.status(429).json({ erro: "Muitas tentativas. Tente novamente mais tarde." }),
};

export const limiteGeral = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });

// Só tentativas que falharam contam
export const limiteLogin = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const limiteCadastro = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 5 });

// Adivinhar código de sala: só as tentativas que falham contam
export const limiteEntrarSala = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});