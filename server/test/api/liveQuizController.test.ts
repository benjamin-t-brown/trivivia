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
  const email = `livequiz-${Date.now()}@example.com`;
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
    .send({ name: `Quiz for live ${Date.now()}` });
  const quizId = parseBody(quizRes).id;

  const liveRes = await request(app)
    .post(`/api/live-quiz-admin/create/${quizId}`)
    .set('Cookie', cookies)
    .send({ name: `Live Quiz ${Date.now()}` });

  return parseBody(liveRes);
}

describe('liveQuizController API', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let cookies: string[];
  let liveQuiz: { userFriendlyId: string; id: string };

  beforeAll(async () => {
    app = await getTestApp();
    cookies = await getAuthCookies(app);
    liveQuiz = await createLiveQuiz(app, cookies);
  });

  describe('GET /api/live/:liveQuizUserFriendlyId/meta', () => {
    it('returns meta when live quiz exists', async () => {
      const res = await request(app).get(
        `/api/live/${liveQuiz.userFriendlyId}/meta`
      );

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body).toBeDefined();
      expect(body.quiz).toBeDefined();
      expect(body.quiz.name).toBeDefined();
    });

    it('returns 404 when live quiz not found', async () => {
      const res = await request(app).get('/api/live/nonexistent123/meta');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/live/:liveQuizUserFriendlyId/join', () => {
    it('allows team to join', async () => {
      const res = await request(app)
        .post(`/api/live/${liveQuiz.userFriendlyId}/join`)
        .send({
          teamName: `Team ${Date.now()}`,
          numberOfPlayers: 2,
          spectate: false,
        });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.id).toBeDefined();
      expect(body.teamName).toBeDefined();
    });

    it('returns 400 for invalid team name', async () => {
      const res = await request(app)
        .post(`/api/live/${liveQuiz.userFriendlyId}/join`)
        .send({
          teamName: 'ab',
          numberOfPlayers: 1,
          spectate: false,
        });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toContain('valid name');
    });

    it('returns 400 for invalid number of players', async () => {
      const res = await request(app)
        .post(`/api/live/${liveQuiz.userFriendlyId}/join`)
        .send({
          teamName: 'ValidTeam',
          numberOfPlayers: 0,
          spectate: false,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/live/:liveQuizUserFriendlyId', () => {
    it('returns 404 when no live-team-id or live-spectate-id header', async () => {
      const res = await request(app).get(
        `/api/live/${liveQuiz.userFriendlyId}`
      );

      expect(res.status).toBe(404);
    });

    it('returns state when live-spectate-id header present', async () => {
      const joinRes = await request(app)
        .post(`/api/live/${liveQuiz.userFriendlyId}/join`)
        .send({
          teamName: `SpectateTeam ${Date.now()}`,
          numberOfPlayers: 1,
          spectate: false,
        });
      const teamId = parseBody(joinRes).id;

      const res = await request(app)
        .get(`/api/live/${liveQuiz.userFriendlyId}`)
        .set('live-spectate-id', teamId);

      expect(res.status).toBe(200);
    });
  });
});
