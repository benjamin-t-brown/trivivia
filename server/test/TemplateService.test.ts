import { vi, it, describe, expect, beforeEach } from 'vitest';
import { TemplateService } from '../src/services/TemplateService';

vi.mock('../src/models/QuizTemplate', async () => {
  class ModelMock {
    constructor(obj) {
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

  ModelMock.findByPk = vi.fn().mockImplementation(async () => {
    return undefined;
  });

  return {
    QuizTemplate: ModelMock,
  };
});

import { QuizTemplate } from '../src/models/QuizTemplate';

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
});
