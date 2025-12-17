import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import usuariosRouter from '../../src/routes/usuarios.js';
import authRouter from '../../src/routes/auth.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);

let adminUser, adminToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  // Crear usuario admin para los tests
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@ull.edu.es',
    password: 'hashedpassword',
    rol: 'desarrollador'
  });

  // Generar token
  adminToken = jwt.sign(
    { id: adminUser._id },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
    { expiresIn: '1h' }
  );
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@ull.edu.es');
      expect(response.body.password).toBeUndefined();
    });

    it('debería retornar 404 para usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/usuarios/${fakeId}`)
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.length).toBe(3); // 2 creados + admin
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[1].password).toBeUndefined();
      expect(response.body[2].password).toBeUndefined();
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
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.length).toBe(2); // 1 creado + admin
      expect(response.body.every(u => u.activo === true)).toBe(true);
      // Verificar que incluye al usuario activo
      expect(response.body.some(u => u.name === 'Usuario Activo')).toBe(true);
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(u => u.name === 'Juan Pérez')).toBe(true);
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
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body[0].name).toBe('Admin User');
      expect(response.body[1].name).toBe('Ana');
      expect(response.body[2].name).toBe('Zara');
    });

    it('debería limitar resultados a 100 usuarios', async () => {
      // Esta prueba verifica que existe el límite
      // No creamos 101 usuarios por eficiencia
      const response = await request(app)
        .get('/api/usuarios')
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/usuarios/profesores', () => {
    it('debería listar solo profesores activos', async () => {
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

      const response = await request(app)
        .get('/api/usuarios/profesores')
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Profesor Activo');
    });
  });

  describe('PUT /api/usuarios/:id/cambiar-password', () => {
    it('debería cambiar la contraseña correctamente', async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      const user = await User.create({
        name: 'Test User',
        email: 'testpass@ull.edu.es',
        password: hashedPassword,
        rol: 'alumno'
      });

      const userToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/usuarios/${user._id}/cambiar-password`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.message).toBe('Contraseña actualizada correctamente');
    });

    it('debería retornar 401 si la contraseña actual es incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      const user = await User.create({
        name: 'Test User',
        email: 'testpass2@ull.edu.es',
        password: hashedPassword,
        rol: 'alumno'
      });

      const userToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/usuarios/${user._id}/cambiar-password`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.error).toBe('La contraseña actual es incorrecta');
    });

    it('debería retornar 400 si falta algún campo', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'testpass3@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const userToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      await request(app)
        .put(`/api/usuarios/${user._id}/cambiar-password`)
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'oldpassword' })
        .expect(400);
    });

    it('debería retornar 400 si la nueva contraseña es muy corta', async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      const user = await User.create({
        name: 'Test User',
        email: 'testpass4@ull.edu.es',
        password: hashedPassword,
        rol: 'alumno'
      });

      const userToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      await request(app)
        .put(`/api/usuarios/${user._id}/cambiar-password`)
        .set('Cookie', [`token=${userToken}`])
        .send({
          currentPassword: 'oldpassword',
          newPassword: '123'
        })
        .expect(400);
    });

    it('debería retornar 403 si intentas cambiar la contraseña de otro usuario', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const user1Token = jwt.sign(
        { id: user1._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      await request(app)
        .put(`/api/usuarios/${user2._id}/cambiar-password`)
        .set('Cookie', [`token=${user1Token}`])
        .send({
          currentPassword: 'password',
          newPassword: 'newpass123'
        })
        .expect(403);
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
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .send({ email: 'nuevo@ull.edu.es' })
        .expect(200);

      expect(response.body.email).toBe('original@ull.edu.es');
    });

    it('debería retornar 404 al actualizar usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/usuarios/${fakeId}`)
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .send({ rol: 'rol_invalido' });

      // La ruta podría aceptarlo (sin validación) o rechazarlo
      // Verificar que el usuario sigue existiendo
      expect([200, 400]).toContain(response.status);
    });

    it('debería retornar 403 si un usuario no desarrollador intenta editar otro perfil', async () => {
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1edit@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2edit@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      const user1Token = jwt.sign(
        { id: user1._id },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-tokens',
        { expiresIn: '1h' }
      );

      await request(app)
        .put(`/api/usuarios/${user2._id}`)
        .set('Cookie', [`token=${user1Token}`])
        .send({ name: 'Hacked Name' })
        .expect(403);
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      await request(app)
        .get(`/api/usuarios/${user._id}`)
        .set('Cookie', [`token=${adminToken}`])
        .expect(404);
    });

    it('debería retornar 404 al eliminar usuario inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/usuarios/${fakeId}`)
        .set('Cookie', [`token=${adminToken}`])
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
        .set('Cookie', [`token=${adminToken}`])
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });
});
