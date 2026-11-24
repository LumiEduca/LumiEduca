export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const candidato = err.status || err.statusCode || 500;
  const status =
    Number.isInteger(candidato) && candidato >= 400 && candidato <= 599
      ? candidato
      : 500;

  // Nunca registrar objetos de erro ou mensagens externas com possíveis segredos.
  if (status >= 500) console.error(`[API] Falha HTTP ${status}`);

  let mensagem;
  if (err instanceof ApiError) mensagem = err.message;
  else if (err.type === "entity.parse.failed") mensagem = "JSON inválido";
  else if (err.type === "entity.too.large")
    mensagem = "Corpo da requisição muito grande";
  else if (status >= 500) mensagem = "Erro interno do servidor";
  else mensagem = "Requisição inválida";

  res.status(status).json({ erro: mensagem });
};
