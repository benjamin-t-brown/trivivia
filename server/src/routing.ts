import { Response, Router } from 'express';
import logger from './logger';
import { ApiRequest } from './types';
import { IoSession } from './middlewares/ioSessionMemory';

export interface RouteContext {
  userId: string;
  session: any;
  liveTeamId?: string;
  liveSpectateId?: string;
  ioSessions: IoSession[];
  res?: Response;
}

export class InvalidInputError extends Error {
  meta?: any;
  constructor(msg: string, meta?: any) {
    super(msg);
    this.meta = meta;
  }
}

type RouteCb<T, R> = (
  params: Record<string, string>,
  body: T | undefined,
  context: RouteContext
) => Promise<R | void | undefined>;

export function registerRoute<T, R>(
  router: Router,
  method: 'get' | 'post' | 'put' | 'delete',
  route: string,
  cb: RouteCb<T, R>,
  skipJsonStringify = false
) {
  logger.debug('Register route', method, route);
  router[method](route, async (req: ApiRequest, res: Response) => {
    try {
      const result = await cb({ ...req.params }, req.body, {
        userId: req.userId ?? '',
        session: req.session,
        liveTeamId: req.liveTeamId,
        liveSpectateId: req.liveSpectateId,
        ioSessions: req.ioSessions,
        res,
      });
      if (result) {
        let data: string;
        if (!skipJsonStringify) {
          data = JSON.stringify(result);
        } else {
          data = result as string;
        }
        logger.debug(
          'response=' + req.requestId,
          'latency=' +
            Math.round(performance.now() - (req.timestampReceived ?? 0)) +
            'ms',
          method,
          route,
          data.slice(0, 50) + '...'
        );
        res.status(200).send(data);
      } else {
        logger.error(
          'Not Found Error (router returned undefined)',
          'req=' + req.requestId,
          method,
          route,
          'Not found.'
        );
        res.status(404).send(
          JSON.stringify({
            message: 'Not found.',
          })
        );
      }
    } catch (e) {
      if (e instanceof InvalidInputError) {
        logger.error(
          'Invalid Input Error',
          'req=' + req.requestId,
          method,
          route,
          e.stack
        );
        res.status(400).send(
          JSON.stringify({
            message: e.message,
          })
        );
      } else {
        logger.error(
          'Route Error',
          'req=' + req.requestId,
          method,
          route,
          String(e),
          e.stack
        );
        res.status(500).send(
          JSON.stringify({
            message: 'Internal server error.',
          })
        );
      }
    }
  });
}

export function registerGet<T, R>(
  router: Router,
  route: string,
  cb: RouteCb<T, R>
) {
  return registerRoute(router, 'get', route, cb);
}

export function registerPost<T, R>(
  router: Router,
  route: string,
  cb: RouteCb<T, R>
) {
  return registerRoute(router, 'post', route, cb);
}

export function registerPut<T, R>(
  router: Router,
  route: string,
  cb: RouteCb<T, R>
) {
  return registerRoute(router, 'put', route, cb);
}

export function registerDelete<T, R>(
  router: Router,
  route: string,
  cb: RouteCb<T, R>
) {
  return registerRoute(router, 'delete', route, cb);
}
