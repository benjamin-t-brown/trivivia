import { Router } from 'express';
import {
  InvalidInputError,
  registerDelete,
  registerGet,
  registerPost,
  registerPut,
} from '../routing';
import { TemplateService } from '../services/TemplateService';
import { validateAnswerType, validateInt, validateString } from '../validators';
import {
  QuestionTemplateRequest,
  QuizTemplateRequest,
  RoundTemplateRequest,
} from 'shared/requests';

export const initTemplateControllers = (router: Router) => {
  const templateService = new TemplateService();

  registerGet(
    router,
    '/api/template/all/quiz',
    async function getQuizTemplateList(_, __, context) {
      const quizTemplates =
        await templateService.findAllQuizTemplatesByAccountId(context.userId);

      return quizTemplates.map(t => t.getResponseJson());
    }
  );

  registerGet(
    router,
    '/api/template/all/round/:id',
    async function getRoundTemplateList(params) {
      const roundTemplates =
        await templateService.findAllRoundTemplatesByQuizTemplateId(params.id);
      return roundTemplates?.map(t => t.getResponseJson());
    }
  );

  registerGet(
    router,
    '/api/template/all/question/:id',
    async function getQuestionTemplateList(params) {
      const questionTemplates =
        await templateService.findAllQuestionTemplatesByRoundTemplateId(
          params.id
        );
      return questionTemplates?.map(t => t.getResponseJson());
    }
  );

  registerPost(
    router,
    '/api/template/quiz',
    async function createQuizTemplate(_, body: QuizTemplateRequest, context) {
      const { name, numRounds, notes } = body;
      if (!validateString(name)) {
        throw new InvalidInputError('Not a valid name.');
      }
      if (!validateInt(numRounds, 1, 100)) {
        throw new InvalidInputError('Not a number of rounds.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const quizTemplate = await templateService.createQuizTemplate(
        {
          name,
          numRounds,
          notes,
        },
        context
      );
      if (!quizTemplate) {
        return;
      }

      return quizTemplate.getResponseJson();
    }
  );

  registerGet(
    router,
    '/api/template/quiz/:id',
    async function getQuizTemplate(params) {
      const quizTemplate = await templateService.findQuizById(params.id);
      return quizTemplate?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/template/quiz/:id',
    async function updateQuizTemplate(params, body: QuizTemplateRequest) {
      const { name, numRounds, notes } = body;
      if (!validateString(name)) {
        throw new InvalidInputError('Not a valid name.');
      }
      if (!validateInt(numRounds, 1, 100)) {
        throw new InvalidInputError('Not a number of rounds.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const quizTemplate = await templateService.updateQuizTemplate({
        id: params.id,
        name,
        numRounds,
        notes,
      });
      if (!quizTemplate) {
        return;
      }

      return quizTemplate.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/template/quiz/:id/reorder',
    async function updateQuizTemplateRoundOrder(
      params,
      body: { roundOrder: string[] }
    ) {
      const { roundOrder } = body;

      const quizTemplate = await templateService.reorderRoundsInQuiz({
        id: params.id,
        newOrder: roundOrder,
      });
      if (!quizTemplate) {
        return;
      }

      return quizTemplate.getResponseJson();
    }
  );

  registerDelete(
    router,
    '/api/template/quiz/:id',
    async function deleteQuizTemplate(params) {
      const quizTemplate = await templateService.deleteQuizTemplate({
        id: params.id,
      });

      if (!quizTemplate) {
        return;
      }

      return quizTemplate.getResponseJson();
    }
  );

  registerPost(
    router,
    '/api/template/round',
    async function createRoundTemplate(_, body: RoundTemplateRequest) {
      const { title, description, quizTemplateId, notes } = body;
      if (!validateString(quizTemplateId)) {
        throw new InvalidInputError('Not a valid quizTemplateId.');
      }
      if (!validateString(title)) {
        throw new InvalidInputError('Not a valid title.');
      }
      if (!validateString(description ?? '', 0, 1000)) {
        throw new InvalidInputError('Not a valid description.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const roundTemplate = await templateService.createRoundTemplate({
        quizTemplateId,
        title,
        description,
        notes,
      });
      if (!roundTemplate) {
        return;
      }

      return roundTemplate.getResponseJson();
    }
  );

  registerGet(
    router,
    '/api/template/round/:id',
    async function getRoundTemplate(params) {
      const roundTemplate = await templateService.findRoundById(params.id);
      // console.log('GET ROUND TEMPLATE', roundTemplate);
      return roundTemplate?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/template/round/:id',
    async function updateRoundTemplate(
      params,
      body: {
        title: string;
        description: string;
        notes?: string;
      }
    ) {
      const { title, description, notes } = body;
      if (!validateString(title)) {
        throw new InvalidInputError('Not a valid title.');
      }
      if (description && !validateString(description, 0, 1000)) {
        throw new InvalidInputError('Not a valid description.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const roundTemplate = await templateService.updateRoundTemplate({
        roundTemplateId: params.id,
        title,
        description,
        notes,
      });
      if (!roundTemplate) {
        return;
      }

      return roundTemplate.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/template/round/:id/reorder',
    async function updateRoundTemplateQuizOrder(
      params,
      body: { questionOrder: string[] }
    ) {
      const { questionOrder } = body;

      const roundTemplate = await templateService.reorderQuestionsInRound({
        id: params.id,
        newOrder: questionOrder,
      });
      if (!roundTemplate) {
        return;
      }

      return roundTemplate.getResponseJson();
    }
  );

  registerDelete(
    router,
    '/api/template/round/:roundId',
    async function deleteRoundTemplate(params) {
      const roundTemplate = await templateService.deleteRoundTemplate({
        roundId: params.roundId,
      });

      if (!roundTemplate) {
        return;
      }

      return roundTemplate.getResponseJson();
    }
  );

  registerPost(
    router,
    '/api/template/question',
    async function createQuestionTemplate(_, body: QuestionTemplateRequest) {
      const {
        roundTemplateId,
        text,
        answers,
        answerType,
        orderMatters,
        notes,
      } = body;
      if (!validateString(roundTemplateId)) {
        throw new InvalidInputError('Not valid roundTemplateId.');
      }
      if (!validateString(text, 0, 500)) {
        throw new InvalidInputError('Not valid text.');
      }
      if (!validateString(answers)) {
        throw new InvalidInputError('Not valid answers.');
      }
      if (!validateAnswerType(answerType)) {
        throw new InvalidInputError('Not valid answerType.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const questionTemplate = await templateService.createQuestionTemplate({
        roundTemplateId,
        text,
        answers,
        answerType,
        orderMatters,
        notes,
      });
      if (!questionTemplate) {
        return;
      }

      return questionTemplate.getResponseJson();
    }
  );

  registerGet(
    router,
    '/api/template/question/:id',
    async function getQuestionTemplate(params) {
      const questionTemplate = await templateService.findQuestionById(
        params.id
      );
      return questionTemplate?.getResponseJson();
    }
  );

  registerPut(
    router,
    '/api/template/question/:questionId',
    async function updateQuestionTemplate(
      params,
      body: QuestionTemplateRequest
    ) {
      const { text, answers, answerType, orderMatters, isBonus, notes } = body;
      if (!validateString(text, 0, 500)) {
        throw new InvalidInputError('Not valid text.');
      }
      if (!validateString(answers)) {
        throw new InvalidInputError('Not valid answers.');
      }
      if (!validateAnswerType(answerType)) {
        throw new InvalidInputError('Not valid answers.');
      }
      if (notes && !validateString(notes, 0, 1000)) {
        throw new InvalidInputError('Not valid notes.');
      }

      const questionTemplate = await templateService.updateQuestionTemplate({
        questionTemplateId: params.questionId,
        text,
        answers,
        answerType,
        orderMatters,
        isBonus,
        notes,
      });
      if (!questionTemplate) {
        return;
      }

      return questionTemplate.getResponseJson();
    }
  );

  registerDelete(
    router,
    '/api/template/question/:id',
    async function deleteRoundTemplate(params) {
      const questionTemplate = await templateService.deleteQuestionTemplate({
        questionId: params.id,
      });

      if (!questionTemplate) {
        return;
      }

      return questionTemplate.getResponseJson();
    }
  );
};
