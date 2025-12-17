import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import horarioTutoriaRouter from '../../src/routes/horariotutoria.js';
import HorarioTutoria from '../../src/models/HorariosTutoria.js';
import Tutoria from '../../src/models/Tutoria.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/horariotutoria', horarioTutoriaRouter);

let profesor, estudiante, profesorToken, estudianteToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Crear profesor
  profesor = await User.create({
    name: 'Profesor Test',
    email: 'profesor@ull.edu.es',
    password: 'password123',
    rol: 'profesor'
  });

  // Crear estudiante
  estudiante = await User.create({
    name: 'Estudiante Test',
    email: 'alu0123456789@ull.edu.es',
    password: 'password123',
    rol: 'alumno'
  });

  profesorToken = jwt.sign(
    { id: profesor._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );

  estudianteToken = jwt.sign(
    { id: estudiante._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );
});

describe('HorarioTutoria Routes', () => {
  describe('POST /api/horariotutoria', () => {
    it('debería crear un horario de tutoría exitosamente', async () => {
      const response = await request(app)
        .post('/api/horariotutoria')
        .send({
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: 'Aula 201',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        })
        .expect(201);

      expect(response.body.profesor.toString()).toBe(profesor._id.toString());
      expect(response.body.asignatura).toBe('Matemáticas');
      expect(response.body.modalidad).toBe('presencial');
      expect(response.body.diaSemana).toBe('lunes');
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      await request(app)
        .post('/api/horariotutoria')
        .send({
          profesor: profesor._id,
          asignatura: 'Matemáticas'
          // Faltan campos
        })
        .expect(400);
    });

    it('debería retornar 400 si el usuario no es profesor', async () => {
      await request(app)
        .post('/api/horariotutoria')
        .send({
          profesor: estudiante._id, // No es profesor
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: 'Aula 201',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        })
        .expect(400);
    });

    it('debería validar que modalidad presencial requiere lugar', async () => {
      const response = await request(app)
        .post('/api/horariotutoria')
        .send({
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: '', // Vacío
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        });

      expect(response.status).toBe(500);
    });

    it('debería permitir crear horario online sin lugar', async () => {
      const response = await request(app)
        .post('/api/horariotutoria')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'online',
          diaSemana: 'martes',
          horaInicio: '14:00',
          horaFin: '16:00'
        })
        .expect(201);

      expect(response.body.modalidad).toBe('online');
    });
  });

  describe('GET /api/horariotutoria', () => {
    beforeEach(async () => {
      await HorarioTutoria.create([
        {
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: 'Aula 201',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00',
          activo: true
        },
        {
          profesor: profesor._id,
          asignatura: 'Física',
          modalidad: 'online',
          diaSemana: 'martes',
          horaInicio: '14:00',
          horaFin: '16:00',
          activo: false // Inactivo
        }
      ]);
    });

    it('debería listar todos los horarios activos', async () => {
      const response = await request(app)
        .get('/api/horariotutoria')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Solo el activo
      expect(response.body[0].asignatura).toBe('Matemáticas');
    });
  });

  describe('GET /api/horariotutoria/:profesorId', () => {
    beforeEach(async () => {
      await HorarioTutoria.create([
        {
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: 'Aula 201',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00',
          activo: true
        },
        {
          profesor: profesor._id,
          asignatura: 'Física',
          modalidad: 'online',
          diaSemana: 'martes',
          horaInicio: '14:00',
          horaFin: '16:00',
          activo: false
        }
      ]);
    });

    it('debería listar todos los horarios de un profesor (activos e inactivos)', async () => {
      const response = await request(app)
        .get(`/api/horariotutoria/${profesor._id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/horariotutoria/disponibilidad', () => {
    beforeEach(async () => {
      await HorarioTutoria.create({
        profesor: profesor._id,
        asignatura: 'Matemáticas',
        modalidad: 'presencial',
        lugar: 'Aula 201',
        diaSemana: 'lunes',
        horaInicio: '10:00',
        horaFin: '12:00',
        activo: true
      });
    });

    it('debería retornar 400 si faltan parámetros', async () => {
      await request(app)
        .get('/api/horariotutoria/disponibilidad')
        .expect(400);
    });

    it('debería obtener disponibilidad para una fecha', async () => {
      // Un lunes cualquiera
      const fecha = '2025-12-22'; // Es lunes

      const response = await request(app)
        .get('/api/horariotutoria/disponibilidad')
        .query({ profesor: profesor._id.toString(), fecha })
        .expect(200);

      expect(response.body).toHaveProperty('horarios');
      expect(response.body).toHaveProperty('reservas');
      expect(Array.isArray(response.body.horarios)).toBe(true);
      expect(Array.isArray(response.body.reservas)).toBe(true);
    });
  });

  describe('POST /api/horariotutoria/reservas', () => {
    it('debería crear una reserva de tutoría', async () => {
      const fechaInicio = new Date('2025-12-22T10:00:00');
      const fechaFin = new Date('2025-12-22T11:00:00');

      const response = await request(app)
        .post('/api/horariotutoria/reservas')
        .send({
          profesor: profesor._id,
          estudiante: estudiante._id,
          fechaInicio,
          fechaFin,
          modalidad: 'presencial',
          lugar: 'Aula 201',
          tema: 'Consulta sobre examen',
          descripcion: 'Dudas sobre el último tema'
        })
        .expect(201);

      expect(response.body.tema).toBe('Consulta sobre examen');
      expect(response.body.profesor.toString()).toBe(profesor._id.toString());
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      await request(app)
        .post('/api/horariotutoria/reservas')
        .send({
          profesor: profesor._id,
          estudiante: estudiante._id
          // Faltan campos
        })
        .expect(400);
    });

    it('debería retornar 400 si hay solapamiento de horarios', async () => {
      const fechaInicio = new Date('2025-12-22T10:00:00');
      const fechaFin = new Date('2025-12-22T11:00:00');

      // Crear primera reserva
      await Tutoria.create({
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio,
        fechaFin,
        modalidad: 'presencial',
        lugar: 'Aula 201',
        tema: 'Primera consulta'
      });

      // Intentar crear segunda reserva solapada
      await request(app)
        .post('/api/horariotutoria/reservas')
        .send({
          profesor: profesor._id,
          estudiante: estudiante._id,
          fechaInicio: new Date('2025-12-22T10:30:00'),
          fechaFin: new Date('2025-12-22T11:30:00'),
          modalidad: 'presencial',
          lugar: 'Aula 201',
          tema: 'Segunda consulta'
        })
        .expect(400);
    });
  });

  describe('GET /api/horariotutoria/reservas/alumno/:id', () => {
    beforeEach(async () => {
      await Tutoria.create({
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-22T10:00:00'),
        fechaFin: new Date('2025-12-22T11:00:00'),
        modalidad: 'presencial',
        lugar: 'Aula 201',
        tema: 'Consulta'
      });
    });

    it('debería listar reservas de un estudiante', async () => {
      const response = await request(app)
        .get(`/api/horariotutoria/reservas/alumno/${estudiante._id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tema).toBe('Consulta');
    });
  });

  describe('GET /api/horariotutoria/reservas/profesor/:id', () => {
    beforeEach(async () => {
      await Tutoria.create({
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-22T10:00:00'),
        fechaFin: new Date('2025-12-22T11:00:00'),
        modalidad: 'presencial',
        lugar: 'Aula 201',
        tema: 'Consulta'
      });
    });

    it('debería listar reservas de un profesor', async () => {
      const response = await request(app)
        .get(`/api/horariotutoria/reservas/profesor/${profesor._id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tema).toBe('Consulta');
    });
  });

  describe('PUT /api/horariotutoria/:id', () => {
    let horarioId;

    beforeEach(async () => {
      const horario = await HorarioTutoria.create({
        profesor: profesor._id,
        asignatura: 'Matemáticas',
        modalidad: 'presencial',
        lugar: 'Aula 201',
        diaSemana: 'lunes',
        horaInicio: '10:00',
        horaFin: '12:00',
        activo: true
      });
      horarioId = horario._id;
    });

    it('debería actualizar un horario', async () => {
      const response = await request(app)
        .put(`/api/horariotutoria/${horarioId}`)
        .send({
          asignatura: 'Física Cuántica',
          horaInicio: '14:00',
          horaFin: '16:00'
        })
        .expect(200);

      expect(response.body.asignatura).toBe('Física Cuántica');
      expect(response.body.horaInicio).toBe('14:00');
    });

    it('debería retornar 400 si no hay campos para actualizar', async () => {
      await request(app)
        .put(`/api/horariotutoria/${horarioId}`)
        .send({})
        .expect(400);
    });

    it('debería retornar 404 para horario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .put(`/api/horariotutoria/${fakeId}`)
        .send({ asignatura: 'Nueva' })
        .expect(404);
    });
  });

  describe('PATCH /api/horariotutoria/:id', () => {
    let horarioId;

    beforeEach(async () => {
      const horario = await HorarioTutoria.create({
        profesor: profesor._id,
        asignatura: 'Matemáticas',
        modalidad: 'presencial',
        lugar: 'Aula 201',
        diaSemana: 'lunes',
        horaInicio: '10:00',
        horaFin: '12:00',
        activo: true
      });
      horarioId = horario._id;
    });

    it('debería actualizar parcialmente un horario', async () => {
      const response = await request(app)
        .patch(`/api/horariotutoria/${horarioId}`)
        .send({ activo: false })
        .expect(200);

      expect(response.body.activo).toBe(false);
      expect(response.body.asignatura).toBe('Matemáticas'); // No cambió
    });

    it('debería retornar 400 si no hay campos', async () => {
      await request(app)
        .patch(`/api/horariotutoria/${horarioId}`)
        .send({})
        .expect(400);
    });

    it('debería retornar 404 para horario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .patch(`/api/horariotutoria/${fakeId}`)
        .send({ activo: false })
        .expect(404);
    });
  });

  describe('DELETE /api/horariotutoria/:id', () => {
    let horarioId;

    beforeEach(async () => {
      const horario = await HorarioTutoria.create({
        profesor: profesor._id,
        asignatura: 'Matemáticas',
        modalidad: 'presencial',
        lugar: 'Aula 201',
        diaSemana: 'lunes',
        horaInicio: '10:00',
        horaFin: '12:00',
        activo: true
      });
      horarioId = horario._id;
    });

    it('debería eliminar un horario', async () => {
      const response = await request(app)
        .delete(`/api/horariotutoria/${horarioId}`)
        .expect(200);

      expect(response.body.message).toBe('Horario eliminado correctamente.');

      const horario = await HorarioTutoria.findById(horarioId);
      expect(horario).toBeNull();
    });

    it('debería retornar 404 para horario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .delete(`/api/horariotutoria/${fakeId}`)
        .expect(404);
    });
  });
});
