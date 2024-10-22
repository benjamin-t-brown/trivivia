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

import { QuizTemplate } from '../src/models/QuizTemplate';
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
});
