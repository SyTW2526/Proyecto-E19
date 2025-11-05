import express from "express";
import EventoPersonal from "../models/EventoPersonal.js";

const router = express.Router();

// Crear
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    // valida que start < end
    if (new Date(data.start) >= new Date(data.end)) {
      return res.status(400).json({ error: "start must be before end" });
    }
    const evento = new EventoPersonal({ ...data });
    await evento.save();
    res.status(201).json(evento);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// Leer por id
router.get("/:id", async (req, res) => {
  try {
    const ev = await EventoPersonal.findById(req.params.id)
      .populate("owner", "name email")       // ejemplo
      .populate("participants", "name email");
    if (!ev) return res.status(404).json({ error: "not_found" });
    res.json(ev);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar por owner y rango de fechas (útil para calendario)
router.get("/", async (req, res) => {
  try {
    const { owner, start, end } = req.query;
    const q = {};
    if (owner) q.owner = owner;
    if (start && end) {
      q.$or = [
        { start: { $lt: new Date(end) }, end: { $gt: new Date(start) } },
        // si manejas recurrencias, debes generar ocurrencias desde rules
      ];
    }
    const docs = await EventoPersonal.find(q).sort({ start: 1 }).limit(100);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar
router.put("/:id", async (req, res) => {
  try {
    const ev = await EventoPersonal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ev) return res.status(404).json({ error: "not_found" });
    res.json(ev);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Borrar
router.delete("/:id", async (req, res) => {
  try {
    const ev = await EventoPersonal.findByIdAndDelete(req.params.id);
    if (!ev) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

