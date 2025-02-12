import React from 'react';
import {
  AnswerState,
  extractAnswerBoxType,
  isLegacyAnswerBoxType,
  LiveQuizPublicStateResponse,
} from 'shared/responses';
import { getColors } from 'style';

export const SubmittedAnswersForRound = (props: {
  submittedAnswersRound: Record<string, AnswerState>;
  quizState: LiveQuizPublicStateResponse;
}) => {
  const concatStr = (str1: string, str2: string, sep: string) => {
    return str1 + (str1 === '' ? '' : sep) + str2;
  };

  const round = props.quizState.round;
  if (!round || Object.keys(props.submittedAnswersRound).length === 0) {
    return <div></div>;
  }
  const numQuestions = round.totalNumberOfQuestions;

  // populate answerList strings with concatenated answers
  const answerStrings: string[] = [];
  for (let i = 0; i < numQuestions; i++) {
    const answers = props.submittedAnswersRound[i + 1];
    if (!answers) {
      answerStrings.push('');
      continue;
    }
    let submittedAnswer = '';
    const question = round.questions[i];
    const [type, numInputs] = extractAnswerBoxType(question.answerType);
    if (type === 'input') {
      for (let j = 0; j < numInputs; j++) {
        const answerText = answers['answer' + (j + 1)] ?? '';
        submittedAnswer = concatStr(submittedAnswer, answerText, ', ');
      }
    } else if (type === 'radio') {
      const answerText = answers['answer1'] ?? '';
      submittedAnswer = answerText;
    } else if (type === 'checkbox') {
      for (let j = 0; j < numInputs; j++) {
        const didPickThisAnswer = answers['answer' + (j + 1)] === 'true';
        if (didPickThisAnswer) {
          const answerText = question.answers?.['radio' + (j + 1)] ?? '';
          submittedAnswer = concatStr(submittedAnswer, answerText, ', ');
        }
      }
    }
    answerStrings.push(submittedAnswer);
  }

  return (
    <div
      style={{
        textAlign: 'left',
        display: !answerStrings.length ? 'none' : 'block',
      }}
    >
      <div
        style={{
          color: getColors().TEXT_DESCRIPTION,
          marginBottom: '8px',
          marginTop: '8px',
        }}
      >
        Submitted Answers:
      </div>
      {answerStrings.map((concatenatedAnswer, i) => {
        return (
          <div
            key={i + 1}
            style={{
              width: '75%',
            }}
          >
            {Number(i + 1)}. {concatenatedAnswer}
          </div>
        );
      })}
    </div>
  );
};
