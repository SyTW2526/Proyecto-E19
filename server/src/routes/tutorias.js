import express from "express";
import Tutoria from "../models/Tutoria.js";

const router = express.Router();

// Crear tutoría
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (new Date(data.fechaInicio) >= new Date(data.fechaFin)) {
      return res.status(400).json({ error: "fechaInicio debe ser anterior a fechaFin" });
    }
    const tutoria = new Tutoria({ ...data });
    await tutoria.save();
    res.status(201).json(tutoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// Leer por id
router.get("/:id", async (req, res) => {
  try {
    const tutoria = await Tutoria.findById(req.params.id)
      .populate("profesor", "name email")
      .populate("estudiante", "name email");
    if (!tutoria) return res.status(404).json({ error: "not_found" });
    res.json(tutoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar tutorías por profesor/estudiante y rango de fechas
router.get("/", async (req, res) => {
  try {
    const { profesor, estudiante, inicio, fin } = req.query;
    const q = {};
    if (profesor) q.profesor = profesor;
    if (estudiante) q.estudiante = estudiante;
    if (inicio && fin) {
      q.$or = [
        { fechaInicio: { $lt: new Date(fin) }, fechaFin: { $gt: new Date(inicio) } },
      ];
    }
    const docs = await Tutoria.find(q).sort({ fechaInicio: 1 }).limit(100);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar tutoría
router.put("/:id", async (req, res) => {
  try {
    const tutoria = await Tutoria.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tutoria) return res.status(404).json({ error: "not_found" });
    res.json(tutoria);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar tutoría
router.delete("/:id", async (req, res) => {
  try {
    const tutoria = await Tutoria.findByIdAndDelete(req.params.id);
    if (!tutoria) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;
