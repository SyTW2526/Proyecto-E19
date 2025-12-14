import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import forosRouter from '../../src/routes/foro.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/foros', forosRouter);

let owner;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  owner = await User.create({
    name: 'Forum Owner',
    email: 'owner@ull.edu.es',
    password: 'hashedpassword',
    rol: 'profesor'
  });
});

describe('Foros Routes', () => {
  describe('POST /api/foros', () => {
    it('debería crear un nuevo foro', async () => {
      const foroData = {
        key: 'MAT101',
        title: 'Matemáticas I',
        description: 'Foro de la asignatura',
        owner: owner._id,
        visibility: 'course'
      };

      const response = await request(app)
        .post('/api/foros')
        .send(foroData)
        .expect(201);

      expect(response.body.key).toBe('MAT101');
      expect(response.body.title).toBe('Matemáticas I');
    });

    it('debería retornar 400 si falta key o title', async () => {
      const response = await request(app)
        .post('/api/foros')
        .send({ description: 'Test' })
        .expect(400);

      expect(response.body.error).toBe('key_and_title_required');
    });

    it('debería retornar 409 si la key está duplicada', async () => {
      const foroData = {
        key: 'MAT101',
        title: 'Test',
        owner: owner._id
      };

      await request(app).post('/api/foros').send(foroData);
      
      const response = await request(app)
        .post('/api/foros')
        .send(foroData)
        .expect(409);

      expect(response.body.error).toBe('duplicate_key');
    });
  });

  describe('GET /api/foros/:id', () => {
    it('debería obtener foro por id con owner poblado', async () => {
      const foro = await request(app)
        .post('/api/foros')
        .send({
          key: 'TEST',
          title: 'Test Foro',
          owner: owner._id
        });

      const response = await request(app)
        .get(`/api/foros/${foro.body._id}`)
        .expect(200);

      expect(response.body.owner).toHaveProperty('name');
      expect(response.body.owner).toHaveProperty('email');
    });

    it('debería retornar 404 para foro inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/foros/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/foros', () => {
    it('debería listar todos los foros con filtros', async () => {
      await request(app).post('/api/foros').send({
        key: 'FORO1',
        title: 'Foro 1',
        owner: owner._id,
        visibility: 'public'
      });

      await request(app).post('/api/foros').send({
        key: 'FORO2',
        title: 'Foro 2',
        owner: owner._id,
        visibility: 'private'
      });

      const response = await request(app)
        .get('/api/foros?visibility=public')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].visibility).toBe('public');
    });
  });

  describe('PUT /api/foros/:id', () => {
    it('debería actualizar un foro', async () => {
      const foro = await request(app)
        .post('/api/foros')
        .send({
          key: 'TEST',
          title: 'Original',
          owner: owner._id
        });

      const response = await request(app)
        .put(`/api/foros/${foro.body._id}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/foros/:id', () => {
    it('debería eliminar un foro', async () => {
      const foro = await request(app)
        .post('/api/foros')
        .send({
          key: 'DELETE_ME',
          title: 'To Delete',
          owner: owner._id
        });

      await request(app)
        .delete(`/api/foros/${foro.body._id}`)
        .expect(200);

      await request(app)
        .get(`/api/foros/${foro.body._id}`)
        .expect(404);
    });
  });
});
