import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recurso, { ReservaRecurso } from '../src/models/Recurso.js';

dotenv.config();

async function createIndexes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Conectado a MongoDB');

    console.log('\n📊 Creando índices para Recurso...');
    await Recurso.createIndexes();
    const recursoIndexes = await Recurso.collection.getIndexes();
    console.log('✅ Índices de Recurso:', Object.keys(recursoIndexes).join(', '));

    console.log('\n📊 Creando índices para ReservaRecurso...');
    await ReservaRecurso.createIndexes();
    const reservaIndexes = await ReservaRecurso.collection.getIndexes();
    console.log('✅ Índices de ReservaRecurso:', Object.keys(reservaIndexes).join(', '));

    console.log('\n✨ Índices creados exitosamente');

    // Estadísticas
    const recursosCount = await Recurso.countDocuments();
    const reservasCount = await ReservaRecurso.countDocuments();
    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Recursos: ${recursosCount}`);
    console.log(`   - Reservas: ${reservasCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
    process.exit(0);
  }
}

createIndexes();
