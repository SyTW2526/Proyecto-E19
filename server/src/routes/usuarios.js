import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Listar usuarios (con filtros opcionales)
router.get("/", async (req, res) => {
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

// Leer por id
router.get("/:id", async (req, res) => {
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

// Actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    delete data.email; // evitar cambios de email directamente
    delete data.password; // evitar cambios de password por esta ruta
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cambiar contraseña
router.put("/:id/cambiar-password", async (req, res) => {
  try {
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

// Eliminar usuario
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;