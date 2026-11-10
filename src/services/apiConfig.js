// URL base do backend
// Desenvolvimento: http://localhost:5000
// Produção: https://lumieduca-api.vercel.app

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default API_BASE_URL;