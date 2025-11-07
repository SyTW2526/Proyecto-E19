import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import eventosRouter from "./routes/eventos.js";
import forosRouter from "./routes/foro.js";
import threadsRouter from "./routes/threads.js";
import postsRouter from "./routes/posts.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto es /.../Proyecto-E19/server/src

const app = express();
app.use(cors());
app.use(express.json());

const staticAppPath = path.join(__dirname, "..", "..", "app");
app.use(express.static(staticAppPath));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor de tutorías funcionando 🚀\n");
});

app.get("/api/", (req, res) => {
  res.send("El backend de Tutorías está funcionando 🚀");
});

app.use("/api/eventos", eventosRouter);
app.use("/api/foros", forosRouter); 
app.use("/api/threads", threadsRouter); 
app.use("/api/posts", postsRouter);

// app.get("*", (req, res) => {
//   res.sendFile(path.join(staticAppPath, "index.html"));
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
