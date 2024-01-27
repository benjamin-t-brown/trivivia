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
      include: [LiveQuiz, LiveQuizRoundAnswers],
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
      currentRoundAnswerNumber: 0,
      currentRoundScoresNumber: 0,
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
    liveQuiz.currentRoundAnswerNumber = 0;
    liveQuiz.currentRoundScoresNumber = 0;
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

    liveQuiz.currentRoundNumber = roundIndex;

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

  async setCurrentRoundAnswerForLiveQuiz(
    liveQuizId: string,
    roundAnswerIndex: number
  ) {
    const liveQuiz = await this.assertQuiz(liveQuizId);
    if (!liveQuiz) {
      return undefined;
    }

    liveQuiz.currentRoundAnswerNumber = roundAnswerIndex;

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
      publicId: randomUUID(),
      liveQuizId: liveQuiz.id,
      teamName: args.teamName,
      numberOfPlayers: args.numberOfPlayers,
      currentScore: 0,
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
      hasUsedJoker: false,
      isComplete: false,
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
      ignoreTeamId?: boolean;
    }
  ): Promise<LiveQuizPublicStateResponse | undefined> {
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );

    const isRoundInAnswerShowState =
      liveQuiz.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE ||
      liveQuiz.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN;

    const currentRoundNumber = isRoundInAnswerShowState
      ? liveQuiz.currentRoundAnswerNumber
      : liveQuiz.currentRoundNumber;

    const roundTemplateId = quizTemplate.roundOrder[currentRoundNumber - 1];

    const roundTemplate = quizTemplate.rounds?.find(
      t => t.id === roundTemplateId
    );
    if (!roundTemplate) {
      const quizState: any = liveQuiz.getLiveResponseJson();
      delete quizState.liveQuizTeams;

      const teams = (liveQuiz.liveQuizTeams ?? []).map(t => {
        const ret = t.getResponseJson();
        if (ret.id !== liveQuizTeamId) {
          ret.id = ret.id.slice(0, 8);
        }
        return ret;
      });

      return {
        quiz: quizState,
        teamId: liveQuizTeamId,
        teams,
        teamsScores: [],
        hasUsedJoker: false,
        isComplete: false,
      };
    }

    const liveQuizRoundAnswers =
      // adding a comment here because vscode syntax highlighting is not working correctly
      args?.ignoreTeamId
        ? ({} as LiveQuizRoundAnswersResponse)
        : (await this.findAllLiveQuizRoundAnswersForTeam(liveQuizTeamId))
            ?.find(a => {
              return a.roundId === roundTemplate.id;
            })
            ?.getResponseJson();

    const includeAnswers =
      args?.forceIncludeAnswers ??
      liveQuiz?.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE;

    const questions: LiveQuizPublicQuestionResponse[] = [];
    for (
      let i = 0;
      i <
      (args?.forceIncludeAllQuestions || isRoundInAnswerShowState
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
        ret.id = ret.publicId;
      }
      return ret;
    });
    const teamsScores = teams.map(t => {
      return {
        teamId: t.id === liveQuizTeamId ? t.id : t.publicId,
        teamPublicId: t.publicId,
        score: t.currentScore,
      };
    });

    const quizState: any = liveQuiz.getLiveResponseJson();
    delete quizState.liveQuizTeams;

    const liveQuizTeam = await this.findLiveQuizTeamById(liveQuizTeamId);
    if (!liveQuizTeam && !args?.ignoreTeamId) {
      logger.error(
        `Could not get public state for team ${liveQuizTeamId}, no team found with teamId=${liveQuizTeamId}.`
      );
      throw new Error('Failed to get public state for team.');
    }

    const stats = JSON.parse(liveQuiz.stats || '{}');

    return {
      quiz: quizState,
      teamId: liveQuizTeamId,
      teams,
      teamsScores,
      hasUsedJoker: Boolean(
        liveQuizTeam?.liveQuizRoundAnswers?.find(a => a.didJoker === true)
      ),
      isComplete:
        liveQuiz.currentRoundAnswerNumber >= quizTemplate.roundOrder.length,
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
        didJoker: Boolean(liveQuizRoundAnswers?.didJoker),
        questions,
        stats: isRoundInAnswerShowState ? stats?.[roundTemplate.id] : undefined,
      },
    };
  }

  async submitAnswersForTeamInCurrentRound(
    liveQuizTeamId: string,
    args: {
      submittedAnswers: Record<string, AnswerState>;
      didJoker: boolean;
    }
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

    const currentRoundNumber = liveQuiz.currentRoundNumber;
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );
    const roundTemplate = quizTemplate.rounds?.find(
      t => t.id === quizTemplate.roundOrder[currentRoundNumber - 1]
    );

    if (!roundTemplate) {
      throw new InvalidInputError(
        `Round not found: ${quizTemplate.roundOrder[currentRoundNumber - 1]}`
      );
    }

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

    for (const answerState of Object.values(args.submittedAnswers)) {
      for (const [k, v] of Object.entries(answerState)) {
        answerState[k] = v.trim();
      }
    }

    liveQuizRoundAnswers.answers = JSON.stringify(args.submittedAnswers);

    const hasAlreadyUsedJoker = Boolean(
      liveQuizTeam.liveQuizRoundAnswers?.find(a => a.didJoker === true)
    );

    if (args.didJoker) {
      if (hasAlreadyUsedJoker) {
        logger.error(
          `Team id=${liveQuizTeam.id} has already used joker, ignoring this instance.`
        );
      } else {
        liveQuizRoundAnswers.didJoker = true;
      }
    } else {
      const isThisTheFinalRound =
        currentRoundNumber >= quizTemplate.roundOrder.length;

      if (isThisTheFinalRound && !hasAlreadyUsedJoker) {
        liveQuizRoundAnswers.didJoker = true;
      } else {
        liveQuizRoundAnswers.didJoker = false;
      }
    }

    await liveQuizRoundAnswers.save();

    return liveQuizRoundAnswers.getResponseJson();
  }

  async exportLiveQuiz(
    liveQuizId: string
  ): Promise<StructuredQuizResponse | undefined> {
    const liveQuiz = (
      await this.findLiveQuizById(liveQuizId)
    )?.getResponseJson();
    if (!liveQuiz) {
      logger.error(`Could not export live quiz ${liveQuizId}, no quiz found.`);
      return undefined;
    }

    const quizTemplate = liveQuiz.quizTemplateJson;

    const rounds: StructuredQuizRound[] = [];
    const questions: StructuredQuizQuestion[] = [];
    const teams: StructuredQuizTeam[] = [];

    // const roundQuestionIdMap: Record<string, string[]> = {};

    const roundOrder = quizTemplate.roundOrder;
    for (let i = 0; i < roundOrder.length; i++) {
      const roundId = roundOrder[i];
      const roundTemplate = quizTemplate.rounds?.find(t => t.id === roundId);

      if (!roundTemplate) {
        throw new Error(`Round not found roundId='${roundId}'`);
      }

      const questionIds = roundTemplate.questionOrder;

      rounds.push({
        id: roundTemplate.id,
        title: roundTemplate.title,
        description: roundTemplate.description,
        notes: roundTemplate.notes ?? '',
        questions: questionIds,
      });

      for (const questionId of questionIds) {
        const questionTemplate = roundTemplate.questions?.find(
          t => t.id === questionId
        );

        if (!questionTemplate) {
          throw new Error(`Question not found questionId='${questionId}'`);
        }

        let numCorrectAnswers = 0;
        const answers: string[] = [];
        for (
          let j = 0;
          j < getNumCorrectAnswers(questionTemplate.answerType);
          j++
        ) {
          const answer = questionTemplate.answers['answer' + (j + 1)];
          if (answer) {
            numCorrectAnswers++;
            answers.push(answer);
          }
        }

        questions.push({
          id: questionTemplate.id,
          text: questionTemplate.text,
          answerType: questionTemplate.answerType,
          notes: questionTemplate.notes ?? '',
          orderMatters: questionTemplate.orderMatters,
          roundId: roundTemplate.id,
          isBonus: questionTemplate.isBonus,
          numAnswers: getNumAnswers(questionTemplate.answerType),
          numCorrectAnswers,
          answers,
        });
      }
    }

    for (const liveQuizTeam of liveQuiz.liveQuizTeams) {
      const submittedAnswers: StructuredQuizTeamAnswersSubmission[] = [];

      for (let i = 0; i < roundOrder.length; i++) {
        const roundId = roundOrder[i];
        const roundTemplate = quizTemplate.rounds?.find(t => t.id === roundId);
        if (!roundTemplate) {
          throw new Error(`Round not found roundId='${roundId}'`);
        }

        const liveQuizRoundAnswers = (
          await this.findLiveQuizRoundAnswerByTeamIdAndRoundId(
            liveQuizTeam.id,
            roundId
          )
        )?.getResponseJson();

        const submittedForRound = liveQuizRoundAnswers?.answers;

        const questionIds = roundTemplate.questionOrder;
        for (let j = 0; j < questionIds.length; j++) {
          const answerState = submittedForRound?.[j + 1];

          if (!answerState) {
            submittedAnswers.push({
              roundId,
              questionId: questionIds[j],
              answers: [],
            });
            continue;
          }

          const questionTemplate = questions.find(q => q.id === questionIds[j]);

          if (!questionTemplate) {
            throw new Error(
              `Question not found questionId='${questionIds[j]}'`
            );
          }

          const answers: string[] = [];
          const numAnswers = getNumAnswers(questionTemplate.answerType);
          for (let k = 0; k < numAnswers; k++) {
            answers.push(answerState['answer' + (k + 1)]);
          }

          submittedAnswers.push({
            roundId,
            questionId: questionIds[j],
            answers,
          });
        }
      }

      teams.push({
        id: liveQuizTeam.id,
        name: liveQuizTeam.teamName,
        submittedAnswers,
      });
    }

    return {
      id: liveQuiz.id,
      title: quizTemplate.name,
      name: liveQuiz.name,
      questions,
      rounds,
      teams,
    };
  }

  async submitGrades(liveQuizId: string, gradeState: GradeInputState) {
    const liveQuiz = await this.findLiveQuizById(liveQuizId);
    if (!liveQuiz) {
      logger.error(
        `Could not submit grades for quiz ${liveQuizId}, no quiz found.`
      );
      return undefined;
    }

    const modelsToSave: Model[] = [];

    const stats: QuizStats = {};

    for (const teamId in gradeState) {
      const team = liveQuiz.liveQuizTeams.find(t => t.id === teamId);

      for (const roundId in gradeState[teamId]) {
        if (!stats[roundId]) {
          stats[roundId] = {};
        }
        const liveQuizRoundAnswers =
          await this.findLiveQuizRoundAnswerByTeamIdAndRoundId(teamId, roundId);

        if (!liveQuizRoundAnswers) {
          logger.error(
            `Could not submit grades for team ${teamId}, no LiveQuizRoundAnswer found for roundId=${roundId}.`
          );
          throw new Error('Failed to submit grades.');
        }

        const roundGradeState = gradeState?.[teamId]?.[roundId];
        if (!roundGradeState) {
          logger.error(
            `Could not submit grades for team ${teamId}, no roundGradeState found for roundId=${roundId}.`
          );
          throw new Error('Failed to submit grades.');
        }
        liveQuizRoundAnswers.answersGraded = JSON.stringify(roundGradeState);
        modelsToSave.push(liveQuizRoundAnswers);

        for (const questionNumber in roundGradeState) {
          if (!stats[roundId][questionNumber]) {
            stats[roundId][questionNumber] = {} as AnswerStateStats;
          }

          const questionGradeState = roundGradeState[questionNumber];

          let numberOfCorrectAnswers = 0;
          for (const answerKey in questionGradeState) {
            if (questionGradeState[answerKey] === 'true') {
              numberOfCorrectAnswers++;
            }
          }
          if (
            stats[roundId][questionNumber][numberOfCorrectAnswers] === undefined
          ) {
            stats[roundId][questionNumber][numberOfCorrectAnswers] = 1;
          } else {
            (stats[roundId][questionNumber][
              numberOfCorrectAnswers
            ] as number)++;
          }

          const teamsWhoGotCorrect: string[] =
            (stats[roundId][questionNumber].publicTeamIdsCorrect as string[]) ??
            [];

          if (numberOfCorrectAnswers === 1 && team?.publicId) {
            teamsWhoGotCorrect.push(team.publicId);
          }
          stats[roundId][questionNumber].publicTeamIdsCorrect =
            teamsWhoGotCorrect;
        }
      }
    }

    await Promise.all(modelsToSave.map(m => m.save()));

    liveQuiz.stats = JSON.stringify(stats);
    await liveQuiz.save();

    return gradeState;
  }

  async updateAllScores(liveQuizId: string, upToRoundNum: number) {
    const liveQuiz = await this.findLiveQuizById(liveQuizId);
    if (!liveQuiz) {
      logger.error(
        `Could not updateAllScores for quiz ${liveQuizId}, no quiz found.`
      );
      return undefined;
    }

    const ret: LiveQuizTeamResponse[] = [];
    for (const liveQuizTeam of liveQuiz.liveQuizTeams ?? []) {
      const team = await this.updateScoreForTeam(
        liveQuiz,
        liveQuizTeam.id,
        upToRoundNum
      );
      ret.push(team.getResponseJson());
    }

    return ret;
  }

  async updateScoreForTeam(
    liveQuiz: LiveQuiz,
    liveQuizTeamId: string,
    upToRoundNum: number
  ) {
    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );

    let score = 0;
    for (let i = 1; i <= upToRoundNum; i++) {
      const roundTemplate = quizTemplate.rounds?.find(
        t => t.id === quizTemplate.roundOrder[i - 1]
      );
      let scoreThisRound = 0;
      if (roundTemplate) {
        logger.info(
          `Checking round ${roundTemplate.id} for team ${liveQuizTeamId}`
        );
        const liveQuizRoundAnswers =
          await this.findLiveQuizRoundAnswerByTeamIdAndRoundId(
            liveQuizTeamId,
            roundTemplate.id
          );

        if (!liveQuizRoundAnswers) {
          logger.error(
            `Could not get score for team ${liveQuizTeamId}, no round answers found for roundId=${roundTemplate.id}.`
          );
          throw new Error('Failed to update score.');
        }

        const gradeState: Record<string, AnswerStateGraded> = JSON.parse(
          liveQuizRoundAnswers.answersGraded ?? '{}'
        );

        for (let j = 0; j < roundTemplate.questionOrder.length; j++) {
          const questionTemplate = roundTemplate.questions?.find(
            q => q.id === roundTemplate.questionOrder[j]
          );

          if (!questionTemplate) {
            logger.error(
              `Could not get score for team ${liveQuizTeamId}, no question template found questionId=${roundTemplate.questionOrder[j]}.`
            );
            throw new Error('Failed to update score.');
          }

          if (questionTemplate.isBonus) {
            continue;
          }

          const numAnswers = getNumAnswers(questionTemplate?.answerType);

          for (let k = 1; k <= numAnswers; k++) {
            if (gradeState?.[j + 1]?.['answer' + k] === 'true') {
              scoreThisRound++;
            }
          }
        }

        if (liveQuizRoundAnswers.didJoker) {
          scoreThisRound *= 2;
        }
      }

      score += scoreThisRound;
    }

    const liveQuizTeam = await this.findLiveQuizTeamById(liveQuizTeamId);
    if (!liveQuizTeam) {
      logger.error(
        `Could not get score for team ${liveQuizTeamId}, no team found with teamId=${liveQuizTeamId}.`
      );
      throw new Error('Failed to update score.');
    }

    logger.info(`Update score for team: ${liveQuizTeam.teamName} to ${score}`);
    liveQuizTeam.currentScore = score;
    await liveQuizTeam.save();

    return liveQuizTeam;
  }
}
