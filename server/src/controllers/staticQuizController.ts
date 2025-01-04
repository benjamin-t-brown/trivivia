import { Router } from 'express';
import {
  InvalidInputError,
  registerGet,
  registerPost,
  registerPut,
} from '../routing';
import { LiveQuizService } from '../services/LiveQuizService';
import { AnswerState } from 'shared';
import { validateAnswersSubmitted, validateString } from '../validators';
import logger from '../logger';
import { randomUUID } from 'crypto';

export const initStaticQuizController = (router: Router) => {
  const liveQuizService = new LiveQuizService();

  registerGet(
    router,
    '/api/static/:liveQuizUserFriendlyId',
    async function getStaticQuiz(
      params: {
        liveQuizUserFriendlyId: string;
      },
      _,
      context
    ) {
      const liveQuiz = await liveQuizService.findLiveQuizByUserFriendlyId(
        params.liveQuizUserFriendlyId
      );

      if (!liveQuiz) {
        return undefined;
      }

      return undefined;
    }
  );

  registerGet(
    router,
    '/api/static/:liveQuizUserFriendlyId/submission',
    async function getStaticQuiz(
      params: {
        liveQuizUserFriendlyId: string;
      },
      _,
      context
    ) {
      const { liveTeamId, liveSpectateId } = context;
      if (!liveTeamId && !liveSpectateId) {
        return undefined;
      }

      const liveQuiz = await liveQuizService.findLiveQuizByUserFriendlyId(
        params.liveQuizUserFriendlyId
      );

      if (!liveQuiz) {
        return undefined;
      }

      return undefined;
    }
  );
};
