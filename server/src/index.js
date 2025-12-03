import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import eventosRouter from "./routes/eventos.js";
import forosRouter from "./routes/foro.js";
import threadsRouter from "./routes/threads.js";
import postsRouter from "./routes/posts.js";
import userRouter from "./routes/usuarios.js";
import tutoriaRouter from "./routes/tutorias.js";
import authRouter from "./routes/auth.js";
import recursoRouter from "./routes/recursos.js";
import tutoriasRouter from "./routes/horariotutoria.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto es /.../Proyecto-E19/server/src

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(express.static("/app_static"));

// Configuración optimizada de MongoDB
mongoose.set('strictQuery', false);

const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    // Crear índices si no existen
    mongoose.connection.db.admin().ping()
      .then(() => console.log("✅ MongoDB ping exitoso"))
      .catch(err => console.warn("⚠️ MongoDB ping falló:", err.message));
  })
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
app.use("/api/usuarios", userRouter);
app.use("/api/tutorias", tutoriaRouter);
app.use("/api/auth", authRouter);
app.use("/api/recursos", recursoRouter);
app.use("/api/horarios", tutoriasRouter);

// app.get("*", (req, res) => {
//   res.sendFile(path.join(staticAppPath, "index.html"));
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
