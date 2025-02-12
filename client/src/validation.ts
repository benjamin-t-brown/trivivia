import { QuizTemplateResponse } from 'shared/responses';

export const quizTemplateIsReady = (t: QuizTemplateResponse) => {
  // TODO This used to check how many rounds against the total rounds specified in the quiz.
  // This doesn't matter though, a quiz should be run regardless.
  return true;
};
