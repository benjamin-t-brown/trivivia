import { Response } from 'express';
import { NextFunction } from 'express';
import { ApiRequest } from '../types';
import { Server, Socket } from 'socket.io';
import logger from '../logger';

export interface IoSession {
  liveQuizUserFriendlyId: string;
  teamId: string;
  socket: Socket;
}

const ioSessions: IoSession[] = [];

export const ioSession = (
  req: ApiRequest,
  res: Response,
  next: NextFunction
) => {
  req.ioSessions = ioSessions;
  next();
};

export const setupIo = (io: Server) => {
  io.on('connection', socket => {
    socket.emit('hello');

    socket.on('join', json => {
      console.log('receive join', json);
      try {
        const { gameId, teamId } = JSON.parse(json);

        if (gameId && teamId) {
          ioSessions.push({
            liveQuizUserFriendlyId: gameId,
            teamId,
            socket,
          });
          socket.emit('joined');
        }
      } catch (e) {
        logger.error('SocketIo error', e);
      }
    });

    socket.on('disconnect', () => {
      const session = ioSessions.find(s => s.socket.id === socket.id);
      if (session) {
        ioSessions.splice(ioSessions.indexOf(session), 1);
      }
    });
  });
};
