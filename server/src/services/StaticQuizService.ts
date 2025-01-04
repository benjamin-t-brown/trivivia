import { randomUUID } from 'crypto';
import { Account } from '../models/Account';
import { LiveQuiz } from '../models/LiveQuiz';
import { LiveQuizRoundAnswers } from '../models/LiveQuizRoundAnswers';
import { LiveQuizTeam } from '../models/LiveQuizTeam';
import {
  AnswerState,
  AnswerStateGraded,
  AnswerStateStats,
  LiveQuizPublicQuestionResponse,
  LiveQuizPublicStateResponse,
  LiveQuizRoundAnswersResponse,
  LiveQuizState,
  LiveQuizTeamResponse,
  LiveRoundState,
  QuizStats,
  QuizTemplateResponse,
  StructuredQuizQuestion,
  StructuredQuizResponse,
  StructuredQuizRound,
  StructuredQuizTeam,
  StructuredQuizTeamAnswersSubmission,
  getNumAnswers,
  getNumCorrectAnswers,
} from 'shared';
import logger from '../logger';
import { TemplateService } from './TemplateService';
import { InvalidInputError } from '../routing';
import { Op } from 'sequelize';
import { QuizTemplate } from '../models/QuizTemplate';
import { customAlphabet } from 'nanoid';
import { GradeInputState } from '@shared/requests';
import { Model } from 'sequelize-typescript';
import { LiveQuizService } from './LiveQuizService';

export class StaticQuizService {
  nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);
  private templateService = new TemplateService();
  setTemplateService(templateService: TemplateService) {
    this.templateService = templateService;
  }
  private liveQuizService = new LiveQuizService();
  setLiveQuizService(liveQuizService: LiveQuizService) {
    this.liveQuizService = liveQuizService;
  }

  async getStaticQuizState(liveQuizUserFriendlyId: string) {
    const liveQuiz = await this.liveQuizService.findLiveQuizByUserFriendlyId(
      liveQuizUserFriendlyId
    );

    const staticQuiz = {

    }

    const quiz = this.getStructuredQuiz(template);
    return quiz;
  }
}
