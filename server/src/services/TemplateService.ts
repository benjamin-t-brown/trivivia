import { randomUUID } from 'crypto';
import { InvalidInputError, RouteContext } from '../routing';
import { QuizTemplate } from '../models/QuizTemplate';
import { QuestionTemplate } from '../models/QuestionTemplate';
import { RoundTemplate } from '../models/RoundTemplate';
import { Account } from '../models/Account';
import { AnswerBoxType } from 'shared/responses';
import logger from '../logger';
import { Includeable } from 'sequelize';

export class TemplateService {
  async findAllQuizTemplatesByAccountId(accountId: string) {
    const account = await Account.findByPk(accountId, {
      include: [{ model: QuizTemplate, as: 'quizTemplates' }],
      order: [
        [{ model: QuizTemplate, as: 'quizTemplates' }, 'updatedOn', 'DESC'],
      ],
    });

    return account?.quizTemplates ?? ([] as QuizTemplate[]);

    // return (
    //   account?.quizTemplates?.sort((a, b) => {
    //     return a.updatedAt < b.updatedAt ? -1 : 1;
    //   }) ?? ([] as QuizTemplate[])
    // );
  }

  async findAllRoundTemplatesByQuizTemplateId(quizTemplateId: string) {
    const quizTemplate = await QuizTemplate.findByPk(quizTemplateId, {
      include: [RoundTemplate],
    });

    const ret: RoundTemplate[] = [];

    if (!quizTemplate) {
      return undefined;
    }

    const roundOrder = JSON.parse(quizTemplate.roundOrder);

    for (const roundId of roundOrder) {
      const r = quizTemplate.rounds.find(r => r.id === roundId);
      if (!r) {
        throw new Error(
          `Detected invalid round order on quizTemplateId=${quizTemplateId}: roundTemplateId=${roundId} is in the roundOrder but not fetched from db.`
        );
      }
      ret.push(r);
    }

    return ret;
  }

  async findAllQuestionTemplatesByRoundTemplateId(roundTemplateId: string) {
    const roundTemplate = await RoundTemplate.findByPk(roundTemplateId, {
      include: [QuestionTemplate],
    });

    const ret: QuestionTemplate[] = [];

    if (!roundTemplate) {
      return undefined;
    }

    const questionOrder = JSON.parse(roundTemplate.questionOrder);

    for (const questionId of questionOrder) {
      const q = roundTemplate.questions.find(q => q.id === questionId);
      if (!q) {
        throw new Error(
          `Detected invalid question order on roundTemplateId=${roundTemplateId}: questionTemplateId=${questionId} is in the questionOrder but not fetched from db.`
        );
      }
      ret.push(q);
    }

    return ret;
  }

  async findQuizById(
    quizId: string,
    args?: {
      includeAll: boolean;
    }
  ) {
    const includes = [
      { model: RoundTemplate, include: [] as Includeable[] },
      { model: Account, include: [] as Includeable[] },
    ];
    if (args?.includeAll) {
      includes[0].include.push(QuestionTemplate);
    }
    return QuizTemplate.findByPk(quizId, {
      include: includes,
    });
  }

  async findRoundsByQuizId(quizId: string) {
    const quiz = await QuizTemplate.findByPk(quizId, {
      include: [RoundTemplate],
    });
    return quiz?.rounds ?? [];
  }

  async findRoundById(roundId: string) {
    return RoundTemplate.findByPk(roundId, {
      include: [QuestionTemplate, QuizTemplate],
    });
  }

  async findQuestionsByRoundId(roundId: string) {
    const round = await RoundTemplate.findByPk(roundId, {
      include: [QuestionTemplate],
    });

    return round?.questions ?? [];
  }

  async findQuestionById(questionId: string) {
    return QuestionTemplate.findByPk(questionId, { include: [RoundTemplate] });
  }

  async createQuizTemplate(
    params: { name: string; numRounds: number; notes?: string },
    context: RouteContext
  ) {
    const quizTemplate = new QuizTemplate({
      id: randomUUID(),
      accountId: context.userId,
      numRounds: params.numRounds,
      name: params.name,
      roundOrder: '[]',
      notes: params.notes ?? '',
    });
    return quizTemplate.save();
  }

  async updateQuizTemplate(params: {
    id: string;
    name: string;
    numRounds: number;
    notes?: string;
  }) {
    const quizTemplate = await this.findQuizById(params.id);

    if (!quizTemplate) {
      return;
    }

    quizTemplate.name = params.name;
    quizTemplate.numRounds = params.numRounds;
    quizTemplate.notes = params.notes ?? '';
    return quizTemplate.save();
  }

  async deleteQuizTemplate(params: { id: string }) {
    const quizTemplate = await this.findQuizById(params.id);

    if (!quizTemplate) {
      return;
    }

    await quizTemplate.destroy();
    return quizTemplate;
  }

  async reorderRoundsInQuiz(params: { id: string; newOrder: string[] }) {
    const quizTemplate = await this.findQuizById(params.id);
    console.log('REORDER', params.id);

    if (!quizTemplate) {
      return;
    }

    const roundOrder = JSON.parse(quizTemplate.roundOrder);
    for (const id of params.newOrder) {
      if (!roundOrder.includes(id)) {
        throw new InvalidInputError(
          'Cannot reorder rounds: Round id is extraneous: ' + id
        );
      }
    }
    for (const id of roundOrder) {
      if (!params.newOrder.includes(id)) {
        throw new InvalidInputError(
          'Cannot reorder rounds: Round id was omitted: ' + id
        );
      }
    }

    quizTemplate.roundOrder = JSON.stringify(params.newOrder);
    console.log('reorder rounds to', quizTemplate.roundOrder);
    return quizTemplate.save();
  }

