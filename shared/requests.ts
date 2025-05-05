import { AnswerBoxType, AnswerStateGraded } from './responses';

export interface QuizTemplateRequest {
  name: string;
  numRounds: number;
  isJoker?: boolean;
  notes?: string;
}

export interface RoundTemplateRequest {
  quizTemplateId: string;
  title: string;
  description?: string;
  notes?: string;
  jokerDisabled?: boolean;
}

export interface QuestionTemplateRequest {
  roundTemplateId: string;
  text: string;
  answers: string;
  answerType: AnswerBoxType;
  orderMatters: boolean;
  isBonus: boolean;
  imageLink?: string;
  notes?: string;
}

// team id -> round id -> question id -> answer state
export type GradeInputState = Record<
  string,
  Record<string, Record<string, AnswerStateGraded>>
>;
