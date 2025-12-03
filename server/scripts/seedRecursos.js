// Script para poblar la colección `recursos` con ejemplos (idempotente)
// Ejecutar desde la carpeta `server`: `node scripts/seedRecursos.js`

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recurso from '../src/models/Recurso.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyecto-e19';

const recursos = [
  // ESIT - Carrels (4)
  { nombre: 'Carrel ESIT 1', descripcion: 'Carrel individual con luz y enchufe.', tipo: 'carrel', ubicacion: 'ESIT, Planta 1', capacidad: 1, estaActivo: true },
  { nombre: 'Carrel ESIT 2', descripcion: 'Carrel individual con luz y enchufe.', tipo: 'carrel', ubicacion: 'ESIT, Planta 1', capacidad: 1, estaActivo: true },
  { nombre: 'Carrel ESIT 3', descripcion: 'Carrel individual con luz y enchufe.', tipo: 'carrel', ubicacion: 'ESIT, Planta 2', capacidad: 1, estaActivo: true },
  { nombre: 'Carrel ESIT 4', descripcion: 'Carrel individual con luz y enchufe.', tipo: 'carrel', ubicacion: 'ESIT, Planta 2', capacidad: 1, estaActivo: true },

  // Centro de Cálculo - Salas (4)
  { nombre: 'Sala Cálculo A', descripcion: 'Sala para prácticas con 30 puestos y pizarra.', tipo: 'sala_calculo', ubicacion: 'Centro de Cálculo, Planta 0', capacidad: 30, estaActivo: true },
  { nombre: 'Sala Cálculo B', descripcion: 'Sala para prácticas con 25 puestos y equipos.', tipo: 'sala_calculo', ubicacion: 'Centro de Cálculo, Planta 0', capacidad: 25, estaActivo: true },
  { nombre: 'Sala Cálculo C', descripcion: 'Sala mediana con 20 puestos.', tipo: 'sala_calculo', ubicacion: 'Centro de Cálculo, Planta 1', capacidad: 20, estaActivo: true },
  { nombre: 'Sala Cálculo D', descripcion: 'Sala mediana con 20 puestos.', tipo: 'sala_calculo', ubicacion: 'Centro de Cálculo, Planta 1', capacidad: 20, estaActivo: true },

  // Biblioteca - Salas de reunión (3)
  { nombre: 'Sala Reunión Biblioteca 1', descripcion: 'Sala de trabajo en grupo con mesa central.', tipo: 'sala_reunion', ubicacion: 'Biblioteca, Planta Baja', capacidad: 6, estaActivo: true },
  { nombre: 'Sala Reunión Biblioteca 2', descripcion: 'Sala de trabajo en grupo con pizarra móvil.', tipo: 'sala_reunion', ubicacion: 'Biblioteca, Planta 1', capacidad: 8, estaActivo: true },
  { nombre: 'Sala Reunión Biblioteca 3', descripcion: 'Sala de trabajo en grupo con enchufes y monitor.', tipo: 'sala_reunion', ubicacion: 'Biblioteca, Planta 1', capacidad: 10, estaActivo: true },
];

async function main() {
  console.log('Conectando a MongoDB...', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    for (const r of recursos) {
      // upsert por nombre para que el script sea idempotente
      const filter = { nombre: r.nombre };
      const update = { $set: r };
      const opts = { upsert: true, new: true };
      const doc = await Recurso.findOneAndUpdate(filter, update, opts).lean().exec();
      console.log(`Guardado: ${doc.nombre} (${doc._id})`);
    }

    console.log('Seed completado.');
  } catch (err) {
    console.error('Error al ejecutar seed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
