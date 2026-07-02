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
  const email = `static-${Date.now()}@example.com`;
  await request(app).post('/api/account').send({ email, password: 'password' });
  const loginRes = await request(app)
    .post('/api/account/login')
    .send({ email, password: 'password' });
  return loginRes.headers['set-cookie'] || [];
}

async function createLiveQuiz(
  app: Awaited<ReturnType<typeof getTestApp>>,
  cookies: string[]
) {
  const quizRes = await request(app)
    .post('/api/template/quiz')
    .set('Cookie', cookies)
    .send({ name: `Quiz for static ${Date.now()}` });
  const quizId = parseBody(quizRes).id;

  const liveRes = await request(app)
    .post(`/api/live-quiz-admin/create/${quizId}`)
    .set('Cookie', cookies)
    .send({ name: `Static Quiz ${Date.now()}` });

  return parseBody(liveRes);
}

describe('staticQuizController API', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let cookies: string[];
  let liveQuiz: { userFriendlyId: string };

  beforeAll(async () => {
    app = await getTestApp();
    cookies = await getAuthCookies(app);
    liveQuiz = await createLiveQuiz(app, cookies);
  });

  describe('GET /api/static/:liveQuizUserFriendlyId', () => {
    it('returns static quiz JSON when live quiz exists', async () => {
      const res = await request(app).get(
        `/api/static/${liveQuiz.userFriendlyId}`
      );

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBeDefined();
      expect(body.name).toBeDefined();
      expect(body.rounds).toBeDefined();
    });

    it('returns 404 when live quiz not found', async () => {
      const res = await request(app).get('/api/static/nonexistent123');

      expect(res.status).toBe(404);
    });
  });
});
