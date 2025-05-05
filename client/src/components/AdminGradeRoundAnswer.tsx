import Img from 'elements/Img';
import Input from 'elements/Input';
import React from 'react';
import { GradeCertaintyState } from 'routes/LiveQuizAdminGrading';
import { GradeInputState } from 'shared/requests';
import {
  ANSWER_DELIMITER,
  AnswerBoxType,
  extractAnswerBoxType,
  getNumAnswers,
  getNumCorrectAnswers,
  isLegacyAnswerBoxType,
  LiveQuizTeamResponse,
  QuestionTemplateResponse,
} from 'shared/responses';
import { colorsDark, getColors } from 'style';
import styled from 'styled-components';

const CustomRadioInput = styled.div(() => {
  return {
    margin: '4px',
    display: 'flex',
  };
});

const formatNumber = (num?: number) => {
  if (num === undefined) {
    return '';
  }
  return num.toFixed(2);
};

const getMatchScoreColor = (score: number) => {
  if (score >= 0.9) {
    return 'rgba(0, 255, 0, 1)';
  } else if (score > 0.8) {
    return 'rgba(55, 200, 0, 1)';
    // } else if (score > 0.7) {
    //   return 'rgba(100, 150, 75, 1)';
    // } else if (score > 0.6) {
    //   return 'rgba(100, 150, 40, 1)';
  } else if (score > 0.5) {
    return 'rgba(156, 156, 0, 1)';
  } else if (score > 0.4) {
    return 'rgba(200, 100, 0, 1)';
  } else if (score > 0.3) {
    return 'rgba(200, 75, 75, 1)';
  } else {
    return 'rgba(255, 0, 0, 1)';
  }
};

