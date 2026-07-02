import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../appFactory';

function parseBody(res: request.Response) {
  try {
    return JSON.parse(res.text || '{}');
  } catch {
    return {};
  }
}

async function getAuthCookies(app: Awaited<ReturnType<typeof getTestApp>>) {
  const email = `template-${Date.now()}@example.com`;
  await request(app).post('/api/account').send({ email, password: 'password' });
  const loginRes = await request(app)
    .post('/api/account/login')
    .send({ email, password: 'password' });
  return loginRes.headers['set-cookie'] || [];
}

describe('templateController API', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let cookies: string[];

  beforeAll(async () => {
    app = await getTestApp();
    cookies = await getAuthCookies(app);
  });

  describe('GET /api/template/all/quiz', () => {
    it('returns quiz list when authenticated', async () => {
      const res = await request(app)
        .get('/api/template/all/quiz')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(parseBody(res))).toBe(true);
    });
  });

  describe('POST /api/template/quiz', () => {
    it('creates quiz when valid name', async () => {
      const res = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz ${Date.now()}` });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBeDefined();
      expect(body.name).toBeDefined();
    });

    it('returns 400 for invalid name', async () => {
      const res = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: 'x'.repeat(256) });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toContain('valid name');
    });
  });

  describe('GET /api/template/quiz/:id', () => {
    it('returns quiz when found', async () => {
      const createRes = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz for get ${Date.now()}` });
      const quizId = parseBody(createRes).id;

      const res = await request(app)
        .get(`/api/template/quiz/${quizId}`)
        .set('Cookie', cookies);

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBe(quizId);
    });

    it('returns 404 when quiz not found', async () => {
      const res = await request(app)
        .get('/api/template/quiz/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/template/quiz/:id', () => {
    it('updates quiz when valid', async () => {
      const createRes = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz for update ${Date.now()}` });
      const quizId = parseBody(createRes).id;

      const res = await request(app)
        .put(`/api/template/quiz/${quizId}`)
        .set('Cookie', cookies)
        .send({ name: 'Updated Name', allowStaticRender: false });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/template/quiz/:id', () => {
    it('deletes quiz', async () => {
      const createRes = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz for delete ${Date.now()}` });
      const quizId = parseBody(createRes).id;

      const res = await request(app)
        .delete(`/api/template/quiz/${quizId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
    });
  });
});
