import { vi, it, describe, expect } from 'vitest';
import { StaticQuizService } from '../src/services/StaticQuizService';
import { LiveQuizService } from '../src/services/LiveQuizService';
import { BASIC_ONE_ROUND_QUIZ_TEMPLATE } from './mocks/sampleQuizTemplates';

describe('StaticQuizService', () => {
  it('returns undefined when live quiz not found', async () => {
    const staticQuizService = new StaticQuizService();
    const mockLiveQuizService = {
      findLiveQuizByUserFriendlyId: vi.fn().mockResolvedValue(undefined),
    };
    staticQuizService.setLiveQuizService(
      mockLiveQuizService as unknown as LiveQuizService
    );

    const result = await staticQuizService.getStaticQuiz('nonexistent');

    expect(result).toBeUndefined();
    expect(
      mockLiveQuizService.findLiveQuizByUserFriendlyId
    ).toHaveBeenCalledWith('nonexistent');
  });

  it('returns static quiz when live quiz exists', async () => {
    const staticQuizService = new StaticQuizService();
    const mockLiveQuiz = {
      id: 'live-quiz-123',
      userFriendlyId: 'abc123',
      name: 'Test Quiz',
      quizTemplateJson: JSON.stringify(BASIC_ONE_ROUND_QUIZ_TEMPLATE),
      createdAt: new Date('2024-01-01'),
      startedAt: new Date('2024-01-02'),
      completedAt: null,
    };
    const mockLiveQuizService = {
      findLiveQuizByUserFriendlyId: vi.fn().mockResolvedValue(mockLiveQuiz),
    };
    staticQuizService.setLiveQuizService(
      mockLiveQuizService as unknown as LiveQuizService
    );

    const result = await staticQuizService.getStaticQuiz('abc123');

    expect(result).toBeDefined();
    expect(result?.id).toBe('live-quiz-123');
    expect(result?.userFriendlyId).toBe('abc123');
    expect(result?.name).toBe('Test Quiz');
    expect(result?.rounds).toHaveLength(1);
    expect(result?.rounds[0].title).toBe('Randumb Knowledge');
    expect(result?.rounds[0].questions.length).toBeGreaterThan(0);
  });
});
