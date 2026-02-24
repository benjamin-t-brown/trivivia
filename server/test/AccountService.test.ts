import { vi, it, describe, expect, beforeEach } from 'vitest';
import { AccountService } from '../src/services/AccountService';
import bcrypt from 'bcryptjs';
import { InvalidInputError } from '../src/routing';

const mockSave = vi.fn().mockResolvedValue(undefined);
vi.mock('../src/models/Account', () => {
  class MockAccount {
    id: string;
    email: string;
    password: string;
    constructor(attrs: any) {
      Object.assign(this, attrs);
    }
    save = mockSave;
  }
  (MockAccount as any).findByPk = vi.fn();
  (MockAccount as any).findAll = vi.fn();
  return { Account: MockAccount };
});

import { Account } from '../src/models/Account';

describe('AccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
  });

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

  it('throws InvalidInputError when login with non-existent email', async () => {
    const accountService = new AccountService();
    accountService.findByEmail = vi.fn().mockResolvedValue([]);
    const context = {
      userId: '',
      ioSessions: [],
      session: { token: undefined },
    };

    await expect(
      accountService.login('nonexistent@test.com', 'password', context)
    ).rejects.toThrow(InvalidInputError);
    await expect(
      accountService.login('nonexistent@test.com', 'password', context)
    ).rejects.toThrow('Invalid login credentials.');
  });

  it('can signup a new account', async () => {
    const accountService = new AccountService();
    (Account.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const account = await accountService.signup('newuser@test.com', 'password');

    expect(account.id).toBeDefined();
    expect(account.email).toBe('newuser@test.com');
    expect(account.password).toBeDefined();
    expect(mockSave).toHaveBeenCalled();
  });

  it('throws InvalidInputError when signup with existing email', async () => {
    const accountService = new AccountService();
    (Account.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      { email: 'existing@test.com', id: '123' },
    ]);

    await expect(
      accountService.signup('existing@test.com', 'password')
    ).rejects.toThrow(InvalidInputError);
    await expect(
      accountService.signup('existing@test.com', 'password')
    ).rejects.toThrow('Email already exists.');
  });

  it('can find account by id', async () => {
    const accountService = new AccountService();
    const mockAccount = { id: '123', email: 'user@test.com' };
    (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAccount
    );

    const result = await accountService.findById('123');

    expect(result).toEqual(mockAccount);
    expect(Account.findByPk).toHaveBeenCalledWith('123');
  });

  it('can update password when account exists', async () => {
    const accountService = new AccountService();
    const mockAccount = {
      id: '123',
      password: 'old',
      save: mockSave,
    };
    (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAccount
    );
    const context = { userId: '123', ioSessions: [], session: {} };

    const result = await accountService.updatePassword('newpassword', context);

    expect(result).toBeDefined();
    expect(mockAccount.password).not.toBe('old');
    expect(mockSave).toHaveBeenCalled();
  });

  it('returns undefined when updatePassword for non-existent account', async () => {
    const accountService = new AccountService();
    (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const context = { userId: 'nonexistent', ioSessions: [], session: {} };

    const result = await accountService.updatePassword('newpassword', context);

    expect(result).toBeUndefined();
  });
});
