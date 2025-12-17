import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import tutoriasRouter from '../../src/routes/tutorias.js';
import authRouter from '../../src/routes/auth.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/tutorias', tutoriasRouter);

let profesor, estudiante, profesorToken, estudianteToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  profesor = await User.create({
    name: 'Profesor Test',
    email: 'profesor@ull.edu.es',
    password: 'hashedpassword',
    rol: 'profesor'
  });

  estudiante = await User.create({
    name: 'Estudiante Test',
    email: 'alu0101234567@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  // Generar tokens
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

describe('Tutorias Routes', () => {
  describe('POST /api/tutorias', () => {
    it('debería crear una nueva tutoría exitosamente', async () => {
      const tutoriaData = {
        tema: 'Consulta sobre examen',
        descripcion: 'Dudas sobre el tema 3',
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-01T10:00:00'),
        fechaFin: new Date('2025-12-01T11:00:00'),
        modalidad: 'presencial',
        lugar: 'Despacho 2.5'
      };

      const response = await request(app)
        .post('/api/tutorias')
        .set('Cookie', [`token=${estudianteToken}`])
        .send(tutoriaData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.tema).toBe(tutoriaData.tema);
      expect(response.body.estado).toBe('pendiente');
    });

    it('debería retornar 400 si fechaInicio >= fechaFin', async () => {
      const tutoriaData = {
        tema: 'Test',
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-01T11:00:00'),
        fechaFin: new Date('2025-12-01T10:00:00')
      };

      const response = await request(app)
        .post('/api/tutorias')
        .set('Cookie', [`token=${estudianteToken}`])
        .send(tutoriaData)
        .expect(400);

      expect(response.body.error).toContain('fechaInicio debe ser anterior a fechaFin');
    });
  });

  describe('GET /api/tutorias/:id', () => {
    it('debería obtener una tutoría por id con campos poblados', async () => {
      const tutoria = await request(app)
        .post('/api/tutorias')
        .set('Cookie', [`token=${estudianteToken}`])
        .send({
          tema: 'Test',
          profesor: profesor._id,
          estudiante: estudiante._id,
          fechaInicio: new Date('2025-12-01T10:00:00'),
          fechaFin: new Date('2025-12-01T11:00:00')
        });

      const response = await request(app)
        .get(`/api/tutorias/${tutoria.body._id}`)
        .set('Cookie', [`token=${estudianteToken}`])
        .expect(200);

      expect(response.body.profesor).toHaveProperty('name');
      expect(response.body.profesor).toHaveProperty('email');
      expect(response.body.estudiante).toHaveProperty('name');
    });

    it('debería retornar 404 para tutoría inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/tutorias/${fakeId}`)
        .set('Cookie', [`token=${profesorToken}`])
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/tutorias', () => {
    beforeEach(async () => {
      await request(app).post('/api/tutorias').set('Cookie', [`token=${estudianteToken}`]).send({
        tema: 'Tutoria 1',
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-01T10:00:00'),
        fechaFin: new Date('2025-12-01T11:00:00')
      });

      await request(app).post('/api/tutorias').set('Cookie', [`token=${estudianteToken}`]).send({
        tema: 'Tutoria 2',
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-02T10:00:00'),
        fechaFin: new Date('2025-12-02T11:00:00')
      });
    });

    it('debería listar todas las tutorías', async () => {
      const response = await request(app)
        .get('/api/tutorias')
        .set('Cookie', [`token=${profesorToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar por profesor', async () => {
      const response = await request(app)
        .get(`/api/tutorias?profesor=${profesor._id}`)
        .set('Cookie', [`token=${profesorToken}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      response.body.forEach(t => {
        expect(t.profesor._id.toString()).toBe(profesor._id.toString());
      });
    });

    it('debería filtrar por rango de fechas', async () => {
      const response = await request(app)
        .get('/api/tutorias?inicio=2025-12-01T00:00:00&fin=2025-12-01T23:59:59')
        .set('Cookie', [`token=${profesorToken}`])
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].tema).toBe('Tutoria 1');
    });

    it('debería filtrar por estudiante', async () => {
      const response = await request(app)
        .get(`/api/tutorias?estudiante=${estudiante._id}`)
        .set('Cookie', [`token=${estudianteToken}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      response.body.forEach(t => {
        expect(t.estudiante._id.toString()).toBe(estudiante._id.toString());
      });
    });
  });

  describe('GET /api/tutorias/usuario/:userId', () => {
    beforeEach(async () => {
      await request(app).post('/api/tutorias').set('Cookie', [`token=${estudianteToken}`]).send({
        tema: 'Tutoria estudiante',
        profesor: profesor._id,
        estudiante: estudiante._id,
        fechaInicio: new Date('2025-12-05T10:00:00'),
        fechaFin: new Date('2025-12-05T11:00:00')
      });
    });

    it('debería listar tutorías de un estudiante específico', async () => {
      const response = await request(app)
        .get(`/api/tutorias/usuario/${estudiante._id}`)
        .set('Cookie', [`token=${estudianteToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/tutorias/:id', () => {
    it('debería actualizar una tutoría', async () => {
      const tutoria = await request(app)
        .post('/api/tutorias')
        .set('Cookie', [`token=${estudianteToken}`])
        .send({
          tema: 'Original',
          profesor: profesor._id,
          estudiante: estudiante._id,
          fechaInicio: new Date('2025-12-01T10:00:00'),
          fechaFin: new Date('2025-12-01T11:00:00'),
          estado: 'pendiente'
        });

      const response = await request(app)
        .put(`/api/tutorias/${tutoria.body._id}`)
        .set('Cookie', [`token=${profesorToken}`])
        .send({ estado: 'confirmada', tema: 'Updated' })
        .expect(200);

      expect(response.body.estado).toBe('confirmada');
      expect(response.body.tema).toBe('Updated');
    });
  });

  describe('DELETE /api/tutorias/:id', () => {
    it('debería eliminar una tutoría', async () => {
      const tutoria = await request(app)
        .post('/api/tutorias')
        .set('Cookie', [`token=${estudianteToken}`])
        .send({
          tema: 'To Delete',
          profesor: profesor._id,
          estudiante: estudiante._id,
          fechaInicio: new Date('2025-12-01T10:00:00'),
          fechaFin: new Date('2025-12-01T11:00:00')
        });

      await request(app)
        .delete(`/api/tutorias/${tutoria.body._id}`)
        .set('Cookie', [`token=${profesorToken}`])
        .expect(200);

      await request(app)
        .get(`/api/tutorias/${tutoria.body._id}`)
        .set('Cookie', [`token=${profesorToken}`])
        .expect(404);
    });
  });
});
