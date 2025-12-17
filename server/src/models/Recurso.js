// En: server/src/models/Recurso.js

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const RecursoSchema = new Schema({
  nombre: { type: String, required: true }, 
  tipo: { 
    type: String, 
    enum: ["sala_calculo", "carrel", "sala_reunion", "impresora_3D"], 
    required: true 
  },
  capacidad: { type: Number, default: 1 },
  ubicacion: { type: String },
  descripcion: { type: String },
  estaActivo: { type: Boolean, default: true } 
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
RecursoSchema.index({ tipo: 1, estaActivo: 1 });
RecursoSchema.index({ nombre: 1 });

const ReservaRecursoSchema = new Schema({
  recurso: { type: Schema.Types.ObjectId, ref: "Recurso", required: true },
  usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fechaReserva: { type: Date, required: true }, // Fecha y hora de inicio
  duracionHoras: { type: Number, default: 1, min: 0.5, max: 8 }, // Duración en horas (0.5 = 30min, máx 8h)
  estado: { type: String, enum: ["confirmada", "cancelada", "completada"], default: "confirmada" },
  notas: { type: String }
}, {
  timestamps: true
});

// Índices compuestos para queries frecuentes
ReservaRecursoSchema.index({ recurso: 1, fechaReserva: 1 });
ReservaRecursoSchema.index({ usuario: 1, fechaReserva: -1 });
ReservaRecursoSchema.index({ estado: 1 });

export default model("Recurso", RecursoSchema);
export const ReservaRecurso = model("ReservaRecurso", ReservaRecursoSchema);