  async createRoundTemplate(params: {
    quizTemplateId: string;
    title: string;
    description?: string;
    notes?: string;
  }) {
    console.log('create round', params);

    const quizTemplate = await this.findQuizById(params.quizTemplateId);
    if (!quizTemplate) {
      logger.error(
        'No quiz found to create round template!',
        'id=' + params.quizTemplateId
      );
      return;
    }

    const roundTemplate = new RoundTemplate({
      id: randomUUID(),
      quizTemplateId: params.quizTemplateId,
      title: params.title,
      description: params.description ?? '',
      questionOrder: '[]',
      notes: params.notes ?? '',
    });
    await roundTemplate.save();

    const roundOrder = JSON.parse(quizTemplate.roundOrder);
    roundOrder.push(roundTemplate.id);
    quizTemplate.roundOrder = JSON.stringify(roundOrder);
    await quizTemplate.save();

    return roundTemplate;
  }

  async updateRoundTemplate(params: {
    roundTemplateId: string;
    title: string;
    description?: string;
    notes?: string;
  }) {
    const roundTemplate = await this.findRoundById(params.roundTemplateId);
    if (!roundTemplate) {
      return;
    }

    roundTemplate.title = params.title;
    roundTemplate.description = params.description ?? roundTemplate.description;
    roundTemplate.notes = params.notes ?? roundTemplate.notes;

    return roundTemplate.save();
  }

  async deleteRoundTemplate(params: { roundId: string }) {
    const roundTemplate = await this.findRoundById(params.roundId);

    console.log('found round template', roundTemplate);

    if (!roundTemplate) {
      return;
    }

    const quizTemplate = await this.findQuizById(roundTemplate.quizTemplate.id);
    if (quizTemplate) {
      const roundOrder: string[] = JSON.parse(quizTemplate.roundOrder);
      const ind = roundOrder.findIndex(id => id === params.roundId);
      if (ind > -1) {
        roundOrder.splice(ind, 1);
      }
      quizTemplate.roundOrder = JSON.stringify(roundOrder);
      await quizTemplate.save();
    }

    await roundTemplate.destroy();
    return roundTemplate;
  }

  async reorderQuestionsInRound(params: { id: string; newOrder: string[] }) {
    const roundTemplate = await this.findRoundById(params.id);

    if (!roundTemplate) {
      return;
    }

    const questionOrder = JSON.parse(roundTemplate.questionOrder);
    for (const id of params.newOrder) {
      if (!questionOrder.includes(id)) {
        throw new InvalidInputError(
          'Cannot reorder questions: Question id is extraneous: ' + id
        );
      }
    }
    for (const id of questionOrder) {
      if (!params.newOrder.includes(id)) {
        throw new InvalidInputError(
          'Cannot reorder questions: Question id was omitted: ' + id
        );
      }
    }

    roundTemplate.questionOrder = JSON.stringify(params.newOrder);
    return roundTemplate.save();
  }

  async createQuestionTemplate(params: {
    roundTemplateId: string;
    text: string;
    answers: string;
    answerType: AnswerBoxType;
    orderMatters?: boolean;
    notes?: string;
  }) {
    const roundTemplate = await this.findRoundById(params.roundTemplateId);
    if (!roundTemplate) {
      return;
    }

    const questionTemplate = new QuestionTemplate({
      id: randomUUID(),
      roundTemplateId: params.roundTemplateId,
      text: params.text,
      answers: params.answers,
      answerType: params.answerType,
      orderMatters: params.orderMatters ?? false,
    });
    await questionTemplate.save();

    const questionOrdering = JSON.parse(roundTemplate.questionOrder);
    questionOrdering.push(questionTemplate.id);
    roundTemplate.questionOrder = JSON.stringify(questionOrdering);
    await roundTemplate.save();

    return questionTemplate;
  }

  async updateQuestionTemplate(params: {
    questionTemplateId: string;
    text: string;
    answers: string;
    answerType?: AnswerBoxType;
    orderMatters?: boolean;
    notes?: string;
  }) {
    const questionTemplate = await this.findQuestionById(
      params.questionTemplateId
    );
    if (!questionTemplate) {
      return;
    }

    questionTemplate.text = params.text ?? questionTemplate.text;
    questionTemplate.answers = params.answers ?? questionTemplate.answers;
    questionTemplate.answerType =
      params.answerType ?? questionTemplate.answerType;
    questionTemplate.orderMatters =
      params.orderMatters ?? questionTemplate.orderMatters;
    questionTemplate.notes = params.notes ?? questionTemplate.notes;

    return questionTemplate.save();
  }

  async deleteQuestionTemplate(params: { questionId: string }) {
    const questionTemplate = await this.findQuestionById(params.questionId);

    if (!questionTemplate) {
      return;
    }

    const roundTemplate = await this.findRoundById(
      questionTemplate.roundTemplate.id
    );
    if (roundTemplate) {
      const questionOrder: string[] = JSON.parse(roundTemplate.questionOrder);
      const ind = questionOrder.findIndex(id => id === params.questionId);
      if (ind > -1) {
        questionOrder.splice(ind, 1);
      }
      roundTemplate.questionOrder = JSON.stringify(questionOrder);
      await roundTemplate.save();
    }

    await questionTemplate.destroy();
    return questionTemplate;
  }
}
