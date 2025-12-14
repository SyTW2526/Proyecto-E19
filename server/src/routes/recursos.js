import express from "express";
import Recurso, { ReservaRecurso } from "../models/Recurso.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// ====== RUTAS ESPECÍFICAS PRIMERO (antes de las rutas con :id) ======

// Obtener reservas del usuario autenticado (todos los recursos)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar que "mis-reservas" se interprete como un ID
router.get('/mis-reservas', protect, async (req, res) => {
  try {
    const reservas = await ReservaRecurso.find({ usuario: req.user._id })
      .sort({ fechaReserva: -1 })
      .limit(50)
      .select('recurso fechaReserva estado notas createdAt')
      .populate('recurso', 'nombre tipo ubicacion')
      .lean();
    
    res.json(reservas);
  } catch (err) {
    console.error('Error fetching user reservations:', err.message);
    res.status(500).json({ error: 'server_error', details: err.message });
  }
});

// ====== RUTAS GENERALES DE RECURSOS ======

// Crear recurso
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.nombre || !data.tipo) {
      return res.status(400).json({ error: "missing_fields", details: "nombre and tipo are required" });
    }
    const recurso = new Recurso({ ...data });
    await recurso.save();
    res.status(201).json(recurso);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// Listar recursos (por tipo, activo, disponibilidad)
router.get("/", async (req, res) => {
  try {
    const { tipo, estaActivo, limit = 100, page = 1 } = req.query;
    const query = {};
    if (tipo) query.tipo = tipo;
    if (estaActivo !== undefined) query.estaActivo = estaActivo === "true";

    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const docs = await Recurso.find(query)
      .select('nombre tipo capacidad ubicacion descripcion estaActivo')
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(lim)
      .lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leer por id
// IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas específicas como /mis-reservas
router.get("/:id", async (req, res) => {
  try {
    const r = await Recurso.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar
router.put("/:id", async (req, res) => {
  try {
    const r = await Recurso.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Borrar
router.delete("/:id", async (req, res) => {
  try {
    const r = await Recurso.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== RUTAS DE RESERVAS ======

// Crear reserva de recurso (usuario autenticado requerido)
router.post('/:id/reservas', protect, async (req, res) => {
  try {
    const { fechaReserva } = req.body;

    if (!fechaReserva) {
      return res.status(400).json({ error: 'missing_fields', details: 'fechaReserva is required' });
    }

    // Verificar que el recurso existe y está activo
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso) return res.status(404).json({ error: 'recurso_not_found' });
    if (!recurso.estaActivo) return res.status(400).json({ error: 'recurso_inactive' });

    const fecha = new Date(fechaReserva);
    if (isNaN(fecha)) return res.status(400).json({ error: 'invalid_date' });

    // Comprobar reservas existentes el mismo día
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const reservaExistente = await ReservaRecurso.findOne({
      recurso: req.params.id,
      fechaReserva: { $gte: startOfDay, $lte: endOfDay },
      estado: { $ne: 'cancelada' }
    }).select('_id').lean();

    if (reservaExistente) {
      return res.status(409).json({ error: 'already_reserved', details: 'Resource already reserved for this date' });
    }

    const reserva = new ReservaRecurso({
      recurso: req.params.id,
      usuario: req.user._id,
      fechaReserva: fecha
    });

    await reserva.save();
    await reserva.populate('recurso usuario', 'nombre name email');
    res.status(201).json(reserva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', details: err.message });
  }
});

// Listar reservas de un recurso
router.get("/:id/reservas", async (req, res) => {
  try {
    const { desde, hasta, limit = 100, page = 1 } = req.query;
    const query = { recurso: req.params.id };

    if (desde || hasta) {
      query.fechaReserva = {};
      if (desde) query.fechaReserva.$gte = new Date(desde);
      if (hasta) query.fechaReserva.$lte = new Date(hasta);
    }

    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const reservas = await ReservaRecurso.find(query)
      .sort({ fechaReserva: 1 })
      .skip(skip)
      .limit(lim)
      .select('fechaReserva estado usuario recurso createdAt')
      .populate("usuario", "name email")
      .populate("recurso", "nombre tipo")
      .lean();

    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reserva por ID
router.get("/:recursoId/reservas/:reservaId", async (req, res) => {
  try {
    const reserva = await ReservaRecurso.findById(req.params.reservaId)
      .select('fechaReserva estado usuario recurso notas createdAt')
      .populate("usuario", "name email")
      .populate("recurso", "nombre tipo ubicacion")
      .lean();
    
    if (!reserva) return res.status(404).json({ error: "not_found" });
    if (reserva.recurso._id.toString() !== req.params.recursoId) {
      return res.status(400).json({ error: "reservation_id_incorrect" });
    }
    
    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar reserva: solo cambiar la hora
router.put('/:recursoId/reservas/:reservaId', protect, async (req, res) => {
  try {
    const { fechaReserva } = req.body;
    if (!fechaReserva) return res.status(400).json({ error: 'missing_fields', details: 'fechaReserva is required' });

    const reserva = await ReservaRecurso.findById(req.params.reservaId);
    if (!reserva) return res.status(404).json({ error: 'not_found' });

    if (reserva.recurso.toString() !== req.params.recursoId) {
      return res.status(400).json({ error: 'reservation_id_incorrect' });
    }

    const isOwner = reserva.usuario.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.rol === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });

    if (reserva.estado === 'cancelada') {
      return res.status(400).json({ error: 'cannot_edit_cancelled_reservation' });
    }

    const newDate = new Date(fechaReserva);
    if (isNaN(newDate)) return res.status(400).json({ error: 'invalid_date' });

    reserva.fechaReserva = newDate;
    await reserva.save();
    await reserva.populate('recurso usuario', 'nombre name email');
    res.json(reserva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', details: err.message });
  }
});

// Cancelar reserva: solo usuario dueño o admin puede cancelar
router.delete('/:recursoId/reservas/:reservaId', protect, async (req, res) => {
  try {
    const reserva = await ReservaRecurso.findById(req.params.reservaId);
    if (!reserva) return res.status(404).json({ error: 'not_found' });

    if (reserva.recurso.toString() !== req.params.recursoId) {
      return res.status(400).json({ error: 'reservation_id_incorrect' });
    }

    const isOwner = reserva.usuario.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.rol === 'admin';
    if (!isOwner && !isAdmin) {
      console.log('Forbidden: usuario reserva:', reserva.usuario.toString(), 'usuario actual:', req.user._id.toString());
      return res.status(403).json({ error: 'forbidden' });
    }

    // marcar como cancelada para mantener histórico
    reserva.estado = 'cancelada';
    await reserva.save();
    res.json({ ok: true, message: 'Reservation cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
