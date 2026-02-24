import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../appFactory';
import { LiveQuizState, LiveRoundState } from 'shared';

function parseBody(res: request.Response) {
  try {
    return JSON.parse(res.text || '{}');
  } catch {
    return {};
  }
}

async function getAuthCookies(app: Awaited<ReturnType<typeof getTestApp>>) {
  const email = `admin-${Date.now()}@example.com`;
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
    .send({ name: `Quiz for admin ${Date.now()}` });
  const quizId = parseBody(quizRes).id;

  const liveRes = await request(app)
    .post(`/api/live-quiz-admin/create/${quizId}`)
    .set('Cookie', cookies)
    .send({ name: `Admin Live Quiz ${Date.now()}` });

  return parseBody(liveRes);
}

describe('liveQuizAdminController API', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let cookies: string[];
  let liveQuiz: { userFriendlyId: string; id: string };

  beforeAll(async () => {
    app = await getTestApp();
    cookies = await getAuthCookies(app);
    liveQuiz = await createLiveQuiz(app, cookies);
  });

  describe('GET /api/live-quiz-admin/all', () => {
    it('returns 403 or redirects when not authenticated', async () => {
      const res = await request(app).get('/api/live-quiz-admin/all');

      expect([302, 403]).toContain(res.status);
    });

    it('returns live quiz list when authenticated', async () => {
      const res = await request(app)
        .get('/api/live-quiz-admin/all')
        .set('Cookie', cookies);

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body.some((q: { id: string }) => q.id === liveQuiz.id)).toBe(true);
    });
  });

  describe('GET /api/live-quiz-admin/quiz/:liveQuizId', () => {
    it('returns live quiz when found', async () => {
      const res = await request(app)
        .get(`/api/live-quiz-admin/quiz/${liveQuiz.id}`)
        .set('Cookie', cookies);

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBe(liveQuiz.id);
      expect(body.userFriendlyId).toBe(liveQuiz.userFriendlyId);
      expect(body.name).toBeDefined();
    });

    it('returns 404 when live quiz not found', async () => {
      const res = await request(app)
        .get(
          '/api/live-quiz-admin/quiz/00000000-0000-0000-0000-000000000000'
        )
        .set('Cookie', cookies);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/live-quiz-admin/create/:quizTemplateId', () => {
    it('creates live quiz when valid', async () => {
      const quizRes = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz for create ${Date.now()}` });
      const quizId = parseBody(quizRes).id;

      const res = await request(app)
        .post(`/api/live-quiz-admin/create/${quizId}`)
        .set('Cookie', cookies)
        .send({ name: `New Live Quiz ${Date.now()}` });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBeDefined();
      expect(body.userFriendlyId).toBeDefined();
      expect(body.name).toBeDefined();
    });

    it('returns 400 for invalid name', async () => {
      const quizRes = await request(app)
        .post('/api/template/quiz')
        .set('Cookie', cookies)
        .send({ name: `Quiz for invalid ${Date.now()}` });
      const quizId = parseBody(quizRes).id;

      const res = await request(app)
        .post(`/api/live-quiz-admin/create/${quizId}`)
        .set('Cookie', cookies)
        .send({ name: 'x'.repeat(256) });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/live-quiz-admin/quiz/:liveQuizId/update', () => {
    it('updates quiz state', async () => {
      const res = await request(app)
        .put(`/api/live-quiz-admin/quiz/${liveQuiz.id}/update`)
        .set('Cookie', cookies)
        .send({ quizState: LiveQuizState.STARTED_WAITING });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.quizState).toBe(LiveQuizState.STARTED_WAITING);
    });

    it('updates round state', async () => {
      const res = await request(app)
        .put(`/api/live-quiz-admin/quiz/${liveQuiz.id}/update`)
        .set('Cookie', cookies)
        .send({ roundState: LiveRoundState.STARTED_ACCEPTING_ANSWERS });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.roundState).toBe(LiveRoundState.STARTED_ACCEPTING_ANSWERS);
    });

    it('updates round number', async () => {
      const res = await request(app)
        .put(`/api/live-quiz-admin/quiz/${liveQuiz.id}/update`)
        .set('Cookie', cookies)
        .send({ roundNumber: 0 });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.currentRoundNumber).toBe(0);
    });
  });

  describe('DELETE /api/live-quiz-admin/quiz/:liveQuizId', () => {
    it('deletes live quiz', async () => {
      const toDelete = await createLiveQuiz(app, cookies);

      const res = await request(app)
        .delete(`/api/live-quiz-admin/quiz/${toDelete.id}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/live-quiz-admin/quiz/${toDelete.id}`)
        .set('Cookie', cookies);
      expect(getRes.status).toBe(404);
    });
  });
});
