import { vi, it, describe, expect, beforeEach } from 'vitest';
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

import { QuizTemplate } from '../src/models/QuizTemplate';
import { RoundTemplate } from '../src/models/RoundTemplate';
import { QuestionTemplate } from '../src/models/QuestionTemplate';

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
      roundTemplateId: 'round-123',
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
});
