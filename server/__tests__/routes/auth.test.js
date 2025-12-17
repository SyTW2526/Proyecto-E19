import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import authRouter from '../../src/routes/auth.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

beforeAll(async () => {
  await setupTestDB();
  // Crear usuario "paula"
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'paula',
      email: 'paula@ull.edu.es',
      password: '123456'
    })
    .expect(201);
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        name: 'user1',
        email: 'alu0101234567@ull.edu.es',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.user.rol).toBe('alumno');
    });

    it('debería asignar rol profesor a emails que no empiecen con alu', async () => {
      const userData = {
        name: 'profe1',
        email: 'profesor@ull.edu.es',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.rol).toBe('profesor');
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@ull.edu.es' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 409 si el email ya existe', async () => {
      const userData = {
        name: 'Test User',
        email: 'alu0101234567@ull.edu.es',
        password: 'password123'
      };

      await request(app).post('/api/auth/register').send(userData);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('ya está registrado');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'paula',
          email: 'paula@ull.edu.es',
          password: '123456'
        });
    });

    it('debería iniciar sesión exitosamente con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'paula@ull.edu.es',
          password: '123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('debería retornar 401 con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alu0101234567@ull.edu.es',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Credenciales inválidas');
    });

    it('debería retornar 401 con email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@ull.edu.es',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toContain('Credenciales inválidas');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debería cerrar sesión exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería obtener datos del usuario autenticado', async () => {
      // Primero registrar y hacer login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Me',
          email: 'testme@ull.edu.es',
          password: '123456'
        });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(response.body.name).toBe('Test Me');
      expect(response.body.email).toBe('testme@ull.edu.es');
      expect(response.body.password).toBeUndefined();
    });

    it('debería retornar 401 sin token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
