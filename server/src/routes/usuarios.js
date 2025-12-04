import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Listar todos
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leer por id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
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