import { Router } from "express";
import HorarioTutoria from "../models/HorariosTutoria.js";
import Tutoria from "../models/Tutoria.js";
import User from "../models/User.js";

const router = Router();

/* ===========================================================
   HORARIOS DE TUTORÍA (creados por profesores)
   =========================================================== */

// Crear un horario
router.post("/", async (req, res) => {
  try {
    const { profesor, asignatura, modalidad, lugar, diaSemana, horaInicio, horaFin } = req.body;

    // Validación mínima
    if (!profesor || !asignatura || !modalidad || !diaSemana || !horaInicio || !horaFin) {
      return res.status(400).json({ error: "Faltan campos requeridos." });
    }

    const esProfesor = await User.findById(profesor);
    if (!esProfesor || esProfesor.rol !== "profesor") {
      return res.status(400).json({ error: "El usuario no es profesor." });
    }

    const horario = await HorarioTutoria.create({
      profesor,
      asignatura,
      modalidad,
      lugar,
      diaSemana,
      horaInicio,
      horaFin
    });

    res.status(201).json(horario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los horarios activos
router.get("/", async (req, res) => {
  try {
    const horarios = await HorarioTutoria.find({ activo: true }).sort({ diaSemana: 1, horaInicio: 1 }).lean();
    return res.json(horarios);
  } catch (err) {
    console.error("GET /api/horarios error", err);
    return res.status(500).json({ error: err.message });
  }
});

// Obtener horarios de un profesor
router.get("/:profesorId", async (req, res) => {
  try {
    const horarios = await HorarioTutoria.find({
      profesor: req.params.profesorId,
      activo: true
    })
    .lean();

    res.json(horarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===========================================================
   DISPONIBILIDAD
   =========================================================== */

// Obtener huecos disponibles en una fecha concreta
router.get("/disponibilidad", async (req, res) => {
  try {
    const { profesor, fecha } = req.query;

    if (!profesor || !fecha) {
      return res.status(400).json({ error: "Profesor y fecha son obligatorios." });
    }

    const fechaObj = new Date(fecha);
    const diaSemanaIndex = fechaObj.getDay();
    const dias = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
    const diaSemana = dias[diaSemanaIndex];

    // 1. Horarios del profesor en ese día
    const horarios = await HorarioTutoria.find({
      profesor,
      diaSemana,
      activo: true
    })
    .lean();

    // 2. Reservas existentes en esa fecha
    const reservas = await Tutoria.find({
      profesor,
      fechaInicio: {
        $gte: new Date(fechaObj.setHours(0, 0, 0, 0)),
        $lte: new Date(fechaObj.setHours(23, 59, 59, 999))
      }
    })
    .lean();

    res.json({ horarios, reservas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===========================================================
   RESERVAS (TUTORIAS)
   =========================================================== */

// Crear reserva
router.post("/reservas", async (req, res) => {
  try {
    const { profesor, estudiante, fechaInicio, fechaFin, modalidad, lugar, tema, descripcion } = req.body;

    if (!profesor || !estudiante || !fechaInicio || !fechaFin || !tema) {
      return res.status(400).json({ error: "Faltan campos requeridos." });
    }

    // Comprobar solapamientos
    const solape = await Tutoria.findOne({
      profesor,
      fechaInicio: { $lt: new Date(fechaFin) },
      fechaFin: { $gt: new Date(fechaInicio) }
    });

    if (solape) {
      return res.status(400).json({ error: "El horario ya está reservado." });
    }

    const reserva = await Tutoria.create({
      profesor,
      estudiante,
      fechaInicio,
      fechaFin,
      modalidad,
      lugar,
      tema,
      descripcion
    });

    res.status(201).json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reservas de un alumno
router.get("/reservas/alumno/:id", async (req, res) => {
  try {
    const reservas = await Tutoria.find({
      estudiante: req.params.id
    })
      .populate("profesor", "name email")
      .sort({ fechaInicio: 1 });

    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reservas de un profesor
router.get("/reservas/profesor/:id", async (req, res) => {
  try {
    const reservas = await Tutoria.find({
      profesor: req.params.id
    })
      .populate("estudiante", "name email")
      .sort({ fechaInicio: 1 });

    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un horario
router.delete("/:id", async (req, res) => {
  try {
    const horario = await HorarioTutoria.findByIdAndDelete(req.params.id);

    if (!horario) {
      return res.status(404).json({ error: "Horario no encontrado." });
    }

    res.json({ message: "Horario eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { profesor, asignatura, modalidad, lugar, diaSemana, horaInicio, horaFin, activo } = req.body;

    if (
      !profesor &&
      !asignatura &&
      !modalidad &&
      !lugar &&
      !diaSemana &&
      !horaInicio &&
      !horaFin &&
      typeof activo === "undefined"
    ) {
      return res.status(400).json({ error: "No hay campos para actualizar." });
    }

    if (profesor) {
      const esProfesor = await User.findById(profesor);
      if (!esProfesor || esProfesor.rol !== "profesor") {
        return res.status(400).json({ error: "El usuario no es profesor." });
      }
    }

    if (horaInicio && horaFin) {
      const start = new Date(`1970-01-01T${horaInicio}`);
      const end = new Date(`1970-01-01T${horaFin}`);
      if (isNaN(start) || isNaN(end) || start >= end) {
        return res.status(400).json({ error: "horaInicio debe ser anterior a horaFin y formatos válidos." });
      }
    }

    const update = {};
    if (profesor) update.profesor = profesor;
    if (asignatura) update.asignatura = asignatura;
    if (modalidad) update.modalidad = modalidad;
    if (lugar) update.lugar = lugar;
    if (diaSemana) update.diaSemana = diaSemana;
    if (horaInicio) update.horaInicio = horaInicio;
    if (horaFin) update.horaFin = horaFin;
    if (typeof activo !== "undefined") update.activo = activo;

    const horario = await HorarioTutoria.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!horario) {
      return res.status(404).json({ error: "Horario no encontrado." });
    }

    res.json(horario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
