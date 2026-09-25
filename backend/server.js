import express from "express";
import cors from "cors";
import "dotenv/config";
import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("LumiEduca Backend Online");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});