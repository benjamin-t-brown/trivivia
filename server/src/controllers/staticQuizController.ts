import { Router } from 'express';
import { registerGet } from '../routing';
import { StaticQuizService } from '../services/StaticQuizService';

export const initStaticQuizController = (router: Router) => {
  const staticQuizService = new StaticQuizService();

  registerGet(
    router,
    '/api/static/:liveQuizUserFriendlyId',
    async function getStaticQuiz(params: { liveQuizUserFriendlyId: string }) {
      const staticQuiz = await staticQuizService.getStaticQuiz(
        params.liveQuizUserFriendlyId
      );

      if (!staticQuiz) {
        return undefined;
      }

      return staticQuiz;
    }
  );
};
