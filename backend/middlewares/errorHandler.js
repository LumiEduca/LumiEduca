export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    erro: err.message || "Erro interno do servidor",
  });
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}