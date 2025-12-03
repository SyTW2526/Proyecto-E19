// Script para verificar reservas en la base de datos
// Ejecutar: node scripts/checkReservas.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ReservaRecurso } from '../src/models/Recurso.js';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyecto-e19';

async function main() {
  try {
    console.log('Conectando a MongoDB...', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado a MongoDB\n');

    // 1. Listar todos los usuarios
    console.log('=== USUARIOS EN LA BD ===');
    const users = await User.find().select('_id name email').lean();
    console.log(`Total usuarios: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email}) - ID: ${u._id}`);
    });

    // 2. Listar todas las reservas
    console.log('\n=== TODAS LAS RESERVAS EN LA BD ===');
    const allReservas = await ReservaRecurso.find()
      .populate('usuario', 'name email')
      .populate('recurso', 'nombre tipo ubicacion')
      .lean();
    
    console.log(`Total reservas: ${allReservas.length}\n`);
    
    if (allReservas.length === 0) {
      console.log('⚠️  No hay reservas en la base de datos');
    } else {
      allReservas.forEach((r, i) => {
        console.log(`${i + 1}. Reserva ID: ${r._id}`);
        console.log(`   Usuario: ${r.usuario?.name || 'N/A'} (${r.usuario?._id || 'N/A'})`);
        console.log(`   Recurso: ${r.recurso?.nombre || 'N/A'} (${r.recurso?._id || 'N/A'})`);
        console.log(`   Fecha: ${new Date(r.fechaReserva).toLocaleString('es-ES')}`);
        console.log(`   Estado: ${r.estado || 'N/A'}`);
        console.log(`   Creada: ${new Date(r.createdAt).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    // 3. Verificar reservas por usuario
    console.log('=== RESERVAS POR USUARIO ===');
    for (const user of users) {
      const userReservas = await ReservaRecurso.find({ usuario: user._id })
        .populate('recurso', 'nombre')
        .lean();
      console.log(`${user.name}: ${userReservas.length} reserva(s)`);
      if (userReservas.length > 0) {
        userReservas.forEach(r => {
          console.log(`  - ${r.recurso?.nombre || 'N/A'} el ${new Date(r.fechaReserva).toLocaleDateString('es-ES')}`);
        });
      }
    }

    console.log('\n✓ Verificación completa');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
