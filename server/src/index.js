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
const __dirname = path.dirname(__filename);

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

// Habilitar debug solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 5, // Aumentado de 2 a 5 para mantener más conexiones activas
  serverSelectionTimeoutMS: 30000, // Aumentado a 30s para dar más tiempo
  socketTimeoutMS: 60000, // Aumentado a 60s para evitar timeouts prematuros
  connectTimeoutMS: 30000, // Añadido timeout de conexión
  family: 4,
  compressors: ['zlib'], // Solo zlib (viene incluido con Node.js)
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000, // Añadido para mantener conexión viva
};

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    console.log(`📍 Base de datos: ${mongoose.connection.name}`);
    console.log(`🔗 Pool size: min=${mongooseOptions.minPoolSize}, max=${mongooseOptions.maxPoolSize}`);
    
    mongoose.connection.db.admin().ping()
      .then(() => console.log("✅ MongoDB ping exitoso"))
      .catch(err => console.warn("⚠️ MongoDB ping falló:", err.message));
    
    if (process.env.NODE_ENV === 'development') {
      mongoose.connection.db.admin().command({ 
        profile: 2, 
        slowms: 100
      }).catch(err => console.log('ℹ️ Profiling no disponible:', err.message));
    }
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));

mongoose.connection.on('error', err => {
  console.error('❌ Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado - intentando reconectar...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconectado');
});

mongoose.connection.on('close', () => {
  console.warn('⚠️ Conexión de MongoDB cerrada');
});

// Manejar señales de terminación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB desconectado debido a la terminación de la aplicación');
  process.exit(0);
});

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));