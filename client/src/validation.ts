import { QuizTemplateResponse } from 'shared/responses';

export const quizTemplateIsReady = (t: QuizTemplateResponse) => {
  return t.roundOrder.length === t.numRounds;
};
