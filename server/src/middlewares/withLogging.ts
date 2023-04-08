import { Response } from 'express';
import { NextFunction } from 'express';
import logger from '../logger';
import { ApiRequest } from '../types';

interface LoggingParams {
  logLevel: 'info' | 'debug';
}

let requestId = 0;

export const withLogging =
  ({ logLevel }: LoggingParams) =>
  (req: ApiRequest, res: Response, next: NextFunction) => {
    req.requestId = String(requestId++);
    if (logLevel === 'debug') {
      logger.debug('req=' + req.requestId, req.method, req.originalUrl);
    }
    next();
  };
