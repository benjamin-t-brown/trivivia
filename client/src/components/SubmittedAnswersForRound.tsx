import React from 'react';
import { AnswerState, LiveQuizPublicStateResponse } from 'shared/responses';
import { getColors } from 'style';

export const SubmittedAnswersForRound = (props: {
  submittedAnswersRound: Record<string, AnswerState>;
  quizState: LiveQuizPublicStateResponse;
}) => {
  const aggAnswers: Record<string, string> = {};
  const maxAnswers = Object.keys(props.submittedAnswersRound).reduce(
    (prev, curr) => {
      const n = Number(curr);
      return Math.max(n, prev);
    },
    16
  );
  for (let questionI = 1; questionI <= maxAnswers; questionI++) {
    const answers = props.submittedAnswersRound[questionI];
    if (!answers) {
      continue;
    }
    aggAnswers[questionI] = '';
    for (let answerI = 1; answerI <= maxAnswers; answerI++) {
      const answerText = answers['answer' + answerI];
      if (answerText) {
        aggAnswers[questionI] +=
          (aggAnswers[questionI] === '' ? '' : ', ') + answerText;
      }
    }
  }

  const numQuestions = props?.quizState?.round?.totalNumberOfQuestions ?? 0;

  const answerList: string[] = [];
  for (let i = 0; i < numQuestions; i++) {
    if (aggAnswers[i + 1]) {
      answerList.push(aggAnswers[i + 1]);
    } else {
      answerList.push('');
    }
  }
  return (
    <div
      style={{
        textAlign: 'left',
        display: Object.keys(aggAnswers).length === 0 ? 'none' : 'block',
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
      {answerList.map((answer, i) => {
        return (
          <div
            key={i + 1}
            style={{
              width: '75%',
            }}
          >
            {Number(i + 1)}. {answer}
          </div>
        );
      })}
    </div>
  );
};
