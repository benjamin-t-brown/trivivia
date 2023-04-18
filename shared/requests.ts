import { AnswerBoxType, AnswerStateGraded } from './responses';

export interface QuizTemplateRequest {
  name: string;
  numRounds: number;
  notes?: string;
}

export interface RoundTemplateRequest {
  quizTemplateId: string;
  title: string;
  description?: string;
  notes?: string;
}

export interface QuestionTemplateRequest {
  roundTemplateId: string;
  text: string;
  answers: string;
  answerType: AnswerBoxType;
  orderMatters: boolean;
  notes?: string;
}

export type GradeInputState = Record<
  string,
  Record<string, Record<string, AnswerStateGraded>>
>;
