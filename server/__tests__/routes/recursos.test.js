import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import recursosRouter from '../../src/routes/recursos.js';
import authRouter from '../../src/routes/auth.js';
import User from '../../src/models/User.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/recursos', recursosRouter);

let usuario;
let authToken;
let desarrollador;
let devToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  // Crear usuario normal
  usuario = await User.create({
    name: 'Test User',
    email: 'test@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  // Crear usuario desarrollador
  desarrollador = await User.create({
    name: 'Developer',
    email: 'dev@ull.edu.es',
    password: 'hashedpassword',
    rol: 'desarrollador'
  });

  // Generar tokens
  authToken = jwt.sign(
    { id: usuario._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );

  devToken = jwt.sign(
    { id: desarrollador._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );
});

describe('Recursos Routes', () => {
  describe('POST /api/recursos', () => {
    it('debería crear un nuevo recurso', async () => {
      const recursoData = {
        nombre: 'Sala de Cálculo 1',
        tipo: 'sala_calculo',
        capacidad: 30,
        ubicacion: 'ESIT, Planta 2',
        estaActivo: true
      };

      const response = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send(recursoData)
        .expect(201);

      expect(response.body.nombre).toBe('Sala de Cálculo 1');
      expect(response.body.tipo).toBe('sala_calculo');
      expect(response.body.estaActivo).toBe(true);
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({ nombre: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/recursos', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala 1',
          tipo: 'sala_calculo',
          capacidad: 20,
          ubicacion: 'Planta 1',
          estaActivo: true
        });

      await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Carrel 1',
          tipo: 'carrel',
          capacidad: 1,
          ubicacion: 'Biblioteca',
          estaActivo: false
        });
    });

    it('debería listar todos los recursos', async () => {
      const response = await request(app)
        .get('/api/recursos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar por tipo', async () => {
      const response = await request(app)
        .get('/api/recursos?tipo=sala_calculo')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].tipo).toBe('sala_calculo');
    });

    it('debería filtrar por estaActivo', async () => {
      const response = await request(app)
        .get('/api/recursos?estaActivo=true')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].estaActivo).toBe(true);
    });
  });

  describe('POST /api/recursos/:id/reservas', () => {
    let recurso;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Test',
          tipo: 'sala_reunion',
          capacidad: 10,
          ubicacion: 'Planta 3',
          estaActivo: true
        });
      recurso = response.body;
    });

    it('debería crear una reserva para un recurso activo', async () => {
      const reservaData = {
        fechaReserva: new Date('2025-12-01T10:00:00'),
        duracionHoras: 1
      };

      const response = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send(reservaData)
        .expect(201);

      expect(response.body.recurso._id.toString()).toBe(recurso._id.toString());
      expect(response.body.usuario._id.toString()).toBe(usuario._id.toString());
    });

    it('debería retornar 400 si el recurso no está activo', async () => {
      const inactiveRecurso = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Inactiva',
          tipo: 'sala_reunion',
          capacidad: 10,
          ubicacion: 'Planta 3',
          estaActivo: false
        });

      const reservaData = {
        fechaReserva: new Date('2025-12-01T10:00:00'),
        duracionHoras: 1
      };

      const response = await request(app)
        .post(`/api/recursos/${inactiveRecurso.body._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send(reservaData)
        .expect(400);

      expect(response.body.error).toBe('recurso_inactive');
    });

    it('debería retornar 409 si la fecha ya está reservada', async () => {
      const reservaData = {
        fechaReserva: new Date('2025-12-01T10:00:00'),
        duracionHoras: 1
      };

      await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send(reservaData);

      const response = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send(reservaData)
        .expect(409);

      expect(response.body.error).toBe('already_reserved');
    });
  });

  describe('GET /api/recursos/:id/reservas', () => {
    let recurso;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Test',
          tipo: 'sala_reunion',
          capacidad: 10,
          ubicacion: 'Planta 3',
          estaActivo: true
        });
      recurso = response.body;

      await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send({
          fechaReserva: new Date('2025-12-01T10:00:00'),
          duracionHoras: 1
        });

      await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send({
          fechaReserva: new Date('2025-12-02T10:00:00'),
          duracionHoras: 1
        });
    });

    it('debería listar todas las reservas de un recurso', async () => {
      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar por rango de fechas', async () => {
      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas?desde=2025-12-01T00:00:00&hasta=2025-12-01T23:59:59`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.length).toBe(1);
    });
  });

  describe('DELETE /api/recursos/:recursoId/reservas/:reservaId', () => {
    let recurso, reserva;

    beforeEach(async () => {
      const recursoResponse = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Test',
          tipo: 'sala_reunion',
          capacidad: 10,
          ubicacion: 'Planta 3',
          estaActivo: true
        });
      recurso = recursoResponse.body;

      const reservaResponse = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send({
          fechaReserva: new Date('2025-12-01T10:00:00'),
          duracionHoras: 1
        });
      reserva = reservaResponse.body;
    });

    it('debería eliminar una reserva', async () => {
      await request(app)
        .delete(`/api/recursos/${recurso._id}/reservas/${reserva._id}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      // La reserva se marca como cancelada, sigue apareciendo en la lista
      expect(response.body.length).toBe(1);
      expect(response.body[0].estado).toBe('cancelada');
    });

    it('debería retornar 400 si la reserva no pertenece al recurso', async () => {
      const otherRecurso = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Otra Sala',
          tipo: 'sala_reunion',
          capacidad: 10,
          ubicacion: 'Planta 4',
          estaActivo: true
        });

      const response = await request(app)
        .delete(`/api/recursos/${otherRecurso.body._id}/reservas/${reserva._id}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(400); // La reserva no pertenece a ese recurso

      expect(response.body.error).toBe('reservation_id_incorrect');
    });

    it('debería retornar 404 si la reserva no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .delete(`/api/recursos/${recurso._id}/reservas/${fakeId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });

  describe('GET /api/recursos/:id', () => {
    it('debería obtener un recurso por ID', async () => {
      const recursoResponse = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Test',
          tipo: 'sala_calculo',
          capacidad: 30,
          ubicacion: 'Edificio A',
          estaActivo: true
        });

      const response = await request(app)
        .get(`/api/recursos/${recursoResponse.body._id}`)
        .expect(200);

      expect(response.body.nombre).toBe('Sala Test');
      expect(response.body.tipo).toBe('sala_calculo');
    });

    it('debería retornar 404 para un recurso inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/recursos/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/recursos/:id', () => {
    it('debería actualizar un recurso', async () => {
      const recursoResponse = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Original',
          tipo: 'sala_reunion',
          capacidad: 20,
          ubicacion: 'Planta 1',
          estaActivo: true
        });

      const response = await request(app)
        .put(`/api/recursos/${recursoResponse.body._id}`)
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Actualizada',
          capacidad: 25
        })
        .expect(200);

      expect(response.body.nombre).toBe('Sala Actualizada');
      expect(response.body.capacidad).toBe(25);
    });

    it('debería retornar 404 para un recurso inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .put(`/api/recursos/${fakeId}`)
        .set('Cookie', [`token=${devToken}`])
        .send({ nombre: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/recursos/:id', () => {
    it('debería eliminar un recurso', async () => {
      const recursoResponse = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala a Eliminar',
          tipo: 'carrel',
          capacidad: 20,
          ubicacion: 'Planta 1',
          estaActivo: true
        });

      await request(app)
        .delete(`/api/recursos/${recursoResponse.body._id}`)
        .set('Cookie', [`token=${devToken}`])
        .expect(200);

      await request(app)
        .get(`/api/recursos/${recursoResponse.body._id}`)
        .expect(404);
    });

    it('debería retornar 404 para un recurso inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .delete(`/api/recursos/${fakeId}`)
        .set('Cookie', [`token=${devToken}`])
        .expect(404);
    });
  });

  describe('GET /api/recursos/mis-reservas', () => {
    it('debería listar las reservas del usuario autenticado', async () => {
      const recursoResponse = await request(app)
        .post('/api/recursos')
        .set('Cookie', [`token=${devToken}`])
        .send({
          nombre: 'Sala Test',
          tipo: 'carrel',
          capacidad: 1,
          ubicacion: 'Biblioteca',
          estaActivo: true
        });

      await request(app)
        .post(`/api/recursos/${recursoResponse.body._id}/reservas`)
        .set('Cookie', [`token=${authToken}`])
        .send({
          fechaReserva: new Date('2025-12-10T10:00:00'),
          duracionHoras: 2
        });

      const response = await request(app)
        .get('/api/recursos/mis-reservas')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});