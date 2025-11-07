import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const ForoSchema = new Schema({
  key: { type: String, required: true, unique: true }, // p.ej. "MAT101", "ANUNCIOS"
  title: { type: String, required: true },
  description: String,
  owner: { type: String }, // responsable / profesor
  visibility: { type: String, enum: ["public","private","course"], default: "course" },
  meta: Schema.Types.Mixed
}, { timestamps: true });

ForoSchema.index({ key: 1 });

export default model("Foro", ForoSchema);