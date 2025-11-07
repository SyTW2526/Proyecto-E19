import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const TutoriaSchema = new Schema({
  tema: { type: String, required: true, trim: true, maxlength: 200 }, // asunto o tema de la tutoría
  descripcion: { type: String, trim: true },
  profesor: { type: Types.ObjectId, ref: "User", required: true }, // quien imparte la tutoría
  estudiante: { type: Types.ObjectId, ref: "User", required: true }, // quien la recibe
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  modalidad: { type: String, enum: ["presencial", "online"], default: "presencial" },
  lugar: { type: String, trim: true }, // aula, enlace, etc.
  estado: { type: String, enum: ["confirmada", "pendiente", "cancelada"], default: "pendiente" },
  notas: { type: String, trim: true },
  meta: { type: Schema.Types.Mixed }, // campo flexible (p.ej. { asignaturaId: '...' }) 
}, {
  timestamps: true
});

TutoriaSchema.index({ profesor: 1, fechaInicio: 1 });
TutoriaSchema.index({ estudiante: 1, fechaInicio: 1 });
TutoriaSchema.index({ fechaInicio: 1, fechaFin: 1 });

export default model("Tutoria", TutoriaSchema);
