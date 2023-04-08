import { randomUUID } from 'crypto';
import { Account } from '../models/Account';
import { LiveQuiz } from '../models/LiveQuiz';
import { LiveQuizRoundAnswers } from '../models/LiveQuizRoundAnswers';
import { LiveQuizTeam } from '../models/LiveQuizTeam';
import {
  AnswerState,
  LiveQuizPublicQuestionResponse,
  LiveQuizPublicStateResponse,
  LiveQuizState,
  LiveRoundState,
  QuizTemplateResponse,
} from 'shared';
import logger from '../logger';
import { TemplateService } from './TemplateService';
import { InvalidInputError } from '../routing';
import { Op } from 'sequelize';
import { QuizTemplate } from '../models/QuizTemplate';
import { customAlphabet } from 'nanoid';

export class LiveQuizService {
  nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

  async assertQuiz(liveQuizId: string) {
    const liveQuiz = await this.findLiveQuizById(liveQuizId);

    if (!liveQuiz) {
      logger.error(
        `Cannot find live quiz, no live quiz found with id=${liveQuizId}`
      );
      return false;
    }
    return liveQuiz;
  }

  async findLiveQuizById(
    liveQuizId: string,
    args?: { includeSubmitted?: boolean }
  ) {
    if (args?.includeSubmitted) {
      return LiveQuiz.findByPk(liveQuizId, {
        include: [{ model: LiveQuizTeam, include: [LiveQuizRoundAnswers] }],
      });
    } else {
      return LiveQuiz.findByPk(liveQuizId, {
        include: [LiveQuizTeam],
      });
    }
  }

  async findAllLiveQuizzesByAccountId(
    accountId: string,
    args?: {
      includeCompleted: boolean;
    }
  ): Promise<LiveQuiz[]> {
    const include: Record<string, any>[] = [
      {
        model: LiveQuiz,
        as: 'liveQuizzes',
        where: {
          quizState: {
            [Op.ne]: 'completed',
          },
        },
      },
    ];
    if (args?.includeCompleted) {
      delete include[0].where;
    }

    const account = await Account.findByPk(accountId, {
      include,
      order: [[{ model: LiveQuiz, as: 'liveQuizzes' }, 'updatedOn', 'DESC']],
    });

    return account?.liveQuizzes ?? [];
  }

  async findLiveQuizByUserFriendlyId(
    userFriendlyId: string
  ): Promise<LiveQuiz | undefined> {
    const ret = await LiveQuiz.findAll({
      include: [{ model: LiveQuizTeam, as: 'liveQuizTeams' }],
      where: {
        userFriendlyId,
      },
    });
    return ret?.[0];
  }

  async findLiveQuizTeamById(liveQuizTeamId: string) {
    return LiveQuizTeam.findByPk(liveQuizTeamId, {
      include: [LiveQuiz],
    });
  }

  async findAllLiveQuizRoundAnswersForTeam(liveQuizTeamId: string) {
    const liveQuizTeam = await LiveQuizTeam.findByPk(liveQuizTeamId, {
      include: [{ model: LiveQuizRoundAnswers, as: 'liveQuizRoundAnswers' }],
    });

    if (!liveQuizTeam) {
      logger.error(
        `Cannot getAnswerSubmissionsForTeam, no team found with id=${liveQuizTeamId}`
      );
      return undefined;
    }

    return liveQuizTeam.liveQuizRoundAnswers;
  }

  async findLiveQuizRoundAnswerByTeamIdAndRoundId(
    liveQuizTeamId: string,
    roundId: string
  ): Promise<LiveQuizRoundAnswers | undefined> {
    const liveQuizRoundAnswers = await LiveQuizRoundAnswers.findAll({
      where: {
        liveQuizTeamId,
        roundId,
      },
    });
    return liveQuizRoundAnswers?.[0];
  }

