import express from 'express';
import mongoose from 'mongoose';
import HorarioTutoria from '../models/HorariosTutoria.js';

const router = express.Router();

// GET /api/horarios?profesorId=...
router.get('/', async (req, res) => {
  try {
    const { profesorId } = req.query;
    const q = {};
    if (profesorId) {
      q.profesor = mongoose.Types.ObjectId.isValid(profesorId) ? mongoose.Types.ObjectId(profesorId) : profesorId;
    }
    const docs = await HorarioTutoria.find(q).sort({ diaSemana: 1, horaInicio: 1 }).lean();
    return res.status(200).json(docs);
  } catch (err) {
    console.error('GET /api/horarios error', err);
    return res.status(500).json({ error: err.message || 'Error' });
  }
});

// POST /api/horarios
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = await HorarioTutoria.create(payload);
    return res.status(201).json(doc);
  } catch (err) {
    console.error('POST /api/horarios error', err);
    return res.status(400).json({ error: err.message || 'Error creando horario' });
  }
});

// DELETE /api/horarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const deleted = await HorarioTutoria.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json({ success: true, deleted });
  } catch (err) {
    console.error('DELETE /api/horarios/:id error', err);
    return res.status(500).json({ error: err.message || 'Error' });
  }
});

export default router;
