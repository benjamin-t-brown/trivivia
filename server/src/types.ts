import { Request } from 'express';

export interface ApiRequest extends Request {
  session: any;
  userId: string | undefined;
  requestId: string;
  liveTeamId?: string;
}
