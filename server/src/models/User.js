import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  fullName: { type: String, trim: true, maxlength: 200 }, // nombre completo opcional
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // se recomienda encriptarla antes de guardar
  rol: {
    type: String,
    enum: ["alumno", "profesor", "desarrollador"],
    default: "alumno"
  },
  telefono: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },
  biography: { type: String, trim: true, maxlength: 1000 }, // biografía opcional
  activo: { type: Boolean, default: true },
  meta: { type: Schema.Types.Mixed } // campo libre para datos adicionales (p.ej. { especialidad: 'Matemáticas' })
}, {
  timestamps: true
});

// UserSchema.index({ email: 1 });

export default model("User", UserSchema);
