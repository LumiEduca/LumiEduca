export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const producao = process.env.NODE_ENV === "production";

  // Detalhes técnicos ficam só no log do servidor
  if (status >= 500) console.error(err);

  let mensagem;
  if (err instanceof ApiError) mensagem = err.message;
  else if (err.type === "entity.parse.failed") mensagem = "JSON inválido";
  else if (err.type === "entity.too.large") mensagem = "Corpo da requisição muito grande";
  else if (status >= 500) {
    mensagem = producao ? "Erro interno do servidor" : err.message || "Erro interno do servidor";
  } else mensagem = "Requisição inválida";

  res.status(status).json({ erro: mensagem });
};