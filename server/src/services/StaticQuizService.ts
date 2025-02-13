import {
  LiveQuizPublicQuestionResponse,
  LiveQuizStaticResponse,
  LiveQuizStaticRoundResponse,
  QuizTemplateResponse,
} from 'shared';
import { LiveQuizService } from './LiveQuizService';

export class StaticQuizService {
  private liveQuizService = new LiveQuizService();
  setLiveQuizService(liveQuizService: LiveQuizService) {
    this.liveQuizService = liveQuizService;
  }

  async getStaticQuiz(
    liveQuizUserFriendlyId: string
  ): Promise<LiveQuizStaticResponse | undefined> {
    const liveQuiz = await this.liveQuizService.findLiveQuizByUserFriendlyId(
      liveQuizUserFriendlyId
    );
    if (!liveQuiz) {
      return undefined;
    }

    const staticQuiz: LiveQuizStaticResponse = {
      id: liveQuiz.id,
      userFriendlyId: liveQuiz.userFriendlyId,
      name: liveQuiz.name,
      isComplete: false,
      rounds: [],
      creationDate: liveQuiz.createdAt?.toISOString(),
      startedAt: liveQuiz.startedAt?.toISOString(),
      completedAt: liveQuiz.completedAt?.toISOString(),
    };

    const quizTemplate: QuizTemplateResponse = JSON.parse(
      liveQuiz.quizTemplateJson
    );

    for (const roundId of quizTemplate.roundOrder) {
      const round = quizTemplate.rounds?.find(r => r.id === roundId);
      if (!round) {
        continue;
      }
      const staticRound: LiveQuizStaticRoundResponse = {
        id: roundId,
        roundNumber: quizTemplate.roundOrder.indexOf(roundId),
        totalNumberOfQuestions: round.questionOrder.length,
        title: round.title,
        didJoker: false,
        description: round.description,
        questions: [],
        jokerDisabled: Boolean(round.jokerDisabled),
      };

      for (const questionId of round.questionOrder) {
        const question = round.questions?.find(q => q.id === questionId);
        if (!question) {
          continue;
        }

        const staticQuestion: LiveQuizPublicQuestionResponse = {
          text: question.text,
          answerType: question.answerType,
          answers: question.answers,
          imageLink: question.imageLink,
        };

        staticRound.questions.push(staticQuestion);
      }

      staticQuiz.rounds.push(staticRound);
    }

    return staticQuiz;
  }
}
