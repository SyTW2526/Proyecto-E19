import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Listar profesores activos (endpoint público optimizado para dashboard)
router.get("/profesores", protect, async (req, res) => {
  try {
    const profesores = await User.find({ 
      rol: 'profesor', 
      activo: true 
    })
      .select('name email avatarUrl') // Solo info pública necesaria
      .limit(100)
      .sort({ name: 1 })
      .lean();
    
    res.json(profesores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuarios (con filtros opcionales) - PROTEGIDO
router.get("/", protect, async (req, res) => {
  try {
    const { rol, activo, limit = 100, page = 1 } = req.query;
    
    // Construir query
    const query = {};
    if (rol) query.rol = rol; // Filtrar por rol (ej: ?rol=profesor)
    if (activo !== undefined) query.activo = activo === 'true';
    
    // Paginación
    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    
    // Query optimizada
    const users = await User.find(query)
      .select('name email rol telefono avatarUrl activo') // Solo campos necesarios
      .skip(skip)
      .limit(lim)
      .sort({ name: 1 })
      .lean(); // Devolver objetos planos (más rápido)
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leer por id - PROTEGIDO
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario - PROTEGIDO con ownership
router.put("/:id", protect, async (req, res) => {
  try {
    // Verificar ownership: solo puedes editar tu propio perfil (o ser desarrollador)
    if (req.params.id !== req.user._id.toString() && req.user.rol !== 'desarrollador') {
      return res.status(403).json({ error: 'forbidden', message: 'No tienes permiso para editar este perfil' });
    }

    const data = req.body;
    delete data.email; // evitar cambios de email directamente
    delete data.password; // evitar cambios de password por esta ruta
    delete data.rol; // evitar cambios de rol
    
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cambiar contraseña - PROTEGIDO con ownership
router.put("/:id/cambiar-password", protect, async (req, res) => {
  try {
    // Verificar ownership: solo puedes cambiar tu propia contraseña
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: 'forbidden', message: 'No tienes permiso para cambiar esta contraseña' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan campos obligatorios (currentPassword, newPassword)" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la contraseña actual es correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ error: "Error al cambiar la contraseña", details: err.message });
  }
});

// Eliminar usuario - PROTEGIDO (solo desarrolladores)
router.delete("/:id", protect, async (req, res) => {
  try {
    // Solo desarrolladores pueden eliminar usuarios
    if (req.user.rol !== 'desarrollador') {
      return res.status(403).json({ error: 'forbidden', message: 'Solo desarrolladores pueden eliminar usuarios' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;