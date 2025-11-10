import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // se recomienda encriptarla antes de guardar
  rol: {
    type: String,
    enum: ["alumno", "profesor", "desarrollador"],
    default: "alumno"
  },
  telefono: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },
  activo: { type: Boolean, default: true },
  meta: { type: Schema.Types.Mixed } // campo libre para datos adicionales (p.ej. { especialidad: 'Matemáticas' })
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });

export default model("User", UserSchema);
