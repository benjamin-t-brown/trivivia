import { fetchAsync } from 'actions';
import { GradeInputState } from 'shared/requests';
import {
  extractAnswerBoxType,
  getNumAnswers,
  GradeOutputState,
  isLegacyAnswerBoxType,
  RoundTemplateResponse,
} from 'shared/responses';

export const areAllAnswersGradedForTeamRound = (args: {
  state: GradeInputState;
  teamId: string;
  roundId: string;
  roundTemplate: RoundTemplateResponse;
  answersArr: string[];
}) => {
  const roundGradeState = args.state[args.teamId][args.roundId];

  if (!roundGradeState) {
    return false;
  }

  for (let i = 0; i < args.answersArr.length; i++) {
    const questionId = args.roundTemplate.questionOrder[i];
    const questionTemplate = args.roundTemplate.questions?.find(
      q => q.id === questionId
    );
    if (!questionTemplate) {
      return false;
    }

    if (isLegacyAnswerBoxType(questionTemplate.answerType)) {
      const numAnswers = getNumAnswers(questionTemplate.answerType);

      const questionGradeState = roundGradeState[i + 1];

      if (!questionGradeState) {
        return false;
      }

      for (let j = 0; j < numAnswers; j++) {
        if (questionGradeState['answer' + (j + 1)] === undefined) {
          return false;
        }
      }
    } else {
      const [type, numInputs, numCorrectAnswers] = extractAnswerBoxType(
        questionTemplate.answerType
      );

      const questionGradeState = roundGradeState[i + 1];

      if (!questionGradeState) {
        return false;
      }

      if (type === 'input') {
        if (numCorrectAnswers > numInputs) {
          for (let j = 0; j < numInputs; j++) {
            if (questionGradeState['answer' + (j + 1)] === undefined) {
              return false;
            }
          }
        } else {
          for (let j = 0; j < numCorrectAnswers; j++) {
            if (questionGradeState['answer' + (j + 1)] === undefined) {
              return false;
            }
          }
        }
      } else {
        for (let j = 0; j < numCorrectAnswers; j++) {
          if (questionGradeState['answer' + (j + 1)] === undefined) {
            return false;
          }
        }
      }
    }
  }
  return true;
};
