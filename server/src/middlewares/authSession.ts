import { Response } from 'express';
import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../logger';
import env from '../env';
import { ApiRequest } from '../types';

const nonProtectedRoutes = [
  '/api/account/login$',
  '/api/account$',
  '/res/(.*)',
  '/api/live/(.*)',
  '/$',
  '/join',
  '^/live/',
  '/login',
  '/signup',
];

export const authSession = (
  req: ApiRequest,
  res: Response,
  next: NextFunction
) => {
  logger.debug('auth path', req.path);
  const token = req.session.token;

  if (
    nonProtectedRoutes.find(r => {
      return new RegExp(r).test(req.path);
    })
  ) {
    logger.debug('route is nonprotected', req.path);
    if (req.path === '/api/account' && req.method.toLowerCase() === 'get') {
      logger.debug('request to get account info');
      // do nothing
    } else {
      req.userId = '';
      req.liveTeamId = String(req.headers['live-team-id'] ?? '');
      req.liveSpectateId = String(req.headers['live-spectate-id'] ?? '');
      next();
      return;
    }
  } else if (req.path === '/api/account/logout') {
    // do nothing
  } else if (!token) {
    res.redirect('/');
    res.status(403).send({
      message: 'No token provided!',
    });
    return;
  }

  jwt.verify(token, env.cookieSecret, (err, decoded) => {
    if (err) {
      console.log('not verified');
      return res.status(401).send({
        message: 'Unauthorized!',
      });
    } else {
      req.userId = decoded.id;
      next();
    }
  });
};
