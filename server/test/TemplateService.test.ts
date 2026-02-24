import { vi, it, describe, expect, beforeEach } from 'vitest';
import { InvalidInputError } from '../src/routing';
import { TemplateService } from '../src/services/TemplateService';

function createQuizTemplateMock() {
  class ModelMock {
    constructor(obj: any) {
      Object.assign(this, obj);
    }
    async save() {
      return this;
    }
    async destroy() {
      return this;
    }
    static async findByPk() {}
  }
  ModelMock.findByPk = vi.fn().mockImplementation(async () => undefined);
  return ModelMock;
}

function createRoundTemplateMock() {
  class ModelMock {
    constructor(obj: any) {
      Object.assign(this, obj);
    }
    async save() {
      return this;
    }
    async destroy() {
      return this;
    }
    getResponseJson() {
      return { ...this };
    }
    static async findByPk() {}
  }
  ModelMock.findByPk = vi.fn().mockImplementation(async () => undefined);
  return ModelMock;
}

function createQuestionTemplateMock() {
  class ModelMock {
    constructor(obj: any) {
      Object.assign(this, obj);
    }
    async save() {
      return this;
    }
    async destroy() {
      return this;
    }
    getResponseJson() {
      return { ...this };
    }
    static async findByPk() {}
  }
  ModelMock.findByPk = vi.fn().mockImplementation(async () => undefined);
  return ModelMock;
}

vi.mock('../src/models/QuizTemplate', () => ({
  QuizTemplate: createQuizTemplateMock(),
}));
vi.mock('../src/models/RoundTemplate', () => ({
  RoundTemplate: createRoundTemplateMock(),
}));
vi.mock('../src/models/QuestionTemplate', () => ({
  QuestionTemplate: createQuestionTemplateMock(),
}));
vi.mock('../src/models/Account', () => ({
  Account: { findByPk: vi.fn() },
}));

import { QuizTemplate } from '../src/models/QuizTemplate';
import { RoundTemplate } from '../src/models/RoundTemplate';
import { QuestionTemplate } from '../src/models/QuestionTemplate';
import { Account } from '../src/models/Account';

const getDefaultContext = () => {
  const context = {
    userId: 'abcd',
    ioSessions: [],
    session: {
      token: undefined,
    },
  };
  return context;
};

