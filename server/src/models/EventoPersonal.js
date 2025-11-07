import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const EventoPersonalSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },
  owner: { type: String, required: true }, 
  participants: [{ type: String }],        // invitados
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  location: { type: String },
  visibility: { type: String, enum: ["private","shared","public"], default: "private" },
  status: { type: String, enum: ["confirmed","tentative","cancelled"], default: "confirmed" },
  tags: [{ type: String }],
  color: { type: String, default: "#3A87AD" },
  meta: { type: Schema.Types.Mixed }, // campo libre para enlazar (p.ej. {asignaturaId: '...'})
}, {
  timestamps: true
});

EventoPersonalSchema.index({ owner: 1, start: 1 });
EventoPersonalSchema.index({ participants: 1, start: 1 });
EventoPersonalSchema.index({ start: 1, end: 1 });

export default model("EventoPersonal", EventoPersonalSchema);
