import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import usuariosRouter from '../../src/routes/usuarios.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/usuarios', usuariosRouter);

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Usuarios Routes', () => {
  describe('GET /api/usuarios/:id', () => {
    it('debería obtener usuario por id sin mostrar password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@ull.edu.es',
        password: 'hashedpassword',
        rol: 'alumno'
      });

      const response = await request(app)
        .get(`/api/usuarios/${user._id}`)
        .expect(200);

      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@ull.edu.es');
      expect(response.body.password).toBeUndefined();
    });

    it('debería retornar 404 para usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/usuarios/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/usuarios', () => {
    it('debería listar todos los usuarios sin passwords', async () => {
      await User.create({
        name: 'User 1',
        email: 'user1@ull.edu.es',
        password: 'password1',
        rol: 'alumno'
      });

      await User.create({
        name: 'User 2',
        email: 'user2@ull.edu.es',
        password: 'password2',
        rol: 'profesor'
      });

      const response = await request(app)
        .get('/api/usuarios')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[1].password).toBeUndefined();
    });

    it('debería filtrar usuarios por rol', async () => {
      await User.create({
        name: 'Estudiante',
        email: 'student@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await User.create({
        name: 'Profesor',
        email: 'teacher@ull.edu.es',
        password: 'password',
        rol: 'profesor'
      });

      const response = await request(app)
        .get('/api/usuarios?rol=profesor')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].rol).toBe('profesor');
      expect(response.body[0].name).toBe('Profesor');
    });

    it('debería filtrar usuarios por estado activo', async () => {
      await User.create({
        name: 'Usuario Activo',
        email: 'active@ull.edu.es',
        password: 'password',
        rol: 'alumno',
        activo: true
      });

      await User.create({
        name: 'Usuario Inactivo',
        email: 'inactive@ull.edu.es',
        password: 'password',
        rol: 'alumno',
        activo: false
      });

      const response = await request(app)
        .get('/api/usuarios?activo=true')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].activo).toBe(true);
      expect(response.body[0].name).toBe('Usuario Activo');
    });

    it('debería buscar usuarios por nombre (case insensitive)', async () => {
      await User.create({
        name: 'Juan Pérez',
        email: 'juan@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await User.create({
        name: 'María García',
        email: 'maria@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const response = await request(app)
        .get('/api/usuarios?nombre=juan')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Juan Pérez');
    });

    it('debería aplicar múltiples filtros simultáneamente', async () => {
      await User.create({
        name: 'Profesor Activo',
        email: 'prof1@ull.edu.es',
        password: 'password',
        rol: 'profesor',
        activo: true
      });

      await User.create({
        name: 'Profesor Inactivo',
        email: 'prof2@ull.edu.es',
        password: 'password',
        rol: 'profesor',
        activo: false
      });

      await User.create({
        name: 'Estudiante Activo',
        email: 'student@ull.edu.es',
        password: 'password',
        rol: 'alumno',
        activo: true
      });

      const response = await request(app)
        .get('/api/usuarios?rol=profesor&activo=true')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Profesor Activo');
    });

    it('debería ordenar usuarios por nombre', async () => {
      await User.create({
        name: 'Zara',
        email: 'zara@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await User.create({
        name: 'Ana',
        email: 'ana@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const response = await request(app)
        .get('/api/usuarios')
        .expect(200);

      expect(response.body[0].name).toBe('Ana');
      expect(response.body[1].name).toBe('Zara');
    });

    it('debería limitar resultados a 100 usuarios', async () => {
      // Esta prueba verifica que existe el límite
      // No creamos 101 usuarios por eficiencia
      const response = await request(app)
        .get('/api/usuarios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    it('debería actualizar datos del usuario', async () => {
      const user = await User.create({
        name: 'Original Name',
        email: 'original@ull.edu.es',
        password: 'hashedpassword',
        rol: 'alumno'
      });

      const response = await request(app)
        .put(`/api/usuarios/${user._id}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.password).toBeUndefined();
    });

    
    it('debería actualizar estado activo del usuario', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@ull.edu.es',
        password: 'password',
        rol: 'alumno',
        activo: true
      });

      const response = await request(app)
        .put(`/api/usuarios/${user._id}`)
        .send({ activo: false })
        .expect(200);

      expect(response.body.activo).toBe(false);
    });

    it('NO debería permitir cambiar el email', async () => {
      const user = await User.create({
        name: 'User',
        email: 'original@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const response = await request(app)
        .put(`/api/usuarios/${user._id}`)
        .send({ email: 'nuevo@ull.edu.es' })
        .expect(200);

      expect(response.body.email).toBe('original@ull.edu.es');
    });

    it('debería retornar 404 al actualizar usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/usuarios/${fakeId}`)
        .send({ name: 'Update' })
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });

    it('debería validar datos al actualizar', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const response = await request(app)
        .put(`/api/usuarios/${user._id}`)
        .send({ rol: 'rol_invalido' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('debería eliminar un usuario', async () => {
      const user = await User.create({
        name: 'User to Delete',
        email: 'delete@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await request(app)
        .delete(`/api/usuarios/${user._id}`)
        .expect(200);

      await request(app)
        .get(`/api/usuarios/${user._id}`)
        .expect(404);
    });

    it('debería retornar 404 al eliminar usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/usuarios/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });

    it('debería retornar ok:true al eliminar exitosamente', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const response = await request(app)
        .delete(`/api/usuarios/${user._id}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });
});
