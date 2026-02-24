import { vi, it, describe, expect, beforeEach } from 'vitest';
import { authSession } from '../src/middlewares/authSession';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe('authSession', () => {
  const createMockReq = (overrides: Partial<any> = {}) => ({
    path: '/',
    method: 'GET',
    session: {},
    headers: {},
    userId: undefined,
    liveTeamId: undefined,
    liveSpectateId: undefined,
    ...overrides,
  });

  const createMockRes = () => {
    const res: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
    };
    return res;
  };

  const createMockNext = () => vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next and sets userId for non-protected route', () => {
    const req = createMockReq({ path: '/api/account/login', method: 'POST' });
    const res = createMockRes();
    const next = createMockNext();

    authSession(req as any, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets liveTeamId and liveSpectateId from headers for non-protected route', () => {
    const req = createMockReq({
      path: '/api/live/abc123',
      headers: { 'live-team-id': 'team1', 'live-spectate-id': 'spec1' },
    });
    const res = createMockRes();
    const next = createMockNext();

    authSession(req as any, res, next);

    expect(req.liveTeamId).toBe('team1');
    expect(req.liveSpectateId).toBe('spec1');
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when protected route has no token', () => {
    const req = createMockReq({
      path: '/api/template/quiz/123',
      session: {},
    });
    const res = createMockRes();
    const next = createMockNext();

    authSession(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No token provided!' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const req = createMockReq({
      path: '/api/template/quiz/123',
      session: { token: 'invalid-token' },
    });
    const res = createMockRes();
    const next = createMockNext();

    (jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(
      (token, secret, cb) => cb(new Error('invalid'), null)
    );

    authSession(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unauthorized!' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets userId when token is valid', () => {
    const req = createMockReq({
      path: '/api/template/quiz/123',
      session: { token: 'valid-token' },
    });
    const res = createMockRes();
    const next = createMockNext();

    (jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(
      (token, secret, cb) => cb(null, { id: 'user-123' })
    );

    authSession(req as any, res, next);

    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
