import { vi, it, describe, expect, beforeEach, beforeAll } from 'vitest';
import { TemplateService } from '../src/services/TemplateService';

vi.mock('../src/models/LiveQuiz', async () => {
  return {
    LiveQuiz: createModelMock(),
  };
});
vi.mock('../src/models/LiveQuizTeam', async () => {
  return {
    LiveQuizTeam: createModelMock(),
  };
});
vi.mock('../src/models/LiveQuizRoundAnswers', async () => {
  return {
    LiveQuizRoundAnswers: createModelMock(),
  };
});
vi.mock('../src/models/Account', () => ({
  Account: {
    findByPk: vi.fn(),
  },
}));

import { QuizTemplate } from '../src/models/QuizTemplate';
import { Account } from '../src/models/Account';
import { LiveQuizService } from '../src/services/LiveQuizService';
import { LiveQuiz } from '../src/models/LiveQuiz';
import { BASIC_ONE_ROUND_QUIZ_TEMPLATE } from './mocks/sampleQuizTemplates';
import {
  AnswerBoxType,
  LiveQuizRoundAnswersResponse,
  LiveQuizState,
  LiveRoundState,
} from 'shared/responses';
import { randomUUID } from 'crypto';
import { LiveQuizRoundAnswers } from '../src/models/LiveQuizRoundAnswers';
import { LiveQuizTeam } from '../src/models/LiveQuizTeam';

function createModelMock() {
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
    static async findAll() {}
    getResponseJson() {
      const obj: any = {};
      for (const key of Object.keys(this)) {
        if (typeof this[key] !== 'function') {
          obj[key] = this[key];
        }
      }
      return obj;
    }
    getLiveResponseJson() {
      const ret = this.getResponseJson();
      delete ret.quizTemplate;
      delete ret.quizTemplateJson;
      delete ret.stats;
      if ((this as any).liveQuizTeams) {
        ret.liveQuizTeams = (this as any).liveQuizTeams.map(t =>
          t.getResponseJson()
        );
      }
      return ret;
    }
  }

  ModelMock.findByPk = vi.fn().mockImplementation(async () => {
    return undefined;
  });
  return ModelMock;
}

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

