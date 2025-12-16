import express from "express";
import EventoPersonal from "../models/EventoPersonal.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Crear (requiere autenticación)
router.post("/", protect, async (req, res) => {
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
// También incluye eventos "shared" de profesores si el usuario es alumno
router.get("/", protect, async (req, res) => {
  try {
    const { owner, start, end, userId, userRole } = req.query;
    const q = {};
    
    // Verificar que el usuario autenticado coincide con userId
    if (userId && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "forbidden", message: "No puedes acceder a eventos de otro usuario" });
    }
    
    // Si es alumno, incluir eventos propios Y eventos compartidos de profesores
    if (userRole === 'alumno' && userId) {
      q.$or = [
        { owner: userId }, // Eventos propios
        { visibility: 'shared' } // Eventos compartidos por profesores
      ];
    } else if (owner) {
      // Para profesores y otros, solo mostrar sus propios eventos
      q.owner = owner;
    }
    
    // Filtrar por rango de fechas si se proporciona
    if (start && end) {
      q.start = { $lt: new Date(end) };
      q.end = { $gt: new Date(start) };
    }
    
    const docs = await EventoPersonal.find(q)
      .populate('owner', 'name email rol')
      .sort({ start: 1 })
      .limit(100)
      .lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar (solo el dueño puede actualizar)
router.put("/:id", protect, async (req, res) => {
  try {
    const ev = await EventoPersonal.findById(req.params.id);
    if (!ev) return res.status(404).json({ error: "not_found" });
    
    // Verificar que el usuario es el dueño
    if (ev.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "forbidden", message: "No tienes permiso para editar este evento" });
    }
    
    // Validar fechas
    if (req.body.start && req.body.end && new Date(req.body.start) >= new Date(req.body.end)) {
      return res.status(400).json({ error: "invalid_dates", message: "La fecha de inicio debe ser anterior a la de fin" });
    }
    
    Object.assign(ev, req.body);
    await ev.save();
    res.json(ev);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Borrar (solo el dueño puede borrar)
router.delete("/:id", protect, async (req, res) => {
  try {
    const ev = await EventoPersonal.findById(req.params.id);
    if (!ev) return res.status(404).json({ error: "not_found" });
    
    // Verificar que el usuario es el dueño
    if (ev.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "forbidden", message: "No tienes permiso para borrar este evento" });
    }
    
    await EventoPersonal.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

