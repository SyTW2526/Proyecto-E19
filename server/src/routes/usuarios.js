import express from "express";
import User from "../models/User.js";

const router = express.Router();


// Obtener usuario por ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuarios (filtrar por rol, nombre o activo)
router.get("/", async (req, res) => {
  try {
    const { rol, activo, nombre } = req.query;
    const q = {};
    if (rol) q.rol = rol;
    if (activo !== undefined) q.activo = activo === "true";
    if (nombre) q.name = { $regex: nombre, $options: "i" };

    const users = await User.find(q).select("-password").sort({ name: 1 }).limit(100);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    delete data.email; // evitar cambios de email directamente
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ error: "not_found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
