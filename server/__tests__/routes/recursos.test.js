import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import recursosRouter from '../../src/routes/recursos.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/recursos', recursosRouter);

let usuario;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  usuario = await User.create({
    name: 'Test User',
    email: 'test@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });
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
        .send(recursoData)
        .expect(201);

      expect(response.body.nombre).toBe('Sala de Cálculo 1');
      expect(response.body.tipo).toBe('sala_calculo');
      expect(response.body.estaActivo).toBe(true);
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/recursos')
        .send({ nombre: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/recursos', () => {
    beforeEach(async () => {
      await request(app).post('/api/recursos').send({
        nombre: 'Sala 1',
        tipo: 'sala_calculo',
        capacidad: 20,
        ubicacion: 'Planta 1',
        estaActivo: true
      });

      await request(app).post('/api/recursos').send({
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
      const response = await request(app).post('/api/recursos').send({
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
        usuario: usuario._id,
        fechaReserva: new Date('2025-12-01T10:00:00')
      };

      const response = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .send(reservaData)
        .expect(201);

      expect(response.body.recurso._id).toBe(recurso._id);
      expect(response.body.usuario._id).toBe(usuario._id.toString());
    });

    it('debería retornar 400 si el recurso no está activo', async () => {
      const inactiveRecurso = await request(app).post('/api/recursos').send({
        nombre: 'Sala Inactiva',
        tipo: 'sala_reunion',
        capacidad: 10,
        ubicacion: 'Planta 3',
        estaActivo: false
      });

      const reservaData = {
        usuario: usuario._id,
        fechaReserva: new Date('2025-12-01T10:00:00')
      };

      const response = await request(app)
        .post(`/api/recursos/${inactiveRecurso.body._id}/reservas`)
        .send(reservaData)
        .expect(400);

      expect(response.body.error).toContain('recurso_inactive');
    });

    it('debería retornar 409 si la fecha ya está reservada', async () => {
      const reservaData = {
        usuario: usuario._id,
        fechaReserva: new Date('2025-12-01T10:00:00')
      };

      await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .send(reservaData);

      const response = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .send(reservaData)
        .expect(409);

      expect(response.body.error).toContain('already_reserved');
    });
  });

  describe('GET /api/recursos/:id/reservas', () => {
    let recurso;

    beforeEach(async () => {
      const response = await request(app).post('/api/recursos').send({
        nombre: 'Sala Test',
        tipo: 'sala_reunion',
        capacidad: 10,
        ubicacion: 'Planta 3',
        estaActivo: true
      });
      recurso = response.body;

      await request(app).post(`/api/recursos/${recurso._id}/reservas`).send({
        usuario: usuario._id,
        fechaReserva: new Date('2025-12-01T10:00:00')
      });

      await request(app).post(`/api/recursos/${recurso._id}/reservas`).send({
        usuario: usuario._id,
        fechaReserva: new Date('2025-12-02T10:00:00')
      });
    });

    it('debería listar todas las reservas de un recurso', async () => {
      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar por rango de fechas', async () => {
      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas?desde=2025-12-01T00:00:00&hasta=2025-12-01T23:59:59`)
        .expect(200);

      expect(response.body.length).toBe(1);
    });
  });

  describe('DELETE /api/recursos/:recursoId/reservas/:reservaId', () => {
    let recurso, reserva;

    beforeEach(async () => {
      const recursoResponse = await request(app).post('/api/recursos').send({
        nombre: 'Sala Test',
        tipo: 'sala_reunion',
        capacidad: 10,
        ubicacion: 'Planta 3',
        estaActivo: true
      });
      recurso = recursoResponse.body;

      const reservaResponse = await request(app)
        .post(`/api/recursos/${recurso._id}/reservas`)
        .send({
          usuario: usuario._id,
          fechaReserva: new Date('2025-12-01T10:00:00')
        });
      reserva = reservaResponse.body;
    });

    it('debería eliminar una reserva', async () => {
      await request(app)
        .delete(`/api/recursos/${recurso._id}/reservas/${reserva._id}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/recursos/${recurso._id}/reservas`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('debería retornar 400 si la reserva no pertenece al recurso', async () => {
      const otherRecurso = await request(app).post('/api/recursos').send({
        nombre: 'Otra Sala',
        tipo: 'sala_reunion',
        capacidad: 10,
        ubicacion: 'Planta 4',
        estaActivo: true
      });

      const response = await request(app)
        .delete(`/api/recursos/${otherRecurso.body._id}/reservas/${reserva._id}`)
        .expect(400);

      expect(response.body.error).toContain('reservation_id_incorrect');
    });
  });
});
