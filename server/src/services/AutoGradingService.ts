import {
  ANSWER_DELIMITER,
  AnswerState,
  AnswerStateGraded,
  AnswerStateGradedCertainty,
  RoundTemplateResponse,
  getRoundAnswersArraysByAnswerState,
} from 'shared/responses';
import * as fastFuzzy from 'fast-fuzzy';

export class AutoGradingService {
  // returns an object where each key is a questionId and value is the graded answer object
  async gradeAnswersInRound(
    roundAnswers: Record<string, AnswerState>,
    roundTemplate: RoundTemplateResponse
  ) {
    const { answersArr, teamAnswersArr, orderMattersArr } =
      getRoundAnswersArraysByAnswerState(roundTemplate, roundAnswers);

    const roundAnswerObj: Record<
      string,
      {
        gradeState: AnswerStateGraded;
        certainty: AnswerStateGradedCertainty;
      }
    > = {};

    let questionNumber = 1;
    for (let i = 0; i < roundTemplate.questionOrder.length; i++) {
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
      const certaintyObj: Partial<AnswerStateGradedCertainty> = {};
      for (let i = 0; i < results.length; i++) {
        const { result, certainty } = results[i];
        const answerKey = 'answer' + (i + 1);
        answerObj[answerKey] = result;
        certaintyObj[answerKey] = certainty;
      }

      roundAnswerObj[questionNumber] = {
        gradeState: answerObj as AnswerStateGraded,
        certainty: certaintyObj as AnswerStateGradedCertainty,
      };
      questionNumber++;
    }

    return roundAnswerObj;
  }

  checkAnswers(
    correctAnswers: string[],
    submittedAnswers: string[],
    orderMatters: boolean
  ): {
    result: 'true' | 'false' | 'unknown';
    certainty: number;
  }[] {
    const ret: {
      result: 'true' | 'false' | 'unknown';
      certainty: number;
    }[] = [];
    for (let i = 0; i < correctAnswers.length; i++) {
      const submittedAnswer = submittedAnswers[i];
      const result = fastFuzzy.search(
        submittedAnswer,
        orderMatters ? [correctAnswers[i]] : correctAnswers,
        {
          returnMatchData: true,
        }
      );
      // TODO make this threshold configurable
      if (result[0]?.score > 0.8) {
        ret.push({
          result: 'true',
          certainty: result[0].score,
        });
        // TODO Let's just not account for unknown for now
        // } else if (result[0]?.score > 0.5) {
        //   ret.push({
        //     result: 'unknown',
        //     certainty: result[0].score,
        //   });
      } else {
        ret.push({
          result: 'false',
          certainty: result[0]?.score ?? 0,
        });
      }
    }
    return ret;
  }
}
