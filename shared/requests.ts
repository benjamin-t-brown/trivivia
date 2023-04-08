import { AnswerBoxType } from './responses';

export interface QuizTemplateRequest {
  name: string;
  numRounds: number;
}

export interface RoundTemplateRequest {
  quizTemplateId: string;
  title: string;
  description?: string;
}

export interface QuestionTemplateRequest {
  roundTemplateId: string;
  text: string;
  answers: string;
  answerType: AnswerBoxType;
  orderMatters: boolean;
}
