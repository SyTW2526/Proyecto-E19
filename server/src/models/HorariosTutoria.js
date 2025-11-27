import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const HorarioTutoriaSchema = new Schema({
  profesor: { type: Types.ObjectId, ref: "User", required: true },

  asignatura: { type: String, required: true },

  modalidad: { type: String, enum: ["presencial", "online"], required: true },
  lugar: { type: String, trim: true }, // obligatorio solo si es presencial

  diaSemana: {
    type: String,
    enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
    required: true
  },

  horaInicio: { type: String, required: true }, // formato "HH:MM"
  horaFin: { type: String, required: true },

  activo: { type: Boolean, default: true },

  meta: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// índice
HorarioTutoriaSchema.index({ profesor: 1, diaSemana: 1 });

// Validación: si modalidad es 'presencial' lugar es obligatorio
HorarioTutoriaSchema.path('lugar').validate(function(value) {
  if (this.modalidad === 'presencial') {
    return typeof value === 'string' && value.trim().length > 0;
  }
  return true;
}, 'El campo "lugar" es obligatorio para modalidad presencial.');

// Helper para parsear "HH:MM" a minutos desde medianoche
function hhmmToMinutes(hhmm) {
  if (typeof hhmm !== 'string') return NaN;
  const [hh, mm] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
  return hh * 60 + mm;
}

// Pre-validate: comprobar que horaInicio < horaFin
HorarioTutoriaSchema.pre('validate', function(next) {
  const startMin = hhmmToMinutes(this.horaInicio);
  const endMin = hhmmToMinutes(this.horaFin);
  if (Number.isNaN(startMin) || Number.isNaN(endMin)) {
    return next(new Error('Formato de hora inválido. Use "HH:MM".'));
  }
  if (startMin >= endMin) {
    return next(new Error('horaInicio debe ser anterior a horaFin.'));
  }
  return next();
});

// Transformación toJSON / toObject: quitar __v y renombrar _id -> id
if (!HorarioTutoriaSchema.options.toJSON) HorarioTutoriaSchema.options.toJSON = {};
HorarioTutoriaSchema.options.toJSON.transform = function(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Método estático: buscar horarios activos de un profesor
HorarioTutoriaSchema.statics.findActiveForProfesor = function(profesorId, filter = {}) {
  const q = { profesor: profesorId, activo: true, ...filter };
  return this.find(q).sort({ diaSemana: 1, horaInicio: 1 }).exec();
};

export default model("HorarioTutoria", HorarioTutoriaSchema);
