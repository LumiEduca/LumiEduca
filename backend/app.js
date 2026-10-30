import express from "express";
import cors from "cors";
import helmet from "helmet";
import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { limiteGeral } from "./middlewares/rateLimit.js";
import authRoutes from "./routes/authRoutes.js";
import lumiRoutes from "./routes/lumiRoutes.js";
import salaRoutes from "./routes/salaRoutes.js";
import progressoRoutes from "./routes/progressoRoutes.js";
import atividadeRoutes from "./routes/atividadeRoutes.js";

const app = express();

// Necessário para a Vercel ler IPs reais e rodar sob HTTPS corretamente
app.set("trust proxy", 1);

// Cabeçalhos de segurança (também remove o X-Powered-By)
app.use(helmet());

// CORS fecha por padrão em produção. FRONTEND_URL aceita vários domínios separados por vírgula
const origens = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: origens.length ? origens : process.env.NODE_ENV === "production" ? false : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

app.use(express.json({ limit: "100kb" }));

// Limite geral de requisições por IP
app.use("/api", limiteGeral);

app.use("/api/v1/notificacoes", notificationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/lumi", lumiRoutes);
app.use("/api/v1/salas", salaRoutes);
app.use("/api/v1/progresso", progressoRoutes);
app.use("/api/v1/atividades", atividadeRoutes);

app.get("/", (req, res) => {
  res.send("LumiEduca Backend Online");
});

// Handler para rota não encontrada (404) em formato JSON
app.use((req, res, next) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use(errorHandler);

export default app;