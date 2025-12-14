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

// Índices para mejorar rendimiento
UserSchema.index({ email: 1 });
UserSchema.index({ rol: 1, activo: 1 });
UserSchema.index({ name: 1 });

export default model("User", UserSchema);