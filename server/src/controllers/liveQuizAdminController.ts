import { Router } from 'express';
import {
  InvalidInputError,
  RouteContext,
  registerDelete,
  registerGet,
  registerPost,
  registerPut,
  registerRoute,
} from '../routing';
import { LiveQuizService } from '../services/LiveQuizService';
import { LiveQuizState, LiveRoundState } from 'shared';
import { validateString } from '../validators';
import { GradeInputState } from '@shared/requests';
import logger from '../logger';

export const initLiveQuizAdminControllers = (router: Router) => {
  const liveQuizService = new LiveQuizService();

  registerGet(
    router,
    '/api/live-quiz-admin/all',
    async function getLiveQuizTemplateList(_, __, context) {
      return await liveQuizService.findAllLiveQuizzesByAccountId(
        context.userId
      );
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
        roundNumber?: number;
        questionNumber?: number;
        roundAnswerNumber?: number;
        quizState?: LiveQuizState;
        roundState?: LiveRoundState;
        reset?: boolean;
      },
      context
    ) {
      const name = body.name;

      if (name) {
        if (!validateString(name)) {
          throw new InvalidInputError('Not a valid name.');
        }
        (
          await liveQuizService.setNameForLiveQuiz(params.liveQuizId, name)
        )?.getResponseJson();
      }
      if (body.quizState != undefined) {
        if (Object.values(LiveQuizState).includes(body.quizState)) {
          (
            await liveQuizService.setQuizState(
              params.liveQuizId,
              body.quizState
            )
          )?.getResponseJson();
        }
      }
      if (body.roundState !== undefined) {
        if (Object.values(LiveRoundState).includes(body.roundState)) {
          (
            await liveQuizService.setQuizRoundState(
              params.liveQuizId,
              body.roundState
            )
          )?.getResponseJson();
        }
      }
      if (body.roundNumber !== undefined) {
        if (body.roundNumber >= 0) {
          (
            await liveQuizService.setCurrentRoundForLiveQuiz(
              params.liveQuizId,
              body.roundNumber
            )
          )?.getResponseJson();
        }
      }
      if (body.questionNumber !== undefined) {
        if (body.questionNumber >= 0) {
          (
            await liveQuizService.setCurrentQuestionForLiveQuiz(
              params.liveQuizId,
              body.questionNumber
            )
          )?.getResponseJson();
        }
      }
      if (body.roundAnswerNumber !== undefined) {
        if (body.roundAnswerNumber >= 0) {
          (
            await liveQuizService.setCurrentRoundAnswerForLiveQuiz(
              params.liveQuizId,
              body.roundAnswerNumber
            )
          )?.getResponseJson();
        }
      }
      if (body.reset) {
        (
          await liveQuizService.resetLiveQuiz(params.liveQuizId)
        )?.getResponseJson();
      }
      if (body.reImportQuizTemplate) {
        (
          await liveQuizService.reImportQuizTemplateForLiveQuiz(
            params.liveQuizId,
            {
              force: body.forceReImport,
            }
          )
        )?.getResponseJson();
      }

      const ret = (
        await liveQuizService.findLiveQuizById(params.liveQuizId, {
          includeSubmitted: true,
        })
      )?.getResponseJson();
      emitStateUpdate(context, ret?.userFriendlyId ?? '');

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

  registerPut(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId/grade',
    async function submitGradesForQuiz(
      params: { liveQuizId: string },
      body: { gradeState: GradeInputState }
    ) {
      return await liveQuizService.submitGrades(
        params.liveQuizId,
        body.gradeState
      );
    }
  );

  registerPut(
    router,
    '/api/live-quiz-admin/quiz/:liveQuizId/update-scores',
    async function updateScoresForQuiz(
      params: { liveQuizId: string },
      body: { upToRoundNum: number },
      context
    ) {
      if (isNaN(parseInt(String(body.upToRoundNum))) || body.upToRoundNum < 0) {
        throw new InvalidInputError('Not a valid upToRoundNum.');
      }

      const ret = (
        await liveQuizService.findLiveQuizById(params.liveQuizId, {
          includeSubmitted: true,
        })
      )?.getResponseJson();

      emitStateUpdate(context, ret?.userFriendlyId ?? '');

      return await liveQuizService.updateAllScores(
        params.liveQuizId,
        body.upToRoundNum
      );
    }
  );

  registerRoute(
    router,
    'get',
    '/api/live-quiz-admin/quiz/:liveQuizId/export',
    async function exportQuizTemplate(params, _, context) {
      const str = JSON.stringify(
        await liveQuizService.exportLiveQuiz(params.liveQuizId)
      );

      if (context.res) {
        context.res.setHeader('Content-Type', 'text/json');
        context.res.setHeader(
          'Content-Disposition',
          'attachment; filename=export.json'
        );
      }

      return str;
    },
    true
  );

  const emitStateUpdate = (
    context: RouteContext,
    userFriendlyQuizId: string
  ) => {
    logger.info('Emitting state update event to all connected clients.');
    context.ioSessions
      .filter(session => {
        return session.liveQuizUserFriendlyId === userFriendlyQuizId;
      })
      .forEach(session => {
        session.socket.emit('state', '');
      });
  };
};
