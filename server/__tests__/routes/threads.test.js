import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import threadsRouter from '../../src/routes/threads.js';
import forosRouter from '../../src/routes/foro.js';
import postsRouter from '../../src/routes/posts.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/threads', threadsRouter);
app.use('/api/foros', forosRouter);
app.use('/api/posts', postsRouter);

let author, foro;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  author = await User.create({
    name: 'Thread Author',
    email: 'thread@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  const foroRes = await request(app)
    .post('/api/foros')
    .send({
      key: 'THREAD_TEST',
      title: 'Foro de prueba',
      owner: author._id
    });
  foro = foroRes.body;
});

describe('Threads Routes', () => {
  describe('POST /api/threads', () => {
    it('debería crear un nuevo thread', async () => {
      const threadData = {
        foro: foro._id,
        author: author._id,
        title: 'Nuevo hilo de discusión'
      };

      const response = await request(app)
        .post('/api/threads')
        .send(threadData)
        .expect(201);

      expect(response.body.title).toBe('Nuevo hilo de discusión');
      expect(response.body.foro).toBe(foro._id.toString());
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/threads')
        .send({ title: 'Solo título' })
        .expect(400);

      expect(response.body.error).toBe('missing_fields');
    });

    it('debería crear thread con tags', async () => {
      const response = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Thread con tags',
          tags: ['ayuda', 'urgente']
        })
        .expect(201);

      expect(response.body.tags).toContain('ayuda');
      expect(response.body.tags).toContain('urgente');
    });

    it('debería crear thread sticky', async () => {
      const response = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Thread fijado',
          sticky: true
        })
        .expect(201);

      expect(response.body.sticky).toBe(true);
    });
  });

  describe('GET /api/threads/:id', () => {
    it('debería obtener thread por id con datos poblados', async () => {
      const thread = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Test thread'
        });

      const response = await request(app)
        .get(`/api/threads/${thread.body._id}`)
        .expect(200);

      expect(response.body.author).toHaveProperty('name');
      expect(response.body.author).toHaveProperty('email');
      expect(response.body.foro).toHaveProperty('key');
      expect(response.body.foro).toHaveProperty('title');
    });

    it('debería retornar 404 para thread inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/threads/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/threads', () => {
    it('debería listar threads de un foro', async () => {
      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread 1'
      });

      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread 2'
      });

      const response = await request(app)
        .get(`/api/threads?foro=${foro._id}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('debería filtrar threads por autor', async () => {
      const otherAuthor = await User.create({
        name: 'Other Author',
        email: 'other@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread del autor original'
      });

      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: otherAuthor._id,
        title: 'Thread de otro autor'
      });

      const response = await request(app)
        .get(`/api/threads?author=${author._id}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].author.email).toBe('thread@ull.edu.es');
    });

    it('debería filtrar threads por tag', async () => {
      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread con tag ayuda',
        tags: ['ayuda']
      });

      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread con tag duda',
        tags: ['duda']
      });

      const response = await request(app)
        .get('/api/threads?tag=ayuda')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].tags).toContain('ayuda');
    });

    it('debería ordenar threads con sticky primero', async () => {
      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread normal',
        sticky: false
      });

      await request(app).post('/api/threads').send({
        foro: foro._id,
        author: author._id,
        title: 'Thread sticky',
        sticky: true
      });

      const response = await request(app)
        .get(`/api/threads?foro=${foro._id}`)
        .expect(200);

      expect(response.body[0].sticky).toBe(true);
      expect(response.body[0].title).toBe('Thread sticky');
    });

    it('debería respetar límite y paginación', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/threads').send({
          foro: foro._id,
          author: author._id,
          title: `Thread ${i}`
        });
      }

      const response = await request(app)
        .get('/api/threads?limit=2&page=1')
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('PUT /api/threads/:id', () => {
    it('debería actualizar un thread', async () => {
      const thread = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Título original'
        });

      const response = await request(app)
        .put(`/api/threads/${thread.body._id}`)
        .send({ title: 'Título actualizado' })
        .expect(200);

      expect(response.body.title).toBe('Título actualizado');
    });

    it('debería actualizar el estado de sticky', async () => {
      const thread = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Thread para fijar',
          sticky: false
        });

      const response = await request(app)
        .put(`/api/threads/${thread.body._id}`)
        .send({ sticky: true })
        .expect(200);

      expect(response.body.sticky).toBe(true);
    });

    it('debería retornar 404 al actualizar thread inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/threads/${fakeId}`)
        .send({ title: 'Update' })
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('DELETE /api/threads/:id', () => {
    it('debería eliminar thread y sus posts asociados', async () => {
      const thread = await request(app)
        .post('/api/threads')
        .send({
          foro: foro._id,
          author: author._id,
          title: 'Thread para eliminar'
        });

      // Crear algunos posts en el thread
      await request(app).post('/api/posts').send({
        thread: thread.body._id,
        author: author._id,
        body: 'Post 1'
      });

      await request(app).post('/api/posts').send({
        thread: thread.body._id,
        author: author._id,
        body: 'Post 2'
      });

      await request(app)
        .delete(`/api/threads/${thread.body._id}`)
        .expect(200);

      // Verificar que el thread ya no existe
      await request(app)
        .get(`/api/threads/${thread.body._id}`)
        .expect(404);

      // Verificar que los posts también fueron eliminados
      const posts = await request(app)
        .get(`/api/posts?thread=${thread.body._id}`)
        .expect(200);
      
      expect(posts.body.length).toBe(0);
    });

    it('debería retornar 404 al eliminar thread inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/threads/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });
});