export const AdminGradeRoundAnswer = (props: {
  questionNumber: number;
  teamAnswers: string;
  correctAnswers: string;
  orderMatters: boolean;
  questionTemplate?: QuestionTemplateResponse;
  setGradeForAnswer: (args: {
    teamId: string;
    roundId: string;
    questionNumber: number;
    answerNumber: number;
    isCorrect: boolean;
  }) => void;
  team: LiveQuizTeamResponse;
  roundId: string;
  state: GradeInputState;
  certaintyState: GradeCertaintyState;
}) => {
  const individualAnswersSubmitted = props.teamAnswers.split(ANSWER_DELIMITER);
  const individualAnswersCorrect = props.correctAnswers.split(ANSWER_DELIMITER);
  const gradeState =
    props.state[props.team.id][props.roundId][props.questionNumber] ?? {};
  const certaintyState =
    props.certaintyState?.[props.team.id]?.[props.roundId]?.[
      props.questionNumber
    ] ?? {};

  let numCorrectAnswers = 0;

  if (
    isLegacyAnswerBoxType(props.questionTemplate?.answerType as AnswerBoxType)
  ) {
    numCorrectAnswers = props.questionTemplate?.answerType
      ? getNumAnswers(props.questionTemplate?.answerType)
      : individualAnswersCorrect.length;
  } else {
    numCorrectAnswers = getNumCorrectAnswers(
      props.questionTemplate?.answerType as AnswerBoxType
    );
    const [type, numInputs, numCorrectAns] = extractAnswerBoxType(
      props.questionTemplate?.answerType as AnswerBoxType
    );
    if (type === 'input') {
      if (numInputs < numCorrectAns) {
        numCorrectAnswers = numInputs;
      }
    }
  }

  const handleAnswerGradeChange: (
    i: number,
    isCorrect: boolean
  ) => React.ChangeEventHandler<HTMLInputElement> =
    (i: number, isCorrect: boolean) => ev => {
      props.setGradeForAnswer({
        roundId: props.roundId,
        teamId: props.team.id,
        questionNumber: props.questionNumber,
        answerNumber: i,
        isCorrect,
      });
    };

  return (
    <div
      style={{
        margin: '4px 0px',
        borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
        paddingBottom: '4px',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        {props.questionNumber}.{' '}
        <span
          style={{
            color: getColors().TEXT_DEFAULT,
            background: getColors().BACKGROUND2,
          }}
        >
          Correct Answer/s: &quot;
          <span
            style={{
              color: getColors().PRIMARY_TEXT,
            }}
          >
            {props.correctAnswers}
          </span>
          &quot;
        </span>
        {props.orderMatters && <div>Order Matters!</div>}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {new Array(numCorrectAnswers).fill(numCorrectAnswers).map((_, i) => {
          const submittedAnswer = individualAnswersSubmitted[i];

          const correctId =
            props.team.id +
            '.' +
            props.roundId +
            '.' +
            props.questionNumber +
            '_answer-' +
            (i + 1) +
            '-correct';
          const incorrectId =
            props.team.id +
            '.' +
            props.roundId +
            '.' +
            props.questionNumber +
            '_answer-' +
            (i + 1) +
            '-incorrect';

          const gradeKey = 'answer' + (i + 1);
          return (
            <div
              key={i}
              style={{
                padding: '4px',
                border:
                  '1px solid ' +
                  (gradeState[gradeKey] === undefined
                    ? getColors().BACKGROUND2
                    : getColors().PRIMARY),
                minWidth: '142px',
                background: getColors().BACKGROUND,
              }}
            >
              {submittedAnswer ? (
                <span style={{ color: getColors().TEXT_DEFAULT }}>
                  {submittedAnswer}
                </span>
              ) : (
                <span style={{ color: getColors().WARNING_TEXT }}>
                  {'(blank)'}
                </span>
              )}
              <div>
                {gradeState[gradeKey] === 'true' ? (
                  <div
                    style={{
                      color: getColors().SUCCESS_TEXT,
                      fontSize: '12px',
                    }}
                  >
                    Correct
                  </div>
                ) : null}
                {gradeState[gradeKey] === 'false' ? (
                  <div
                    style={{
                      color: getColors().ERROR_TEXT,
                      fontSize: '12px',
                    }}
                  >
                    Incorrect
                  </div>
                ) : null}
                {gradeState[gradeKey] === undefined ? (
                  <div
                    style={{
                      color: getColors().TEXT_DESCRIPTION,
                      fontSize: '12px',
                    }}
                  >
                    (not graded)
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: 'flex',
                }}
              >
                <CustomRadioInput>
                  <Input
                    type="radio"
                    id={correctId}
                    name={correctId}
                    checked={gradeState[gradeKey] === 'true'}
                    onChange={handleAnswerGradeChange(i + 1, true)}
                    style={{
                      transform: 'scale(1.5)',
                      cursor: 'pointer',
                    }}
                  />
                  <label htmlFor={correctId}>
                    <div
                      style={{
                        width: '16px',
                        display: 'inline-block',
                        cursor: 'pointer',
                      }}
                    ></div>
                    <Img
                      draggable={false}
                      style={{
                        width: '22px',
                        height: '22px',
                        cursor: 'pointer',
                        background:
                          gradeState[gradeKey] === 'true'
                            ? getColors().SUCCESS_BACKGROUND
                            : colorsDark.BACKGROUND,
                      }}
                      alt="Correct"
                      src="/res/check-mark.svg"
                    />
                  </label>
                </CustomRadioInput>
                <CustomRadioInput>
                  <Input
                    type="radio"
                    id={incorrectId}
                    name={correctId}
                    checked={gradeState[gradeKey] === 'false'}
                    onChange={handleAnswerGradeChange(i + 1, false)}
                    style={{
                      transform: 'scale(1.5)',
                      cursor: 'pointer',
                    }}
                  />
                  <label htmlFor={incorrectId}>
                    <div
                      style={{
                        width: '16px',
                        display: 'inline-block',
                        cursor: 'pointer',
                      }}
                    ></div>
                    <Img
                      draggable={false}
                      style={{
                        width: '22px',
                        height: '22px',
                        background:
                          gradeState[gradeKey] === 'false'
                            ? getColors().ERROR_BACKGROUND
                            : colorsDark.BACKGROUND,
                      }}
                      alt="Incorrect"
                      src="/res/cancel.svg"
                    />
                  </label>
                </CustomRadioInput>
              </div>
              {certaintyState[gradeKey] === undefined ? undefined : (
                <div
                  style={{
                    color: getMatchScoreColor(certaintyState[gradeKey]),
                  }}
                >
                  Match Score: {formatNumber(certaintyState[gradeKey])}
                </div>
              )}
            </div>
          );
        })}{' '}
      </div>
    </div>
  );
};
