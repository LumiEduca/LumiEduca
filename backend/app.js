import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import lumiRoutes from "./routes/lumiRoutes.js";
import salaRoutes from "./routes/salaRoutes.js";
import progressoRoutes from "./routes/progressoRoutes.js";
import atividadeRoutes from "./routes/atividadeRoutes.js";

const app = express();

// Necessário para a Vercel ler IPs reais e rodar sob HTTPS corretamente
app.set('trust proxy', 1);

// Restringe o CORS para o domínio do frontend (ou libera em dev)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

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
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use(errorHandler);

export default app;