import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import eventosRouter from '../../src/routes/eventos.js';
import authRouter from '../../src/routes/auth.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/eventos', eventosRouter);

let owner, participant, ownerToken, participantToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  owner = await User.create({
    name: 'Propietario',
    email: 'owner@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  participant = await User.create({
    name: 'Participante',
    email: 'participant@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  // Generar tokens
  ownerToken = jwt.sign(
    { id: owner._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );

  participantToken = jwt.sign(
    { id: participant._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );
});

describe('Eventos Routes', () => {
  describe('POST /api/eventos', () => {
    it('debería crear un nuevo evento exitosamente', async () => {
      const eventoData = {
        title: 'Reunión de equipo',
        description: 'Discutir el proyecto final',
        owner: owner._id,
        participants: [participant._id],
        start: new Date('2025-12-01T10:00:00'),
        end: new Date('2025-12-01T11:00:00'),
        location: 'Sala 2.5',
        visibility: 'shared',
        status: 'confirmed'
      };

      const response = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send(eventoData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Reunión de equipo');
      expect(response.body.status).toBe('confirmed');
      expect(response.body.visibility).toBe('shared');
    });

    it('debería retornar 400 si start >= end', async () => {
      const eventoData = {
        title: 'Evento inválido',
        owner: owner._id,
        start: new Date('2025-12-01T11:00:00'),
        end: new Date('2025-12-01T10:00:00')
      };

      const response = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send(eventoData)
        .expect(400);

      expect(response.body.error).toBe('start must be before end');
    });

    it('debería retornar 500 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send({ title: 'Sin owner' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/eventos/:id', () => {
    it('debería obtener un evento por id con campos poblados', async () => {
      const evento = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          title: 'Test Evento',
          owner: owner._id,
          participants: [participant._id],
          start: new Date('2025-12-01T10:00:00'),
          end: new Date('2025-12-01T11:00:00')
        });

      const response = await request(app)
        .get(`/api/eventos/${evento.body._id}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(200);

      expect(response.body.owner).toHaveProperty('name');
      expect(response.body.owner).toHaveProperty('email');
      expect(Array.isArray(response.body.participants)).toBe(true);
      expect(response.body.participants[0]).toHaveProperty('name');
    });

    it('debería retornar 404 para evento inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/eventos/${fakeId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/eventos', () => {
    beforeEach(async () => {
      await request(app).post('/api/eventos').set('Cookie', [`token=${ownerToken}`]).send({
        title: 'Evento 1',
        owner: owner._id,
        start: new Date('2025-12-01T10:00:00'),
        end: new Date('2025-12-01T11:00:00')
      });

      await request(app).post('/api/eventos').set('Cookie', [`token=${ownerToken}`]).send({
        title: 'Evento 2',
        owner: owner._id,
        start: new Date('2025-12-02T10:00:00'),
        end: new Date('2025-12-02T11:00:00')
      });

      await request(app).post('/api/eventos').set('Cookie', [`token=${participantToken}`]).send({
        title: 'Evento 3',
        owner: participant._id,
        start: new Date('2025-12-03T10:00:00'),
        end: new Date('2025-12-03T11:00:00')
      });
    });

    it('debería listar todos los eventos', async () => {
      const response = await request(app)
        .get('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('debería filtrar por owner', async () => {
      const response = await request(app)
        .get(`/api/eventos?owner=${owner._id}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      response.body.forEach(e => {
        expect(e.owner._id.toString()).toBe(owner._id.toString());
      });
    });

    it('debería filtrar por rango de fechas', async () => {
      const response = await request(app)
        .get('/api/eventos?start=2025-12-01T00:00:00&end=2025-12-01T23:59:59')
        .set('Cookie', [`token=${ownerToken}`])
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Evento 1');
    });
  });

  describe('PUT /api/eventos/:id', () => {
    it('debería actualizar un evento', async () => {
      const evento = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          title: 'Evento Original',
          owner: owner._id,
          start: new Date('2025-12-01T10:00:00'),
          end: new Date('2025-12-01T11:00:00'),
          status: 'tentative'
        });

      const response = await request(app)
        .put(`/api/eventos/${evento.body._id}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ status: 'confirmed', title: 'Evento Actualizado' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(response.body.title).toBe('Evento Actualizado');
    });

    it('debería retornar 404 para evento inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/eventos/${fakeId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('DELETE /api/eventos/:id', () => {
    it('debería eliminar un evento', async () => {
      const evento = await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          title: 'Evento a Eliminar',
          owner: owner._id,
          start: new Date('2025-12-01T10:00:00'),
          end: new Date('2025-12-01T11:00:00')
        });

      await request(app)
        .delete(`/api/eventos/${evento.body._id}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(200);

      await request(app)
        .get(`/api/eventos/${evento.body._id}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(404);
    });

    it('debería retornar 404 para evento inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/eventos/${fakeId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  // Test comentado: la ruta GET /api/eventos/usuario/:userId no existe en el router
  // describe('GET /api/eventos/usuario/:userId', () => {
  //   beforeEach(async () => {
  //     await request(app).post('/api/eventos').set('Cookie', [`token=${ownerToken}`]).send({
  //       title: 'Evento del usuario',
  //       owner: owner._id,
  //       start: new Date('2025-12-10T10:00:00'),
  //       end: new Date('2025-12-10T11:00:00')
  //     });
  //   });

  //   it('debería listar eventos de un usuario específico', async () => {
  //     const response = await request(app)
  //       .get(`/api/eventos/usuario/${owner._id}`)
  //       .set('Cookie', [`token=${ownerToken}`])
  //       .expect(200);

  //     expect(Array.isArray(response.body)).toBe(true);
  //     expect(response.body.length).toBeGreaterThan(0);
  //   });
  // });

  describe('Validaciones adicionales', () => {
    it('debería rechazar evento sin title', async () => {
      await request(app)
        .post('/api/eventos')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          owner: owner._id,
          start: new Date('2025-12-01T10:00:00'),
          end: new Date('2025-12-01T11:00:00')
        })
        .expect(500);
    });
  });
});
