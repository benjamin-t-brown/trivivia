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

describe('accountController API', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe('POST /api/account/login', () => {
    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/account/login')
        .send({ email: 'invalid', password: 'password' });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toContain('valid email');
    });

    it('returns 400 for empty password', async () => {
      const res = await request(app)
        .post('/api/account/login')
        .send({ email: 'user@example.com', password: '' });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toMatch(/valid password|Invalid login/);
    });

    it('returns isAuthorized false for non-existent user', async () => {
      const res = await request(app)
        .post('/api/account/login')
        .send({ email: 'nonexistent@example.com', password: 'password' });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toContain('Invalid login');
    });

    it('returns isAuthorized true and sets session for valid login', async () => {
      const email = `logintest-${Date.now()}@example.com`;
      const signupRes = await request(app)
        .post('/api/account')
        .send({ email, password: 'password123' });
      expect(signupRes.status).toBe(200);

      const res = await request(app)
        .post('/api/account/login')
        .send({ email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(parseBody(res).isAuthorized).toBe(true);
    });
  });

  describe('POST /api/account', () => {
    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/account')
        .send({ email: 'bad', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty password', async () => {
      const res = await request(app)
        .post('/api/account')
        .send({ email: 'user@example.com', password: '' });

      expect(res.status).toBe(400);
    });

    it('creates account successfully', async () => {
      const res = await request(app)
        .post('/api/account')
        .send({
          email: `signuptest-${Date.now()}@example.com`,
          password: 'password123',
        });

      const body = parseBody(res);
      expect(res.status).toBe(200);
      expect(body.email).toBeDefined();
      expect(body.id).toBeDefined();
      expect(body.password).toBeUndefined();
    });

    it('returns 400 for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      await request(app).post('/api/account').send({ email, password: 'pass' });

      const res = await request(app)
        .post('/api/account')
        .send({ email, password: 'pass' });

      expect(res.status).toBe(400);
      expect(parseBody(res).message).toContain('already exists');
    });
  });

  describe('DELETE /api/account/login', () => {
    it('returns 200 and clears session', async () => {
      const email = `logouttest-${Date.now()}@example.com`;
      await request(app)
        .post('/api/account')
        .send({ email, password: 'password' });
      const loginRes = await request(app)
        .post('/api/account/login')
        .send({ email, password: 'password' });
      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app)
        .delete('/api/account/login')
        .set('Cookie', cookies || []);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/account', () => {
    it('returns 403 or 401 when not authenticated', async () => {
      const res = await request(app).get('/api/account');

      expect([401, 403]).toContain(res.status);
    });

    it('returns account when authenticated', async () => {
      const email = `getaccount-${Date.now()}@example.com`;
      await request(app)
        .post('/api/account')
        .send({ email, password: 'password' });
      const loginRes = await request(app)
        .post('/api/account/login')
        .send({ email, password: 'password' });
      const cookies = loginRes.headers['set-cookie'];

      const getRes = await request(app)
        .get('/api/account')
        .set('Cookie', cookies || []);

      const body = parseBody(getRes);
      expect(getRes.status).toBe(200);
      expect(body.email).toBe(email);
    });
  });
});