  async createLiveQuiz(quizTemplateId: string, args: { name: string }) {
    const templateService = new TemplateService();

    const quizTemplate = await templateService.findQuizById(quizTemplateId, {
      includeAll: true,
    });

    if (!quizTemplate) {
      logger.error(
        `Error creating live quiz, could not find quiz template with id=${quizTemplateId}`
      );
      return undefined;
    }

    if (quizTemplate.rounds.length < quizTemplate.numRounds) {
      throw new InvalidInputError(
        'Error creating live quiz, the provided quiz template is not valid.'
      );
    }

    const liveQuiz = new LiveQuiz({
      id: randomUUID(),
      userFriendlyId: this.nanoid(),
      name: args.name,
      accountId: quizTemplate.account.id,
      quizTemplateId: quizTemplate.id,
      quizTemplateJson: JSON.stringify(quizTemplate.getResponseJson()),
      quizState: LiveQuizState.NOT_STARTED,
      roundState: LiveRoundState.NOT_STARTED,
      currentRoundNumber: 0,
      currentQuestionNumber: 0,
    });

    await liveQuiz.save();

    return this.findLiveQuizById(liveQuiz.id);
  }

  async reImportQuizTemplateForLiveQuiz(
    liveQuizId: string,
    args: {
      force?: boolean;
    }
  ) {
    logger.info('Re-importing quiz template for live quiz: ' + liveQuizId);

    const liveQuiz = await LiveQuiz.findByPk(liveQuizId, {
      include: [
        { model: QuizTemplate },
        { model: LiveQuizTeam, include: [LiveQuizRoundAnswers] },
      ],
    });
    if (!liveQuiz) {
      logger.error(
        `Cannot find live quiz, no live quiz found with id=${liveQuizId}`
      );
      return undefined;
    }

    const templateService = new TemplateService();
    const quizTemplate = await templateService.findQuizById(
      liveQuiz.quizTemplate.id,
      {
        includeAll: true,
      }
    );

    if (!quizTemplate) {
      logger.error(
        `Cannot find quiz template inside live quiz id=${liveQuizId}, no quizTemplate found id=${liveQuiz.quizTemplate.id}`
      );
      throw new Error('Could not reImport quiz template for live quiz.');
    }

    liveQuiz.quizTemplateJson = JSON.stringify(quizTemplate.getResponseJson());

    let shouldReset = false;
    liveQuiz.liveQuizTeams.forEach(team => {
      team.liveQuizRoundAnswers.forEach(roundAnswers => {
        if (!quizTemplate.rounds.find(r => r.id === roundAnswers.roundId)) {
          const errMessage =
            `Round template roundTemplateId=${roundAnswers.roundId} ` +
            `exists in the team answers but not in the quiz template to be imported quizTemplateId=${quizTemplate.id}. ` +
            `quiz rounds=${quizTemplate.rounds.map(r => r.id).join(', ')}`;
          if (args.force) {
            shouldReset = true;
            logger.error(errMessage);
          } else {
            throw new Error(
              'Cannot reImportQuizTemplateForLiveQuiz. ' + errMessage
            );
          }
        }
      });
    });

    await liveQuiz.save();

    if (shouldReset) {
      return await this.resetLiveQuiz(liveQuizId);
    } else {
      return (await this.findLiveQuizById(liveQuizId)) ?? undefined;
    }
  }

  async resetLiveQuiz(liveQuizId: string) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    logger.info(`Resetting live quiz id=${liveQuizId}`);

    liveQuiz.quizState = LiveQuizState.NOT_STARTED;
    liveQuiz.roundState = LiveRoundState.NOT_STARTED;
    liveQuiz.currentRoundNumber = 0;
    liveQuiz.currentQuestionNumber = 0;
    liveQuiz.userFriendlyId = this.nanoid();

    await liveQuiz.save();

    for (let i = 0; i < liveQuiz.liveQuizTeams.length; i++) {
      await liveQuiz.liveQuizTeams[i].destroy();
    }

