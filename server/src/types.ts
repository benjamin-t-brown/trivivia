import { Request } from 'express';
import { Server } from 'socket.io';
import { IoSession } from './middlewares/ioSessionMemory';
export interface ApiRequest extends Request {
  session: any;
  userId: string | undefined;
  requestId: string;
  liveTeamId?: string;
  liveSpectateId?: string;
  io: Server;
  ioSessions: IoSession[];
}
