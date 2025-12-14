import request from 'supertest';
import express from 'express';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import postsRouter from '../../src/routes/posts.js';
import threadsRouter from '../../src/routes/threads.js';
import forosRouter from '../../src/routes/foro.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/posts', postsRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/foros', forosRouter);

let author, foro, thread;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  
  author = await User.create({
    name: 'Post Author',
    email: 'author@ull.edu.es',
    password: 'hashedpassword',
    rol: 'alumno'
  });

  const foroRes = await request(app)
    .post('/api/foros')
    .send({
      key: 'TEST_FORO',
      title: 'Test Foro',
      owner: author._id
    });
  foro = foroRes.body;

  const threadRes = await request(app)
    .post('/api/threads')
    .send({
      foro: foro._id,
      author: author._id,
      title: 'Test Thread'
    });
  thread = threadRes.body;
});

describe('Posts Routes', () => {
  describe('POST /api/posts', () => {
    it('debería crear un nuevo post', async () => {
      const postData = {
        thread: thread._id,
        author: author._id,
        body: 'Este es el contenido del post'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body.body).toBe('Este es el contenido del post');
      expect(response.body.thread).toBe(thread._id.toString());
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ body: 'Solo el cuerpo' })
        .expect(400);

      expect(response.body.error).toBe('missing_fields');
    });

    it('debería crear un post como respuesta a otro post', async () => {
      const parentPost = await request(app)
        .post('/api/posts')
        .send({
          thread: thread._id,
          author: author._id,
          body: 'Post padre'
        });

      const response = await request(app)
        .post('/api/posts')
        .send({
          thread: thread._id,
          author: author._id,
          body: 'Respuesta al post',
          parent: parentPost.body._id
        })
        .expect(201);

      expect(response.body.parent).toBe(parentPost.body._id);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('debería obtener post por id con datos poblados', async () => {
      const post = await request(app)
        .post('/api/posts')
        .send({
          thread: thread._id,
          author: author._id,
          body: 'Test post'
        });

      const response = await request(app)
        .get(`/api/posts/${post.body._id}`)
        .expect(200);

      expect(response.body.author).toHaveProperty('name');
      expect(response.body.author).toHaveProperty('email');
      expect(response.body.thread).toHaveProperty('title');
    });

    it('debería retornar 404 para post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('GET /api/posts', () => {
    it('debería listar posts de un thread', async () => {
      await request(app).post('/api/posts').send({
        thread: thread._id,
        author: author._id,
        body: 'Post 1'
      });

      await request(app).post('/api/posts').send({
        thread: thread._id,
        author: author._id,
        body: 'Post 2'
      });

      const response = await request(app)
        .get(`/api/posts?thread=${thread._id}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('debería filtrar posts por autor', async () => {
      const otherAuthor = await User.create({
        name: 'Other Author',
        email: 'other@ull.edu.es',
        password: 'password',
        rol: 'alumno'
      });

      await request(app).post('/api/posts').send({
        thread: thread._id,
        author: author._id,
        body: 'Post del autor original'
      });

      await request(app).post('/api/posts').send({
        thread: thread._id,
        author: otherAuthor._id,
        body: 'Post de otro autor'
      });

      const response = await request(app)
        .get(`/api/posts?author=${author._id}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].author.email).toBe('author@ull.edu.es');
    });

    it('debería respetar límite y paginación', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/posts').send({
          thread: thread._id,
          author: author._id,
          body: `Post ${i}`
        });
      }

      const response = await request(app)
        .get('/api/posts?limit=2&page=1')
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('debería actualizar un post', async () => {
      const post = await request(app)
        .post('/api/posts')
        .send({
          thread: thread._id,
          author: author._id,
          body: 'Contenido original'
        });

      const response = await request(app)
        .put(`/api/posts/${post.body._id}`)
        .send({ body: 'Contenido editado' })
        .expect(200);

      expect(response.body.body).toBe('Contenido editado');
    });

    it('debería retornar 404 al actualizar post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .send({ body: 'Update' })
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('debería eliminar un post', async () => {
      const post = await request(app)
        .post('/api/posts')
        .send({
          thread: thread._id,
          author: author._id,
          body: 'Post para eliminar'
        });

      await request(app)
        .delete(`/api/posts/${post.body._id}`)
        .expect(200);

      await request(app)
        .get(`/api/posts/${post.body._id}`)
        .expect(404);
    });

    it('debería retornar 404 al eliminar post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('not_found');
    });
  });
});
