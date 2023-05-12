import { Router } from 'express';
import {
  InvalidInputError,
  registerDelete,
  registerGet,
  registerPost,
  registerPut,
} from '../routing';
import { AccountService } from '../services/AccountService';
import { validateEmail, validateString } from '../validators';

export const initAccountControllers = (router: Router) => {
  const accountService = new AccountService();

  registerPost(
    router,
    '/api/account/login',
    async function login(
      _,
      body: {
        email: string;
        password: string;
      },
      context
    ) {
      const { email, password } = body;
      if (!validateEmail(email)) {
        throw new InvalidInputError('Not a valid email.');
      }
      if (!validateString(password)) {
        throw new InvalidInputError('Not a valid password.');
      }
      const isAuthorized = await accountService.login(email, password, context);
      return {
        isAuthorized,
      };
    }
  );

  registerDelete(
    router,
    '/api/account/login',
    async function deleteAccount(_, __, context) {
      await accountService.logout(context);
      return {};
    }
  );

  registerPost(
    router,
    '/api/account',
    async function signup(
      _,
      body: {
        email: string;
        password: string;
      }
    ) {
      const { email, password } = body;
      if (!validateEmail(email)) {
        throw new InvalidInputError('Not a valid email.');
      }
      if (!validateString(password)) {
        throw new InvalidInputError('Not a valid password.');
      }

      const account = await accountService.signup(body.email, body.password);
      return account.getResponseJson();
    }
  );

  registerGet(
    router,
    '/api/account',
    async function getAccount(_, __, context) {
      if (!context.userId) {
        return;
      }

      const account = await accountService.findById(context.userId);
      if (account) {
        return account.getResponseJson();
      }
    }
  );

  registerPut(
    router,
    '/api/account/pw',
    async function updatePassword(
      _,
      body: {
        password: string;
      },
      context
    ) {
      const { password } = body;
      if (!validateString(password, 3, 50)) {
        throw new InvalidInputError('Not a valid password.');
      }

      console.log('UPDATE PW');

      const account = await accountService.updatePassword(password, context);
      if (!account) {
        return undefined;
      }

      return account.getResponseJson();
    }
  );
};
