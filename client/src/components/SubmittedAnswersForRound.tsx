import React from 'react';
import {
  AnswerState,
  extractAnswerBoxType,
  LiveQuizPublicQuestionResponse,
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
    const question: LiveQuizPublicQuestionResponse | undefined =
      round.questions[i];

    if (question) {
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
    } else {
      // do best to infer what the answer looks like without the question
      const maxAnswers = 16;
      const answerList: string[] = [];
      let didFindOne = false;
      for (let i = maxAnswers; i >= 1; i--) {
        const textAnswer = answers['answer' + i];
        if (textAnswer) {
          answerList.push(textAnswer);
          didFindOne = true;
        } else if (didFindOne) {
          answerList.push('');
        }
      }
      submittedAnswer = answerList.reverse().join(', ');
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
