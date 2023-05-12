import { vi, it, describe, expect } from 'vitest';
import { AccountService } from '../src/services/AccountService';
import bcrypt from 'bcryptjs';

describe('AccountService', () => {
  it('can login with correct password', async () => {
    const accountService = new AccountService();
    const password = '12345';
    const email = 'asdf@asdf.com';
    accountService.findByEmail = vi.fn().mockImplementation(async () => {
      return [
        {
          email,
          id: '1234',
          password: bcrypt.hashSync(password, 8),
        },
      ];
    });
    const context = {
      userId: '',
      ioSessions: [],
      session: {
        token: undefined,
      },
    };

    const result = await accountService.login(email, password, context);

    expect(result).toBe(true);
    expect(context.session.token).toBeDefined();
  });

  it('rejects incorrect password', async () => {
    const accountService = new AccountService();
    const password = '12345';
    const email = 'asdf@asdf.com';
    accountService.findByEmail = vi.fn().mockImplementation(async () => {
      return [
        {
          email,
          id: '1234',
          password: bcrypt.hashSync(password, 8),
        },
      ];
    });
    const context = {
      userId: '',
      ioSessions: [],
      session: {},
    };

    const result = await accountService.login(email, 'wrong password', context);

    expect(result).toBe(false);
  });

  it('removes session token when logging out', async () => {
    const accountService = new AccountService();
    const context = {
      userId: '',
      ioSessions: [],
      session: {
        token: 'asdf',
      },
    };

    await accountService.logout(context);

    expect(context.session.token).toBeUndefined();
  });
});