describe('TemplateService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('can create a new quiz template', async () => {
    const templateService = new TemplateService();
    const context = getDefaultContext();
    const quizTemplate: any = await templateService.createQuizTemplate(
      {
        name: 'testQuiz',
      },
      context
    );

    expect(quizTemplate.id).toBeDefined();
    expect(quizTemplate.accountId).toBe(context.userId);
  });

  it('can update a quiz template', async () => {
    const templateService = new TemplateService();
    QuizTemplate.findByPk = vi.fn().mockImplementation(async () => {
      return new QuizTemplate({
        id: 'abcd',
        name: 'testQuiz',
        numRounds: 1,
      });
    });

    const quizTemplate = await templateService.updateQuizTemplate({
      id: 'abcd',
      name: 'testQuiz2',
    });

    expect(quizTemplate?.id).toBeDefined();
    expect(quizTemplate?.name).toBe('testQuiz2');
  });

  it('can delete a quiz template', async () => {
    const templateService = new TemplateService();
    QuizTemplate.findByPk = vi.fn().mockImplementation(async () => {
      const template = new QuizTemplate({
        id: 'abcd',
        name: 'testQuiz',
        numRounds: 1,
      });
      template.destroy = vi.fn().mockImplementation(async () => {
        return template;
      });
      return template;
    });

    const quizTemplate = await templateService.deleteQuizTemplate({
      id: 'abcd',
    });

    expect(quizTemplate?.id).toBeDefined();
    expect(quizTemplate?.name).toBe('testQuiz');
    expect(quizTemplate?.destroy).toHaveBeenCalled();
  });

  it('can create a round template', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-123',
      roundOrder: '[]',
      rounds: [],
    });
    quizTemplate.save = vi.fn().mockResolvedValue(quizTemplate);
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    const roundTemplate = await templateService.createRoundTemplate({
      quizTemplateId: 'quiz-123',
      title: 'Round 1',
      description: 'Test round',
    });

    expect(roundTemplate).toBeDefined();
    expect(roundTemplate?.title).toBe('Round 1');
    expect(roundTemplate?.id).toBeDefined();
  });

  it('can update a round template', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      title: 'Old Title',
      description: 'Old desc',
      quizTemplate: {},
    });
    roundTemplate.save = vi.fn().mockResolvedValue(roundTemplate);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const updated = await templateService.updateRoundTemplate({
      roundTemplateId: 'round-123',
      title: 'New Title',
      description: 'New desc',
    });

    expect(updated?.title).toBe('New Title');
    expect(roundTemplate.save).toHaveBeenCalled();
  });

  it('can delete a round template', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      title: 'To Delete',
      quizTemplate: {},
    });
    roundTemplate.destroy = vi.fn().mockResolvedValue(undefined);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const deleted = await templateService.deleteRoundTemplate({
      roundId: 'round-123',
    });

    expect(deleted?.id).toBe('round-123');
    expect(roundTemplate.destroy).toHaveBeenCalled();
  });

  it('can create a question template', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      questionOrder: '[]',
      questions: [],
      quizTemplate: {},
    });
    roundTemplate.save = vi.fn().mockResolvedValue(roundTemplate);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const questionTemplate = await templateService.createQuestionTemplate({
      roundTemplateId: 'round-123',
      text: 'What is 2+2?',
      answers: JSON.stringify({ answer1: '4' }),
      answerType: 'input1' as any,
    });

    expect(questionTemplate).toBeDefined();
    expect(questionTemplate?.text).toBe('What is 2+2?');
  });

  it('can update a question template', async () => {
    const templateService = new TemplateService();
    const questionTemplate = new QuestionTemplate({
      id: 'q-123',
      text: 'Old text',
      roundTemplate: {},
    });
    questionTemplate.save = vi.fn().mockResolvedValue(questionTemplate);
    (QuestionTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      questionTemplate
    );

    const updated = await templateService.updateQuestionTemplate({
      questionTemplateId: 'q-123',
      text: 'New text',
      answers: JSON.stringify({ answer1: '4' }),
      answerType: 'input1' as any,
    });

    expect(updated?.text).toBe('New text');
  });

  it('can delete a question template', async () => {
    const templateService = new TemplateService();
    const questionTemplate = new QuestionTemplate({
      id: 'q-123',
      text: 'To delete',
      roundTemplate: { id: 'round-123' } as any,
    });
    questionTemplate.destroy = vi.fn().mockResolvedValue(undefined);
    (QuestionTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      questionTemplate
    );

    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      questionOrder: JSON.stringify(['q-123']),
      quizTemplate: {},
    });
    (roundTemplate as any).questionOrder = '["q-123"]';
    roundTemplate.save = vi.fn().mockResolvedValue(roundTemplate);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const deleted = await templateService.deleteQuestionTemplate({
      questionTemplateId: 'q-123',
    });

    expect(deleted?.id).toBe('q-123');
  });

  it('can reorder rounds in quiz', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-123',
      roundOrder: JSON.stringify(['r1', 'r2']),
      rounds: [],
    });
    quizTemplate.save = vi.fn().mockResolvedValue(quizTemplate);
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    const result = await templateService.reorderRoundsInQuiz({
      id: 'quiz-123',
      newOrder: ['r2', 'r1'],
    });

    expect(result).toBeDefined();
    expect(quizTemplate.roundOrder).toBe(JSON.stringify(['r2', 'r1']));
  });

  it('throws InvalidInputError when reorderRounds has extraneous round id', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-123',
      roundOrder: JSON.stringify(['r1']),
      rounds: [],
    });
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    await expect(
      templateService.reorderRoundsInQuiz({
        id: 'quiz-123',
        newOrder: ['r1', 'r2'],
      })
    ).rejects.toThrow(InvalidInputError);
    await expect(
      templateService.reorderRoundsInQuiz({
        id: 'quiz-123',
        newOrder: ['r1', 'r2'],
      })
    ).rejects.toThrow('extraneous');
  });

  it('throws InvalidInputError when reorderRounds omits round id', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-123',
      roundOrder: JSON.stringify(['r1', 'r2']),
      rounds: [],
    });
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    await expect(
      templateService.reorderRoundsInQuiz({
        id: 'quiz-123',
        newOrder: ['r1'],
      })
    ).rejects.toThrow(InvalidInputError);
    await expect(
      templateService.reorderRoundsInQuiz({
        id: 'quiz-123',
        newOrder: ['r1'],
      })
    ).rejects.toThrow('omitted');
  });

  it('can reorder questions in round', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      questionOrder: JSON.stringify(['q1', 'q2']),
      quizTemplate: {},
    });
    roundTemplate.save = vi.fn().mockResolvedValue(roundTemplate);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const result = await templateService.reorderQuestionsInRound({
      id: 'round-123',
      newOrder: ['q2', 'q1'],
    });

    expect(result).toBeDefined();
    expect(roundTemplate.questionOrder).toBe(JSON.stringify(['q2', 'q1']));
  });

  it('can duplicate question template', async () => {
    const templateService = new TemplateService();
    const questionTemplate = new QuestionTemplate({
      id: 'q-123',
      text: 'Original',
      answers: '{}',
      answerType: 'input1' as any,
      roundTemplate: { id: 'round-123' } as any,
    });
    (QuestionTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      questionTemplate
    );

    const roundTemplate = new RoundTemplate({
      id: 'round-123',
      questionOrder: JSON.stringify(['q-123']),
      questions: [],
      quizTemplate: {},
    });
    roundTemplate.save = vi.fn().mockResolvedValue(roundTemplate);
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const duplicated = await templateService.duplicateQuestionTemplate({
      questionTemplateId: 'q-123',
    });

    expect(duplicated).toBeDefined();
    expect(duplicated?.text).toContain('DUPLICATE');
    expect(duplicated?.text).toContain('Original');
  });

  it('findQuizById returns quiz with includes', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-1',
      rounds: [],
      account: {},
    });
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    const result = await templateService.findQuizById('quiz-1');

    expect(result).toBe(quizTemplate);
  });

  it('findRoundsByQuizId returns rounds', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-1',
      rounds: [{ id: 'r1' }] as any,
    });
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    const result = await templateService.findRoundsByQuizId('quiz-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('findRoundById returns round', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-1',
      questions: [],
      quizTemplate: {},
    });
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const result = await templateService.findRoundById('round-1');

    expect(result).toBe(roundTemplate);
  });

  it('findQuestionsByRoundId returns questions', async () => {
    const templateService = new TemplateService();
    const roundTemplate = new RoundTemplate({
      id: 'round-1',
      questions: [{ id: 'q1' }] as any,
      quizTemplate: {},
    });
    (RoundTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      roundTemplate
    );

    const result = await templateService.findQuestionsByRoundId('round-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q1');
  });

  it('findAllQuizTemplatesByAccountId returns templates', async () => {
    const templateService = new TemplateService();
    const mockAccount = {
      quizTemplates: [
        new QuizTemplate({ id: 'qt1', getResponseJson: () => ({ id: 'qt1' }) }),
      ],
    };
    (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAccount
    );

    const result = await templateService.findAllQuizTemplatesByAccountId('acc-1');

    expect(result).toHaveLength(1);
  });

  it('findAllRoundTemplatesByQuizTemplateId returns undefined when quiz not found', async () => {
    const templateService = new TemplateService();
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result =
      await templateService.findAllRoundTemplatesByQuizTemplateId('nonexistent');

    expect(result).toBeUndefined();
  });

  it('exportQuizTemplate returns JSON', async () => {
    const templateService = new TemplateService();
    const quizTemplate = new QuizTemplate({
      id: 'quiz-1',
      name: 'Test Quiz',
      roundOrder: '[]',
      rounds: [],
      account: {},
    });
    quizTemplate.getResponseJson = () =>
      ({ id: 'quiz-1', name: 'Test Quiz', rounds: [] } as any);
    (QuizTemplate.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      quizTemplate
    );

    const result = await templateService.exportQuizTemplate({
      quizTemplateId: 'quiz-1',
      format: 'json',
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    const parsed = JSON.parse(result as string);
    expect(parsed.name).toBe('Test Quiz');
  });
});
