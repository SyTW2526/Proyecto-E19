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

// Añadir índices compuestos para mejorar las queries
TutoriaSchema.index({ profesor: 1, fechaInicio: -1 });
TutoriaSchema.index({ estudiante: 1, fechaInicio: -1 });
TutoriaSchema.index({ fechaInicio: 1, estado: 1 });
TutoriaSchema.index({ estado: 1, fechaInicio: 1 });

// Métodos estáticos optimizados
TutoriaSchema.statics.findByProfesorOptimized = function(profesorId, limit = 10) {
  return this.find({ profesor: profesorId })
    .select('tema fechaInicio fechaFin estado modalidad')
    .sort({ fechaInicio: -1 })
    .limit(limit)
    .lean();
};

TutoriaSchema.statics.findByEstudianteOptimized = function(estudianteId, limit = 10) {
  return this.find({ estudiante: estudianteId })
    .select('tema fechaInicio fechaFin estado modalidad profesor')
    .populate('profesor', 'name email')
    .sort({ fechaInicio: -1 })
    .limit(limit)
    .lean();
};

TutoriaSchema.statics.countByProfesor = function(profesorId) {
  return this.countDocuments({ profesor: profesorId });
};

TutoriaSchema.statics.findUpcoming = function(userId, userRole, limit = 10) {
  const now = new Date();
  const query = userRole === 'profesor' 
    ? { profesor: userId, fechaInicio: { $gte: now }, estado: { $ne: 'cancelada' } }
    : { estudiante: userId, fechaInicio: { $gte: now }, estado: { $ne: 'cancelada' } };
  
  return this.find(query)
    .select('tema fechaInicio fechaFin estado modalidad lugar')
    .sort({ fechaInicio: 1 })
    .limit(limit)
    .lean();
};

export default model("Tutoria", TutoriaSchema);
