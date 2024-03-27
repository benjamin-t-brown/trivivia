import {
  ANSWER_DELIMITER,
  AnswerState,
  AnswerStateGraded,
  LiveQuizRoundAnswersResponse,
  LiveQuizTeamResponse,
  QuestionTemplateResponse,
  RoundTemplateResponse,
  getNumAnswers,
  getRoundAnswersArrays,
} from 'shared/responses';
import * as fastFuzzy from 'fast-fuzzy';

export class AutoGradingService {
  gradeAnswersInRound(
    teamResponse: LiveQuizTeamResponse,
    roundTemplate: RoundTemplateResponse
  ) {
    const { answersArr, teamAnswersArr, orderMattersArr } =
      getRoundAnswersArrays(roundTemplate, teamResponse);

    const roundAnswerObj: Record<string, AnswerStateGraded> = {};

    let questionNumber = 1;
    for (const questionId of roundTemplate.questionOrder) {
      const answersForQuestion =
        answersArr[questionNumber - 1].split(ANSWER_DELIMITER);
      const submittedAnswersForQuestion =
        teamAnswersArr[questionNumber - 1].split(ANSWER_DELIMITER);
      const results = this.checkAnswers(
        answersForQuestion,
        submittedAnswersForQuestion,
        orderMattersArr[questionNumber - 1]
      );
      const answerObj: Partial<AnswerStateGraded> = {};
      for (let i = 0; i < results.length; i++) {
        const answerKey = 'answer' + (i + 1);
        answerObj[answerKey] = results[i];
      }

      roundAnswerObj[questionId] = answerObj as AnswerStateGraded;
      questionNumber++;
    }

    return roundAnswerObj;
  }

  checkAnswers(
    correctAnswers: string[],
    submittedAnswers: string[],
    orderMatters: boolean
  ): ('true' | 'false' | 'unknown')[] {
    const ret: ('true' | 'false' | 'unknown')[] = [];
    for (let i = 0; i < correctAnswers.length; i++) {
      const submittedAnswer = submittedAnswers[i];
      const result = fastFuzzy.search(
        submittedAnswer,
        orderMatters ? [correctAnswers[i]] : correctAnswers,
        {
          returnMatchData: true,
        }
      );
      // console.log(
      //   'RESULT',
      //   submittedAnswer,
      //   orderMatters ? [correctAnswers[i]] : correctAnswers,
      //   result
      // );
      if (result[0]?.score > 0.9) {
        ret.push('true');
      } else if (result[0]?.score > 0.5) {
        ret.push('unknown');
      } else {
        ret.push('false');
      }
    }
    return ret;
  }
}
