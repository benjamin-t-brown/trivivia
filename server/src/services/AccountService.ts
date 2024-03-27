import { randomUUID } from 'crypto';
import logger from '../logger';
import { Account } from '../models/Account';
import { InvalidInputError, RouteContext } from '../routing';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../env';

export class AccountService {
  async findById(userId: string) {
    return Account.findByPk(userId);
  }

  async findByEmail(email: string) {
    return Account.findAll({
      where: {
        email,
      },
    });
  }

  async login(email: string, password: string, context: RouteContext) {
    const result = await this.findByEmail(email);

    if (result.length === 0) {
      throw new InvalidInputError('Invalid login credentials.');
    }

    const account = result[0];
    const passwordIsValid: boolean = bcrypt.compareSync(
      password,
      account.password
    );

    if (passwordIsValid) {
      const token = jwt.sign({ id: account.id }, env.cookieSecret, {
        expiresIn: 86400, // 24 hours
      });
      context.session.token = token;
    } else {
      context.session.token = undefined;
    }

    return passwordIsValid;
  }

  private hashPassword(password: string) {
    return bcrypt.hashSync(password, 8);
  }

  async signup(email: string, password: string) {
    const result = await this.findByEmail(email);

    if (result.length) {
      throw new InvalidInputError('Email already exists.');
    }

    logger.debug('Create account', email);
    const account = new Account({
      id: randomUUID(),
      email,
      password: this.hashPassword(password),
    });
    await account.save();
    return account;
  }

  async logout(context: RouteContext) {
    context.session.token = undefined;
  }

  async updatePassword(newPassword: string, context: RouteContext) {
    const account = await this.findById(context.userId);
    if (!account) {
      return undefined;
    }

    account.password = this.hashPassword(newPassword);
    await account.save();
    return account;
  }
}
