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

const ReservaRecursoSchema = new Schema({
  recurso: { type: Schema.Types.ObjectId, ref: "Recurso", required: true },
  usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fechaReserva: { type: Date, required: true },
  estado: { type: String, enum: ["confirmada", "cancelada", "completada"], default: "confirmada" },
  notas: { type: String }
}, {
  timestamps: true
});

export default model("Recurso", RecursoSchema);
export const ReservaRecurso = model("ReservaRecurso", ReservaRecursoSchema);