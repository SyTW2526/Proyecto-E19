import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const PostSchema = new Schema({
  thread: { type: Types.ObjectId, ref: "Thread", required: true },
  author: { type: Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true },
  parent: { type: Types.ObjectId, ref: "Post", default: null }, // para anidado 
  edited: {
    at: Date,
    by: { type: Types.ObjectId, ref: "User" }
  },
  status: { type: String, enum: ["visible","hidden","deleted"], default: "visible" }
}, { timestamps: true });

// índices de consulta
PostSchema.index({ thread: 1, createdAt: 1 });
PostSchema.index({ author: 1, createdAt: -1 });
// texto para búsqueda
PostSchema.index({ body: "text" });

export default model("Post", PostSchema);