    return (await this.findLiveQuizById(liveQuizId)) ?? undefined;
  }

  async deleteLiveQuiz(liveQuizId: string) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    await liveQuiz.destroy();

    return liveQuiz;
  }

  async startLiveQuiz(liveQuizId: string) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.quizState = LiveQuizState.STARTED_WAITING;

    return await liveQuiz.save();
  }

  async setNameForLiveQuiz(liveQuizId: string, name: string) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.name = name;

    return await liveQuiz.save();
  }

  async setCurrentRoundForLiveQuiz(liveQuizId: string, roundIndex: number) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.roundState = LiveRoundState.STARTED_NOT_ACCEPTING_ANSWERS;
    liveQuiz.currentRoundNumber = roundIndex;
    liveQuiz.currentQuestionNumber = 0;

    return await liveQuiz.save();
  }

  async setCurrentQuestionForLiveQuiz(
    liveQuizId: string,
    questionIndex: number
  ) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.currentQuestionNumber = questionIndex;

    return await liveQuiz.save();
  }

  async setQuizState(liveQuizId: string, quizState: LiveQuizState) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.quizState = quizState;

    return await liveQuiz.save();
  }

  async setQuizRoundState(liveQuizId: string, roundState: LiveRoundState) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.roundState = roundState;

    return await liveQuiz.save();
  }

  async joinQuiz(
    userFriendlyId: string,
    args: { teamName: string; numberOfPlayers: number }
  ) {
    const liveQuiz = await this.findLiveQuizByUserFriendlyId(userFriendlyId);
    if (!liveQuiz) {
      logger.error(`No quiz exists at user friendly id=${userFriendlyId}`);
      throw new InvalidInputError('No quiz exists at the provided id.');
    }
    if (
      liveQuiz.liveQuizTeams.find(
        t => t.teamName.toLowerCase() === args.teamName.toLowerCase()
      )
    ) {
      logger.error(`Team name already exists: ${args.teamName}`);
      throw new InvalidInputError('Team name already exists.');
    }

    const liveQuizTeam = new LiveQuizTeam({
      id: randomUUID(),
      liveQuizId: liveQuiz.id,
      teamName: args.teamName,
      numberOfPlayers: args.numberOfPlayers,
    });

    const modelsToSave: LiveQuizRoundAnswers[] = [];

    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );
    for (let i = 0; i < quizTemplate.roundOrder.length; i++) {
      const roundTemplateId = quizTemplate.roundOrder[i];
      const round = quizTemplate.rounds?.find(r => r.id === roundTemplateId);
      if (!round) {
        logger.error(
          `Error in joining game for liveQuiz id=${liveQuiz.id}, roundTemplate id=${roundTemplateId} not found in json for quiz.`
        );
        throw new Error('Cannot join quiz.');
      }

      const liveQuizRoundAnswers = new LiveQuizRoundAnswers({
        id: randomUUID(),
        liveQuizTeamId: liveQuizTeam.id,
        roundId: round.id,
        answers: '{}',
        answersGraded: '{}',
        didJoker: false,
      });
      modelsToSave.push(liveQuizRoundAnswers);
    }

    await liveQuizTeam.save();
    for (const model of modelsToSave) {
      await model.save();
    }

    return liveQuizTeam;
  }

  async updateQuizTeam(
    userFriendlyId: string,
    quizTeamId: string,
    args: { teamName: string; numberOfPlayers: number }
  ) {
    const liveQuizTeam = await this.findLiveQuizTeamById(quizTeamId);
    if (!liveQuizTeam) {
      logger.error(`No team exists at team id=${quizTeamId}`);
      throw new InvalidInputError('Team name already exists.');
    }

    const liveQuiz = await this.findLiveQuizByUserFriendlyId(userFriendlyId);
    if (!liveQuiz) {
      logger.error(`No quiz exists at user friendly id=${userFriendlyId}`);
      throw new InvalidInputError('No quiz exists at the provided id.');
    }
    if (
      liveQuiz.liveQuizTeams.find(
        t => t.teamName.toLowerCase() === args.teamName.toLowerCase()
      )
    ) {
      logger.error(`Team name already exists: ${args.teamName}`);
      throw new InvalidInputError('Team name already exists.');
    }
    if (liveQuiz.quizState !== LiveQuizState.NOT_STARTED) {
      logger.error(
        `Cannot change a team name if quiz is started: ${args.teamName}`
      );
      throw new InvalidInputError('Cannot change team name.');
    }

    liveQuizTeam.teamName = args.teamName;
    liveQuizTeam.numberOfPlayers = args.numberOfPlayers;

    await liveQuizTeam.save();
    return liveQuizTeam;
  }

  async deleteLiveQuizTeam(quizTeamId: string) {
    const liveQuizTeam = await this.findLiveQuizTeamById(quizTeamId);
    if (!liveQuizTeam) {
      logger.error(`No team exists at team id=${quizTeamId}`);
      throw new InvalidInputError('Team name already exists.');
    }

    await liveQuizTeam.destroy();

    return liveQuizTeam;
  }

  async getPublicLiveQuizStateMeta(
    liveQuiz: LiveQuiz
  ): Promise<LiveQuizPublicStateResponse | undefined> {
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );
    const roundTemplateId =
      quizTemplate.roundOrder[liveQuiz.currentRoundNumber - 1];
    if (!roundTemplateId || !quizTemplate.rounds) {
      return undefined;
    }

    const teams = (liveQuiz.liveQuizTeams ?? []).map(t => t.getResponseJson());
    const teamsScores = teams.map(t => {
      return {
        teamId: t.id,
        score: 0,
      };
    });

    const quizState: any = liveQuiz.getLiveResponseJson();
    delete quizState.liveQuizTeams;

    return {
      quiz: liveQuiz.getLiveResponseJson(),
      teamId: undefined,
      teams,
      teamsScores,
      round: undefined,
    };
  }

  async getPublicLiveQuizState(
    liveQuiz: LiveQuiz,
    liveQuizTeamId: string,
    args?: {
      forceIncludeAllQuestions?: boolean;
      forceIncludeAnswers?: boolean;
      forceIncludeStatistics?: boolean;
    }
  ): Promise<LiveQuizPublicStateResponse | undefined> {
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );
    const roundTemplateId =
      quizTemplate.roundOrder[liveQuiz.currentRoundNumber - 1];
    if (!roundTemplateId || !quizTemplate.rounds) {
      return undefined;
    }

    const roundTemplate = quizTemplate.rounds.find(
      t => t.id === roundTemplateId
    );
    if (!roundTemplate) {
      logger.error(
        `Error in getCurrentRoundAndQuestions for liveQuiz id=${liveQuiz.id}, roundTemplate id=${roundTemplateId} not found in json for quiz.`
      );
      return undefined;
    }

    const liveQuizRoundAnswers = (
      await this.findAllLiveQuizRoundAnswersForTeam(liveQuizTeamId)
    )
      ?.find(a => {
        return a.roundId === roundTemplate.id;
      })
      ?.getResponseJson();

    const includeAnswers =
      args?.forceIncludeAnswers ??
      liveQuiz?.roundState === LiveRoundState.SHOWING_ANSWERS;

    const questions: LiveQuizPublicQuestionResponse[] = [];
    for (
      let i = 0;
      i <
      (args?.forceIncludeAllQuestions
        ? roundTemplate.questionOrder.length
        : Math.min(
            roundTemplate.questionOrder.length,
            liveQuiz.currentQuestionNumber
          ));
      i++
    ) {
      const questionTemplateId = roundTemplate.questionOrder[i];
      const questionTemplate = roundTemplate.questions?.find(
        t => t.id === questionTemplateId
      );
      if (!questionTemplate) {
        throw new Error(
          `Error in getCurrentRoundAndQuestions parsing questions in round for liveQuiz id=${liveQuiz.id}, no question template id=${questionTemplateId} exists in json for quiz.`
        );
      }

      const question: LiveQuizPublicQuestionResponse = {
        text: questionTemplate.text,
        answerType: questionTemplate.answerType,
        imageLink: questionTemplate.imageLink,
      };
      if (includeAnswers) {
        question.answers = questionTemplate.answers;
      } else {
        const radioState: AnswerState = {};
        for (const i in questionTemplate.answers) {
          if (i.includes('radio')) {
            radioState[i] = questionTemplate.answers[i];
          }
        }
        question.answers = radioState;
      }
      questions.push(question);
    }

    const teams = (liveQuiz.liveQuizTeams ?? []).map(t => {
      const ret = t.getResponseJson();
      if (ret.id !== liveQuizTeamId) {
        ret.id = ret.id.slice(0, 8);
      }
      return ret;
    });
    const teamsScores = teams.map(t => {
      return {
        teamId: t.id.slice(0, 8),
        score: 0,
      };
    });

    const quizState: any = liveQuiz.getLiveResponseJson();
    delete quizState.liveQuizTeams;

    return {
      quiz: quizState,
      teamId: liveQuizTeamId,
      teams,
      teamsScores,
      round: {
        id: roundTemplate.id,
        title: roundTemplate.title,
        roundNumber: liveQuiz.currentRoundNumber,
        questionNumber: liveQuiz.currentQuestionNumber,
        totalNumberOfQuestions: roundTemplate.questionOrder.length,
        description: roundTemplate.description,
        answersSubmitted: liveQuizRoundAnswers?.answers,
        answersGraded: includeAnswers
          ? liveQuizRoundAnswers?.answersGraded
          : undefined,
        questions,
      },
    };
  }

  async submitAnswersForTeam(
    liveQuizTeamId: string,
    answersSubmitted: Record<string, AnswerState>
  ) {
    const liveQuizTeam = await this.findLiveQuizTeamById(liveQuizTeamId);
    if (!liveQuizTeam) {
      logger.error(
        `Could not submit answers for team ${liveQuizTeamId}, no team found.`
      );
      return undefined;
    }

    const liveQuiz = liveQuizTeam.liveQuiz;

    if (liveQuiz.quizState !== LiveQuizState.STARTED_IN_ROUND) {
      throw new InvalidInputError(
        'Quiz is not accepting answers at this time.'
      );
    }
    if (liveQuiz.roundState !== LiveRoundState.STARTED_ACCEPTING_ANSWERS) {
      throw new InvalidInputError(
        'Round is not accepting answers at this time.'
      );
    }

    const currentRoundIndex = liveQuiz.currentRoundNumber;
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );
    const roundTemplate = quizTemplate.rounds?.find(
      t => t.id === quizTemplate.roundOrder[currentRoundIndex - 1]
    );

    if (!roundTemplate) {
      throw new InvalidInputError(
        `Round not found: ${quizTemplate.roundOrder[currentRoundIndex - 1]}`
      );
    }

    console.log(
      'CHECK ROUNDS',
      currentRoundIndex,
      roundTemplate,
      quizTemplate.roundOrder[currentRoundIndex - 1]
    );

    const liveQuizRoundAnswers =
      await this.findLiveQuizRoundAnswerByTeamIdAndRoundId(
        liveQuizTeamId,
        roundTemplate.id
      );

    if (!liveQuizRoundAnswers) {
      logger.error(
        `Could not submit answers for team ${liveQuizTeamId}, no round answers found for roundId=${roundTemplate.id}.`
      );
      return undefined;
    }

    liveQuizRoundAnswers.answers = JSON.stringify(answersSubmitted);
    liveQuizRoundAnswers.save();

    return liveQuizRoundAnswers.getResponseJson();
  }
}
