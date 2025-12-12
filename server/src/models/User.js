import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  fullName: { type: String, trim: true, maxlength: 200 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ["alumno", "profesor", "desarrollador"],
    default: "alumno"
  },
  telefono: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },
  biography: { type: String, trim: true, maxlength: 1000 },
  activo: { type: Boolean, default: true },
  asignaturasCursadas: { type: [String], default: [] },
}, {
  timestamps: true
});

// OPTIMIZACIONES: Añadir índices para queries frecuentes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ rol: 1, activo: 1 });
UserSchema.index({ activo: 1 });

// Excluir password por defecto en todas las queries
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// Método para buscar usuarios activos por rol (optimizado)
UserSchema.statics.findActiveByRole = function(role, limit = 50) {
  return this.find({ rol: role, activo: true })
    .select('-password')
    .limit(limit)
    .lean();
};

export default model("User", UserSchema);