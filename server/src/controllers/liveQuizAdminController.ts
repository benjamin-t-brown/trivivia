import { Router } from 'express';
import {
  InvalidInputError,
  registerDelete,
  registerGet,
  registerPost,
  registerPut,
} from '../routing';
import { LiveQuizService } from '../services/LiveQuizService';
import { LiveQuizResponse, LiveQuizState, LiveRoundState } from 'shared';
import { validateString } from '../validators';

export const initLiveQuizAdminControllers = (router: Router) => {
  const liveQuizService = new LiveQuizService();

  registerGet(
    router,
    '/api/live-quiz-admin/all',
    async function getLiveQuizTemplateList(_, __, context) {
      return (
        await liveQuizService.findAllLiveQuizzesByAccountId(context.userId)
      )?.map(t => t.getResponseJson());
    }
  );

  registerGet(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId',
    async function getLiveQuizTemplate(params: { liveQuizId: string }) {
      return (
        await liveQuizService.findLiveQuizById(params.liveQuizId, {
          includeSubmitted: true,
        })
      )?.getResponseJson();
    }
  );

  registerPost(
    router,
    '/api/live-quiz-admin/create/:quizTemplateId',
    async function createNewLiveQuiz(
      params: { quizTemplateId: string },
      body: { name: string }
    ) {
      const name = body.name;

      if (!validateString(name)) {
        throw new InvalidInputError('Not a valid name.');
      }

      return (
        await liveQuizService.createLiveQuiz(params.quizTemplateId, { name })
      )?.getResponseJson();
    }
  );

  registerDelete(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId',
    async function deleteLiveQuiz(params: { liveQuizId: string }) {
      return (
        await liveQuizService.deleteLiveQuiz(params.liveQuizId)
      )?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId/update',
    async function setRoundIndex(
      params: { liveQuizId: string },
      body: {
        name?: string;
        reImportQuizTemplate?: boolean;
        forceReImport?: boolean;
        roundIndex?: number;
        questionIndex?: number;
        quizState?: LiveQuizState;
        roundState?: LiveRoundState;
        reset?: boolean;
      }
    ) {
      const name = body.name;

      let ret: undefined | LiveQuizResponse;

      if (name) {
        if (!validateString(name)) {
          throw new InvalidInputError('Not a valid name.');
        }
        ret = (
          await liveQuizService.setNameForLiveQuiz(params.liveQuizId, name)
        )?.getResponseJson();
      }
      if (body.quizState != undefined) {
        if (Object.values(LiveQuizState).includes(body.quizState)) {
          ret = (
            await liveQuizService.setQuizState(
              params.liveQuizId,
              body.quizState
            )
          )?.getResponseJson();
        }
      }
      if (body.roundState !== undefined) {
        if (Object.values(LiveRoundState).includes(body.roundState)) {
          ret = (
            await liveQuizService.setQuizRoundState(
              params.liveQuizId,
              body.roundState
            )
          )?.getResponseJson();
        }
      }
      if (body.roundIndex !== undefined) {
        if (body.roundIndex >= 0) {
          ret = (
            await liveQuizService.setCurrentRoundForLiveQuiz(
              params.liveQuizId,
              body.roundIndex
            )
          )?.getResponseJson();
        }
      }
      if (body.questionIndex !== undefined) {
        if (body.questionIndex >= 0) {
          ret = (
            await liveQuizService.setCurrentQuestionForLiveQuiz(
              params.liveQuizId,
              body.questionIndex
            )
          )?.getResponseJson();
        }
      }
      if (body.reset) {
        ret = (
          await liveQuizService.resetLiveQuiz(params.liveQuizId)
        )?.getResponseJson();
      }
      if (body.reImportQuizTemplate) {
        ret = (
          await liveQuizService.reImportQuizTemplateForLiveQuiz(
            params.liveQuizId,
            {
              force: body.forceReImport,
            }
          )
        )?.getResponseJson();
      }

      if (!ret) {
        throw new InvalidInputError('Not valid input to update live quiz.');
      }

      return ret;
    }
  );

  registerDelete(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId/team/:teamId',
    async function deleteLiveQuizTeam(params: {
      liveQuizId: string;
      teamId: string;
    }) {
      return (
        await liveQuizService.deleteLiveQuizTeam(params.teamId)
      )?.getResponseJson();
    }
  );
};
