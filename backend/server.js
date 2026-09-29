import "dotenv/config";
import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import salaRoutes from "./routes/salaRoutes.js";
import atividadeRoutes from "./routes/atividadeRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/notifications", notificationRoutes);
app.use("/auth", authRoutes);
app.use("/salas", salaRoutes);
app.use("/atividades", atividadeRoutes);

app.get("/", (req, res) => {
  res.send("LumiEduca Backend Online 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});