// Only put types in this file, and don't include any server side node_modules.  This file
// is included on the client as well

interface CreateUpdateDelete {
  updatedOn: string;
  creationDate: string;
  deletionDate?: string;
}

export interface AccountResponse extends CreateUpdateDelete {
  id: string;
  email: string;
  quizTemplates?: QuizTemplateResponse[];
}

export interface QuizTemplateResponse extends CreateUpdateDelete {
  id: string;
  accountId: string;
  account: AccountResponse;
  roundOrder: string[];
  name: string;
  rounds?: RoundTemplateResponse[];
  numRounds: number;
}

export interface RoundTemplateResponse extends CreateUpdateDelete {
  id: string;
  quizTemplateId: string;
  quizTemplate: QuizTemplateResponse;
  title: string;
  description: string;
  questionOrder: string[];
  questions?: QuestionTemplateResponse[];
}

export enum AnswerBoxType {
  INPUT1 = 'input1',
  INPUT2 = 'input2',
  INPUT3 = 'input3',
  INPUT4 = 'input4',
  INPUT8 = 'input8',
  INPUT16 = 'input16',
  INPUT16_WITH_EXTRA = 'input16_with_extra',
  RADIO2 = 'radio2',
  RADIO3 = 'radio3',
  RADIO4 = 'radio4',
  RADIO8 = 'radio8',
}

export interface QuestionTemplateResponse extends CreateUpdateDelete {
  id: string;
  roundTemplateId: string;
  roundTemplate: RoundTemplateResponse;
  text: string;
  answers: AnswerState;
  answerType: AnswerBoxType;
  imageLink?: string;
  orderMatters: boolean;
  isBonus: boolean;
}

export type AnswerState = {
  answer1?: string;
  answer2?: string;
  answer3?: string;
  answer4?: string;
  answer5?: string;
  answer6?: string;
  answer7?: string;
  answer8?: string;
  answer9?: string;
  answer10?: string;
  answer11?: string;
  answer12?: string;
  answer13?: string;
  answer14?: string;
  answer15?: string;
  answer16?: string;
  radio1?: string;
  radio2?: string;
  radio3?: string;
  radio4?: string;
  radio5?: string;
  radio6?: string;
  radio7?: string;
  radio8?: string;
};

export type AnswerStateGraded = Record<keyof AnswerState, boolean>;

export const stringToAnswerState = (s?: string): AnswerState => {
  try {
    const answersState = s ? JSON.parse(s) : {};
    return answersState;
  } catch (e) {
    return {
      answer1: '',
    };
  }
};

export const answerStateToString = (s: AnswerState) => {
  return JSON.stringify(s);
};

export const getNumAnswers = (answerType: AnswerBoxType) => {
  switch (answerType) {
    case AnswerBoxType.RADIO2:
    case AnswerBoxType.RADIO3:
    case AnswerBoxType.RADIO4:
    case AnswerBoxType.RADIO8:
    case AnswerBoxType.INPUT1:
      return 1;
    case AnswerBoxType.INPUT2:
      return 2;
    case AnswerBoxType.INPUT3:
      return 3;
    case AnswerBoxType.INPUT4:
      return 4;
    case AnswerBoxType.INPUT8:
      return 8;
    case AnswerBoxType.INPUT16:
    case AnswerBoxType.INPUT16_WITH_EXTRA:
      return 16;
  }
  return 1;
};

export const getNumRadioBoxes = (answerType: AnswerBoxType) => {
  switch (answerType) {
    case AnswerBoxType.RADIO2:
      return 2;
    case AnswerBoxType.RADIO3:
      return 3;
    case AnswerBoxType.RADIO4:
      return 4;
    case AnswerBoxType.RADIO8:
      return 8;
    default:
      return 0;
  }
  return 0;
};

export enum LiveQuizState {
  NOT_STARTED = 'not_started',
  STARTED_WAITING = 'started_waiting',
  STARTED_IN_ROUND = 'started_in_round',
  COMPLETED = 'completed',
  HALTED = 'halted',
}

export enum LiveRoundState {
  NOT_STARTED = 'not_started',
  STARTED_ACCEPTING_ANSWERS = 'started_accepting_answers',
  STARTED_NOT_ACCEPTING_ANSWERS = 'started_not_accepting_answers',
  COMPLETED = 'completed',
  SHOWING_ANSWERS = 'showing_answers',
  HALTED = 'halted',
}

export interface LiveQuizResponse extends CreateUpdateDelete {
  id: string;
  userFriendlyId: string;
  quizTemplateId: string;
  quizTemplateJson: QuizTemplateResponse;
  name: string;
  liveQuizTeams: LiveQuizTeamResponse[];
  quizState: LiveQuizState;
  roundState: LiveRoundState;
  currentRoundNumber: number;
  currentQuestionNumber: number;
  startedAt: string;
  completedAt: string;
}

export interface LiveQuizTeamResponse extends CreateUpdateDelete {
  id: string;
  liveQuiz: LiveQuizResponse;
  // teamSessions: LiveQuizTeamSession[];
  liveQuizRoundAnswers: LiveQuizRoundAnswersResponse[];
  teamName: string;
  numberOfPlayers: number;
}

export interface LiveQuizRoundAnswersResponse extends CreateUpdateDelete {
  id: string;
  quizTeam: LiveQuizResponse;
  roundId: string;
  answers: Record<string, AnswerState>;
  answersGraded: Record<string, AnswerStateGraded>;
  didJoker: boolean;
}

export interface LiveQuizPublicResponse extends CreateUpdateDelete {
  id: string;
  userFriendlyId: string;
  quizTemplateId: string;
  name: string;
  quizState: LiveQuizState;
  roundState: LiveRoundState;
  currentRoundNumber: number;
  currentQuestionNumber: number;
  startedAt: string;
  completedAt: string;
}

export interface LiveQuizPublicQuestionResponse {
  text: string;
  answerType: AnswerBoxType;
  answers?: AnswerState;
  imageLink?: string;
}

export interface LiveQuizPublicStateResponse {
  quiz: LiveQuizPublicResponse;
  teamId?: string;
  teams: LiveQuizTeamResponse[];
  teamsScores: {
    teamId: string;
    score: number;
  }[];
  round?: {
    id: string;
    roundNumber: number;
    questionNumber: number;
    totalNumberOfQuestions: number;
    title: string;
    description: string;
    answersSubmitted?: Record<string, AnswerState>;
    answersGraded?: Record<string, AnswerStateGraded>;
    questions: LiveQuizPublicQuestionResponse[];
  };
}
