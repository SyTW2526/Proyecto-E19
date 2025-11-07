import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const ThreadSchema = new Schema({
  foro: { type: Types.ObjectId, ref: "Foro", required: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  locked: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  tags: [String],
  views: { type: Number, default: 0 },
  status: { type: String, enum: ["visible","hidden","deleted"], default: "visible" },
  firstPost: { type: Types.ObjectId, ref: "Post" } // opcional, para acceder rápido
}, { timestamps: true });

// índices para listar hilos por foro y ordenarlos por fecha o sticky
ThreadSchema.index({ forum: 1, sticky: -1, updatedAt: -1 });
ThreadSchema.index({ author: 1, createdAt: -1 });

export default model("Thread", ThreadSchema);