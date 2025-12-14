import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const ForoSchema = new Schema({
  key: { type: String, required: true, unique: true }, // p.ej. "MAT101", "ANUNCIOS"
  title: { type: String, required: true },
  description: String,
  owner: { type: Types.ObjectId, ref: "User" }, // responsable / profesor
  visibility: { type: String, enum: ["public","private","course"], default: "course" },
  meta: Schema.Types.Mixed
}, { timestamps: true });



export default model("Foro", ForoSchema);