describe('LiveQuizService', () => {
  const mockTemplateService = new TemplateService();
  Object.keys(TemplateService.prototype).forEach(key => {
    if (typeof TemplateService.prototype[key] === 'function') {
      mockTemplateService[key] = vi.fn();
    }
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('can create a new live quiz', async () => {
    const liveQuizService = new LiveQuizService();
    liveQuizService.setTemplateService(mockTemplateService);
    const ModelMock = createModelMock();
    const quizTemplate = new ModelMock(BASIC_ONE_ROUND_QUIZ_TEMPLATE);

    mockTemplateService.findQuizById = vi.fn().mockImplementation(async () => {
      return quizTemplate;
    });

    const liveQuiz = await liveQuizService.createLiveQuiz('12345', {
      name: 'liveQuizTest',
    });

    expect(liveQuiz).toBeDefined();
    expect(liveQuiz?.id).toBeDefined();
  });

  describe('quiz updates', () => {
    const liveQuizService = new LiveQuizService();
    let liveQuiz = new LiveQuiz();
    beforeEach(async () => {
      vi.resetAllMocks();

      liveQuizService.setTemplateService(mockTemplateService);
      const ModelMock = createModelMock();
      const quizTemplate = new ModelMock(BASIC_ONE_ROUND_QUIZ_TEMPLATE);
      mockTemplateService.findQuizById = vi
        .fn()
        .mockImplementation(async () => {
          return quizTemplate;
        });
      liveQuiz = (await liveQuizService.createLiveQuiz('12345', {
        name: 'liveQuizTest',
      })) as LiveQuiz;

      liveQuizService.findLiveQuizTeamById = vi
        .fn()
        .mockImplementation(async () => {
          return liveQuiz;
        });
      if (!liveQuiz) {
        throw new Error('liveQuiz is undefined');
      }
      liveQuiz.quizTemplateJson = JSON.stringify(BASIC_ONE_ROUND_QUIZ_TEMPLATE);
      LiveQuiz.findAll = vi.fn().mockImplementation(async () => {
        return [liveQuiz];
      });
    });

    const helperJoinQuiz = async (teamName: string) => {
      const team = await liveQuizService.joinQuiz(liveQuiz.userFriendlyId, {
        teamName,
        numberOfPlayers: 1,
      });
      team.liveQuiz = liveQuiz;
      liveQuiz.liveQuizTeams.push(team);
      return team;
    };

    const helperStartQuiz = async () => {
      liveQuizService.assertQuiz = vi.fn().mockImplementation(async () => {
        return liveQuiz;
      });
      await liveQuizService.startLiveQuiz(liveQuiz.id);
      await liveQuizService.setCurrentRoundForLiveQuiz(liveQuiz.id, 1);
      await liveQuizService.setQuizState(
        liveQuiz.id,
        LiveQuizState.STARTED_IN_ROUND
      );
      await liveQuizService.setQuizRoundState(
        liveQuiz.id,
        LiveRoundState.STARTED_ACCEPTING_ANSWERS
      );
    };

    it('allows teams to join', async () => {
      const team1 = await helperJoinQuiz('team1');
      const team2 = await helperJoinQuiz('team2');

      expect(team1).toBeDefined();
      expect(team2).toBeDefined();
      expect(team1?.teamName).toBe('team1');
      expect(team2?.teamName).toBe('team2');
    });

    it('does not allow team with existing name to join', async () => {
      await helperJoinQuiz('team1');
      await expect(helperJoinQuiz('team1')).rejects.toThrow(
        'Team name already exists'
      );
    });

    it('allows a team to submit answers', async () => {
      const team1 = await helperJoinQuiz('team1');
      liveQuizService.findLiveQuizTeamById = vi
        .fn()
        .mockImplementation(async () => {
          return team1;
        });
      liveQuizService.findLiveQuizRoundAnswerByTeamIdAndRoundId = vi
        .fn()
        .mockImplementation(async () => {
          return new LiveQuizRoundAnswers({
            id: randomUUID(),
            liveQuizTeamId: team1.id,
            roundId: liveQuiz.currentRoundNumber,
            answers: '{}',
            answersGraded: '{}',
            didJoker: false,
          });
        });

      await helperStartQuiz();

      const updatedAnswers =
        await liveQuizService.submitAnswersForTeamInCurrentRound(team1.id, {
          submittedAnswers: {
            1: {
              answer1: 'asdf1',
            },
            2: {
              answer1: 'asdf2',
            },
          },
          didJoker: false,
        });

      const answerPayload = JSON.parse(updatedAnswers?.answers as any);
      expect(answerPayload['1'].answer1).toBe('asdf1');
      expect(answerPayload['2'].answer1).toBe('asdf2');
    });

    it('auto-applies joker on the final round when joker has not been used', async () => {
      const team1 = await helperJoinQuiz('team1');
      const quizTemplate = JSON.parse(liveQuiz.quizTemplateJson as string);
      const roundId = quizTemplate.roundOrder[0];

      liveQuizService.findLiveQuizTeamById = vi
        .fn()
        .mockResolvedValue(team1);
      liveQuizService.findAllLiveQuizRoundAnswersForTeam = vi
        .fn()
        .mockResolvedValue([]);
      liveQuizService.findLiveQuizRoundAnswerByTeamIdAndRoundId = vi
        .fn()
        .mockResolvedValue(
          new LiveQuizRoundAnswers({
            id: randomUUID(),
            liveQuizTeamId: team1.id,
            roundId,
            answers: '{}',
            answersGraded: '{}',
            didJoker: false,
          })
        );

      await helperStartQuiz();
      liveQuiz.currentRoundNumber = 1;

      const updatedAnswers =
        await liveQuizService.submitAnswersForTeamInCurrentRound(team1.id, {
          submittedAnswers: {
            1: {
              answer1: 'asdf1',
            },
          },
          didJoker: false,
        });

      expect(updatedAnswers?.didJoker).toBe(true);
    });

    it('does not auto-apply joker on the final round when joker was already used', async () => {
      const team1 = await helperJoinQuiz('team1');
      const round1Id = 'round-1-id';
      const round2Id = 'round-2-id';
      const twoRoundTemplate = {
        ...BASIC_ONE_ROUND_QUIZ_TEMPLATE,
        numRounds: 2,
        roundOrder: [round1Id, round2Id],
        rounds: [
          { ...BASIC_ONE_ROUND_QUIZ_TEMPLATE.rounds![0], id: round1Id },
          {
            ...BASIC_ONE_ROUND_QUIZ_TEMPLATE.rounds![0],
            id: round2Id,
            title: 'Round 2',
          },
        ],
      };
      liveQuiz.quizTemplateJson = JSON.stringify(twoRoundTemplate);

      liveQuizService.findLiveQuizTeamById = vi
        .fn()
        .mockResolvedValue(team1);
      liveQuizService.findAllLiveQuizRoundAnswersForTeam = vi
        .fn()
        .mockResolvedValue([
          new LiveQuizRoundAnswers({
            id: randomUUID(),
            liveQuizTeamId: team1.id,
            roundId: round1Id,
            answers: '{}',
            answersGraded: '{}',
            didJoker: true,
          }),
        ]);
      liveQuizService.findLiveQuizRoundAnswerByTeamIdAndRoundId = vi
        .fn()
        .mockResolvedValue(
          new LiveQuizRoundAnswers({
            id: randomUUID(),
            liveQuizTeamId: team1.id,
            roundId: round2Id,
            answers: '{}',
            answersGraded: '{}',
            didJoker: false,
          })
        );

      await helperStartQuiz();
      liveQuiz.currentRoundNumber = 2;

      const updatedAnswers =
        await liveQuizService.submitAnswersForTeamInCurrentRound(team1.id, {
          submittedAnswers: {
            1: {
              answer1: 'asdf1',
            },
          },
          didJoker: false,
        });

      expect(updatedAnswers?.didJoker).toBe(false);
    });

    it('does not expose internal id of other teams when providing a public state for a team', async () => {
      const team1 = await helperJoinQuiz('team1');
      const team2 = await helperJoinQuiz('team2');

      liveQuizService.findLiveQuizTeamById = vi
        .fn()
        .mockImplementation(async teamId => {
          return teamId === team1.id ? team1 : team2;
        });
      liveQuizService.findLiveQuizRoundAnswerByTeamIdAndRoundId = vi
        .fn()
        .mockImplementation(async teamId => {
          return new LiveQuizRoundAnswers({
            id: randomUUID(),
            liveQuizTeamId: teamId,
            roundId: liveQuiz.currentRoundNumber,
            answers: '{}',
            answersGraded: '{}',
            didJoker: false,
          });
        });
      LiveQuizTeam.findByPk = vi.fn().mockImplementation(async teamId => {
        return teamId === team1.id ? team1 : team2;
      });

      await helperStartQuiz();

      await liveQuizService.submitAnswersForTeamInCurrentRound(team1.id, {
        submittedAnswers: {
          1: {
            answer1: 'asdf1',
          },
          2: {
            answer1: 'asdf2',
          },
        },
        didJoker: false,
      });
      await liveQuizService.submitAnswersForTeamInCurrentRound(team2.id, {
        submittedAnswers: {
          1: {
            answer1: 'asdf3',
          },
          2: {
            answer1: 'asdf4',
          },
        },
        didJoker: false,
      });

      const team1PublicState = await liveQuizService.getPublicLiveQuizState(
        liveQuiz,
        team1.id
      );

      // team1's internal id should be exposed to team 1's public state
      expect(team1PublicState?.teams.find(t => t.id === team1.id)).toBeTruthy();
      // team2's internal id should not be exposed to team 1's public state
      expect(
        team1PublicState?.teams.find(t => t.id === team2.id)
      ).toBeUndefined();
      // ...but team2's public id should be
      expect(
        team1PublicState?.teams.find(t => t.publicId === team2.publicId)
      ).toBeTruthy();
    });
  });

  describe('findLiveQuizByUserFriendlyId and findLiveQuizById', () => {
    it('can find live quiz by user friendly id', async () => {
      const liveQuizService = new LiveQuizService();
      const liveQuiz = new LiveQuiz({
        id: randomUUID(),
        userFriendlyId: 'abc123',
        name: 'Test Quiz',
      });
      LiveQuiz.findAll = vi.fn().mockResolvedValue([liveQuiz]);

      const result =
        await liveQuizService.findLiveQuizByUserFriendlyId('abc123');

      expect(result).toBeDefined();
      expect(result?.userFriendlyId).toBe('abc123');
    });

    it('returns undefined when live quiz not found by user friendly id', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findAll = vi.fn().mockResolvedValue([]);

      const result =
        await liveQuizService.findLiveQuizByUserFriendlyId('nonexistent');

      expect(result).toBeUndefined();
    });

    it('can find live quiz by id', async () => {
      const liveQuizService = new LiveQuizService();
      const liveQuiz = new LiveQuiz({
        id: 'quiz-uuid',
        userFriendlyId: 'abc123',
        name: 'Test',
      });
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(liveQuiz);

      const result = await liveQuizService.findLiveQuizById('quiz-uuid');

      expect(result).toBeDefined();
      expect(result?.id).toBe('quiz-uuid');
    });

    it('assertQuiz returns false when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(null);

      const result = await liveQuizService.assertQuiz('nonexistent');

      expect(result).toBe(false);
    });

    it('assertQuiz returns liveQuiz when found', async () => {
      const liveQuizService = new LiveQuizService();
      const liveQuiz = new LiveQuiz({ id: 'quiz-1', name: 'Test' });
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(liveQuiz);

      const result = await liveQuizService.assertQuiz('quiz-1');

      expect(result).toBe(liveQuiz);
    });
  });

  describe('createLiveQuiz and state transitions', () => {
    it('returns undefined when template not found', async () => {
      const liveQuizService = new LiveQuizService();
      liveQuizService.setTemplateService(mockTemplateService);
      mockTemplateService.findQuizById = vi.fn().mockResolvedValue(undefined);

      const result = await liveQuizService.createLiveQuiz('nonexistent', {
        name: 'Test',
      });

      expect(result).toBeUndefined();
    });

    it('setQuizState returns undefined when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(null);

      const result = await liveQuizService.setQuizState(
        'nonexistent',
        LiveQuizState.STARTED_IN_ROUND
      );

      expect(result).toBeUndefined();
    });

    it('setCurrentRoundForLiveQuiz returns undefined when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(null);

      const result = await liveQuizService.setCurrentRoundForLiveQuiz(
        'nonexistent',
        1
      );

      expect(result).toBeUndefined();
    });

    it('setQuizRoundState returns undefined when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(null);

      const result = await liveQuizService.setQuizRoundState(
        'nonexistent',
        LiveRoundState.STARTED_ACCEPTING_ANSWERS
      );

      expect(result).toBeUndefined();
    });

    it('setQuizState updates quiz when found', async () => {
      const liveQuizService = new LiveQuizService();
      const liveQuiz = new LiveQuiz({
        id: 'quiz-1',
        quizState: LiveQuizState.NOT_STARTED,
      });
      liveQuiz.save = vi.fn().mockResolvedValue(liveQuiz);
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(liveQuiz);

      const result = await liveQuizService.setQuizState(
        'quiz-1',
        LiveQuizState.COMPLETED
      );

      expect(result).toBeDefined();
      expect(liveQuiz.quizState).toBe(LiveQuizState.COMPLETED);
      expect(liveQuiz.save).toHaveBeenCalled();
    });

    it('startLiveQuiz returns undefined when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(null);

      const result = await liveQuizService.startLiveQuiz('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('joinQuiz validation', () => {
    it('throws when quiz not found', async () => {
      const liveQuizService = new LiveQuizService();
      LiveQuiz.findAll = vi.fn().mockResolvedValue([]);

      await expect(
        liveQuizService.joinQuiz('nonexistent', {
          teamName: 'Team1',
          numberOfPlayers: 1,
        })
      ).rejects.toThrow('No quiz exists at the provided id');
    });
  });

  describe('findLiveQuizById with includeSubmitted', () => {
    it('uses include when includeSubmitted is true', async () => {
      const liveQuizService = new LiveQuizService();
      const liveQuiz = new LiveQuiz({ id: 'quiz-1', liveQuizTeams: [] });
      LiveQuiz.findByPk = vi.fn().mockResolvedValue(liveQuiz);

      const result = await liveQuizService.findLiveQuizById('quiz-1', {
        includeSubmitted: true,
      });

      expect(result).toBe(liveQuiz);
      expect(LiveQuiz.findByPk).toHaveBeenCalledWith(
        'quiz-1',
        expect.objectContaining({
          include: expect.any(Array),
        })
      );
    });
  });

  describe('findAllLiveQuizzesByAccountId', () => {
    it('returns empty array when account not found', async () => {
      const liveQuizService = new LiveQuizService();
      (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result =
        await liveQuizService.findAllLiveQuizzesByAccountId('nonexistent');

      expect(result).toEqual([]);
    });

    it('returns liveQuizzes from account', async () => {
      const liveQuizService = new LiveQuizService();
      const mockQuizzes = [{ id: 'lq-1', name: 'Quiz 1' }];
      const mockAccount = {
        getResponseJson: () => ({ liveQuizzes: mockQuizzes }),
      };
      (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAccount
      );

      const result =
        await liveQuizService.findAllLiveQuizzesByAccountId('acc-1');

      expect(result).toHaveLength(1);
      expect(result?.[0]).toEqual(mockQuizzes[0]);
    });

    it('includes completed when includeCompleted is true', async () => {
      const liveQuizService = new LiveQuizService();
      const mockAccount = {
        getResponseJson: () => ({ liveQuizzes: [] }),
      };
      (Account.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAccount
      );

      await liveQuizService.findAllLiveQuizzesByAccountId('acc-1', {
        includeCompleted: true,
      });

      expect(Account.findByPk).toHaveBeenCalledWith(
        'acc-1',
        expect.objectContaining({
          include: expect.any(Array),
        })
      );
    });
  });
});
