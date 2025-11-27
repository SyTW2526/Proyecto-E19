// Script para actualizar reservas antiguas con campo estado
// Ejecutar: node scripts/updateReservas.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ReservaRecurso } from '../src/models/Recurso.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyecto-e19';

async function main() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado\n');

    // Actualizar todas las reservas que no tienen el campo estado
    const result = await ReservaRecurso.updateMany(
      { estado: { $exists: false } },
      { $set: { estado: 'confirmada' } }
    );

    console.log(`✓ Actualizadas ${result.modifiedCount} reservas con estado='confirmada'`);

    // Verificar
    const total = await ReservaRecurso.countDocuments();
    const conEstado = await ReservaRecurso.countDocuments({ estado: { $exists: true } });
    console.log(`\nTotal reservas: ${total}`);
    console.log(`Reservas con estado: ${conEstado}`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
