import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import tutoriasRoutesRouter from '../../src/routes/tutorias.routes.js';
import HorarioTutoria from '../../src/models/HorariosTutoria.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/horarios', tutoriasRoutesRouter);

let profesor, adminToken;

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

  // Crear admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@ull.edu.es',
    password: 'password123',
    rol: 'desarrollador'
  });

  adminToken = jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );
});

describe('Tutorias Routes (tutorias.routes.js)', () => {
  describe('GET /api/horarios', () => {
    beforeEach(async () => {
      await HorarioTutoria.create([
        {
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'presencial',
          lugar: 'Aula 201',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        },
        {
          profesor: profesor._id,
          asignatura: 'Física',
          modalidad: 'online',
          diaSemana: 'martes',
          horaInicio: '14:00',
          horaFin: '16:00'
        }
      ]);
    });

    it('debería listar todos los horarios', async () => {
      const response = await request(app)
        .get('/api/horarios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar horarios por profesorId', async () => {
      const response = await request(app)
        .get('/api/horarios')
        .query({ profesorId: profesor._id.toString() })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].profesor.toString()).toBe(profesor._id.toString());
    });

    it('debería retornar array vacío si no hay horarios del profesor', async () => {
      const otroProfesor = await User.create({
        name: 'Otro Profesor',
        email: 'otro@ull.edu.es',
        password: 'password123',
        rol: 'profesor'
      });

      const response = await request(app)
        .get('/api/horarios')
        .query({ profesorId: otroProfesor._id.toString() })
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/horarios', () => {
    it('debería crear un horario exitosamente', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'online',
          diaSemana: 'miercoles',
          horaInicio: '09:00',
          horaFin: '11:00'
        })
        .expect(201);

      expect(response.body.profesor.toString()).toBe(profesor._id.toString());
      expect(response.body.asignatura).toBe('Programación');
      expect(response.body.modalidad).toBe('online');
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación'
          // Faltan modalidad, diaSemana, horaInicio, horaFin
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería validar formato de horas', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'online',
          diaSemana: 'miercoles',
          horaInicio: 'invalid',
          horaFin: '11:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería validar que horaInicio < horaFin', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'online',
          diaSemana: 'miercoles',
          horaInicio: '14:00',
          horaFin: '10:00' // Fin antes del inicio
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería validar enum de modalidad', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'hibrido', // No válido
          diaSemana: 'miercoles',
          horaInicio: '09:00',
          horaFin: '11:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería validar enum de diaSemana', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'online',
          diaSemana: 'feriado', // No válido
          horaInicio: '09:00',
          horaFin: '11:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería validar que modalidad presencial requiere lugar', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'presencial',
          lugar: '', // Vacío
          diaSemana: 'miercoles',
          horaInicio: '09:00',
          horaFin: '11:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería permitir crear horario presencial con lugar', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Programación',
          modalidad: 'presencial',
          lugar: 'Aula 303',
          diaSemana: 'miercoles',
          horaInicio: '09:00',
          horaFin: '11:00'
        })
        .expect(201);

      expect(response.body.lugar).toBe('Aula 303');
    });
  });

  describe('DELETE /api/horarios/:id', () => {
    let horarioId;

    beforeEach(async () => {
      const horario = await HorarioTutoria.create({
        profesor: profesor._id,
        asignatura: 'Matemáticas',
        modalidad: 'presencial',
        lugar: 'Aula 201',
        diaSemana: 'lunes',
        horaInicio: '10:00',
        horaFin: '12:00'
      });
      horarioId = horario._id;
    });

    it('debería eliminar un horario exitosamente', async () => {
      const response = await request(app)
        .delete(`/api/horarios/${horarioId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('deleted');

      // Verificar que se eliminó
      const horario = await HorarioTutoria.findById(horarioId);
      expect(horario).toBeNull();
    });

    it('debería retornar 404 para horario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/horarios/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('No encontrado');
    });

    it('debería retornar 400 para ID inválido', async () => {
      const response = await request(app)
        .delete('/api/horarios/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('ID inválido');
    });
  });

  describe('Validaciones del modelo HorarioTutoria', () => {
    it('debería crear horario con activo=true por defecto', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'online',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        })
        .expect(201);

      expect(response.body.activo).toBe(true);
    });

    it('debería permitir crear horarios en todos los días de la semana', async () => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      
      for (const dia of dias) {
        const response = await request(app)
          .post('/api/horarios')
          .send({
            profesor: profesor._id,
            asignatura: 'Matemáticas',
            modalidad: 'online',
            diaSemana: dia,
            horaInicio: '10:00',
            horaFin: '12:00'
          })
          .expect(201);

        expect(response.body.diaSemana).toBe(dia);
      }
    });

    it('debería permitir timestamps', async () => {
      const response = await request(app)
        .post('/api/horarios')
        .send({
          profesor: profesor._id,
          asignatura: 'Matemáticas',
          modalidad: 'online',
          diaSemana: 'lunes',
          horaInicio: '10:00',
          horaFin: '12:00'
        })
        .expect(201);

      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});
