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

export const initLiveQuizControllers = (router: Router) => {
  const liveQuizService = new LiveQuizService();

  registerGet(
    router,
    '/api/live/:liveQuizUserFriendlyId',
    async function getPublicLiveQuizState(
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

      if (liveSpectateId) {
        const state = await liveQuizService.getPublicLiveQuizState(
          liveQuiz,
          '',
          {
            ignoreTeamId: true,
          }
        );
        return state;
      } else if (liveTeamId) {
        const state = await liveQuizService.getPublicLiveQuizState(
          liveQuiz,
          liveTeamId
        );
        return state;
      }

      return undefined;
    }
  );

  registerGet(
    router,
    '/api/live/:liveQuizUserFriendlyId/meta',
    async function getPublicLiveQuizStateMeta(params: {
      liveQuizUserFriendlyId: string;
    }) {
      const liveQuiz = await liveQuizService.findLiveQuizByUserFriendlyId(
        params.liveQuizUserFriendlyId
      );

      if (!liveQuiz) {
        logger.error(
          'No live quiz found with id=' + params.liveQuizUserFriendlyId
        );
        return undefined;
      }

      const state = await liveQuizService.getPublicLiveQuizStateMeta(liveQuiz);

      return state;
    }
  );

  registerPost(
    router,
    '/api/live/:liveQuizUserFriendlyId/join',
    async function joinLiveQuiz(
      params: { liveQuizUserFriendlyId: string },
      body: { teamName: string; numberOfPlayers: number; spectate: boolean }
    ) {
      const { teamName, numberOfPlayers, spectate } = body;

      if (spectate) {
        return {
          id: randomUUID(),
        };
      }

      if (!validateString(teamName, 3, 40)) {
        throw new InvalidInputError('Not a valid name.');
      }
      if (numberOfPlayers < 1) {
        throw new InvalidInputError('Not a valid number of players.');
      }

      return (
        await liveQuizService.joinQuiz(params.liveQuizUserFriendlyId, {
          teamName,
          numberOfPlayers,
        })
      )?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/live/:liveQuizUserFriendlyId/join',
    async function joinLiveQuiz(
      params: { liveQuizUserFriendlyId: string },
      body: { teamName: string; numberOfPlayers: number },
      context
    ) {
      const { teamName, numberOfPlayers } = body;

      const { liveTeamId } = context;
      if (!liveTeamId) {
        return undefined;
      }

      if (!validateString(teamName, 3, 40)) {
        throw new InvalidInputError('Not a valid name.');
      }
      if (numberOfPlayers < 1) {
        throw new InvalidInputError('Not a valid number of players.');
      }

      return (
        await liveQuizService.updateQuizTeam(
          params.liveQuizUserFriendlyId,
          liveTeamId,
          {
            teamName,
            numberOfPlayers,
          }
        )
      )?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/live/:liveQuizUserFriendlyId/submit',
    async function submitAnswersToLiveQuiz(
      params: {
        liveQuizUserFriendlyId: string;
      },
      body: {
        submittedAnswers: Record<string, AnswerState>;
        didJoker: boolean;
      },
      context
    ) {
      const { liveTeamId } = context;
      if (!liveTeamId) {
        return undefined;
      }

      const liveQuiz = await liveQuizService.findLiveQuizByUserFriendlyId(
        params.liveQuizUserFriendlyId
      );

      if (!liveQuiz) {
        logger.error(
          'No live quiz found with id=' + params.liveQuizUserFriendlyId
        );
        return undefined;
      }

      const { submittedAnswers, didJoker } = body;
      if (!validateAnswersSubmitted(submittedAnswers)) {
        throw new InvalidInputError('Not a valid answers submission.');
      }

      await liveQuizService.submitAnswersForTeamInCurrentRound(liveTeamId, {
        submittedAnswers,
        didJoker,
      });

      const state = await liveQuizService.getPublicLiveQuizState(
        liveQuiz,
        liveTeamId
      );

      return state;
    }
  );
};
