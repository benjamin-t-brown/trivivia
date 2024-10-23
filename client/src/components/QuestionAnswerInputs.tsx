import Img from 'elements/Img';
import Input from 'elements/Input';
import React, { ReactNode } from 'react';
import {
  AnswerState,
  AnswerStateGraded,
  AnswerStateStats,
  getNumAnswers,
  getNumRadioBoxes,
  LiveQuizPublicQuestionResponse,
} from 'shared/responses';
import { getColors } from 'style';
import { QuestionCorrectAnswers } from './QuestionCorrectAnswers';

export const QuestionAnswerInputs = (props: {
  question: LiveQuizPublicQuestionResponse;
  questionNumber: number;
  disabled?: boolean;
  dispatch: React.Dispatch<any>;
  answersSaved: AnswerState;
  answersQuestion?: AnswerState;
  answersGraded?: Partial<AnswerStateGraded>;
  answersStats?: AnswerStateStats;
  numTeams: number;
}) => {
  const handleAnswerChange: (
    answerNumber: number
  ) => React.ChangeEventHandler<HTMLInputElement> = answerNumber => ev => {
    props.dispatch({
      questionNumber: props.questionNumber,
      type: 'answer',
      i: answerNumber,
      value: ev.target.value,
    });
  };

  const handleRadioChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    props.dispatch({
      questionNumber: props.questionNumber,
      type: 'answer',
      i: 1,
      value: ev.target.value,
    });
  };

  const numAnswers = getNumAnswers(props.question.answerType);
  const numRadioBoxes = getNumRadioBoxes(props.question.answerType);

  const answerBoxes: ReactNode[] = [];

  for (let i = 0; i < numAnswers; i++) {
    const answerKey = 'answer' + (i + 1);

    const style: Record<string, string> = {
      width: '75%',
    };

    let icon;
    if (props.answersGraded || props.answersQuestion) {
      const isCorrectAnswer = props.answersGraded?.[answerKey] === 'true';

      icon = (
        <Img
          style={{
            width: '22px',
            marginRight: '16px',
            background: isCorrectAnswer
              ? getColors().SUCCESS_BACKGROUND
              : getColors().ERROR_BACKGROUND,
          }}
          alt="Answer"
          src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
        />
      );
      style.border = isCorrectAnswer
        ? '1px solid ' + getColors().SUCCESS_TEXT
        : '1px solid ' + getColors().ERROR_TEXT;
    }

    answerBoxes.push(
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
        <Input
          disabled={props.disabled}
          aria-label="Answer"
          type="text"
          value={props.answersSaved[answerKey] ?? ''}
          onChange={handleAnswerChange(i + 1)}
          maxLength={255}
          style={style}
        />
      </div>
    );
  }

  if (answerBoxes.length && props.answersQuestion) {
    answerBoxes.push(
      <QuestionCorrectAnswers
        key={'answer' + props.questionNumber}
        correctAnswers={
          Object.keys(props.question.answers ?? {})
            .sort()
            .map(i => props.question?.answers?.[i]) ?? []
        }
        answersStats={props.answersStats}
        numTeams={props.numTeams}
      />
    );
  }

  const radioBoxes: ReactNode[] = [];
  const radioName = 'radio' + props.questionNumber;
  const radioAnswerKey = 'answer1';
  for (let i = 0; i < numRadioBoxes; i++) {
    const value = props.answersQuestion?.['radio' + (i + 1)] ?? '';
    const id = props.questionNumber + '-' + i + '-' + value;

    const style: Record<string, string> = {
      width: '75%',
    };
    const checked = props.answersSaved?.[radioAnswerKey] === value;

    let icon;
    if (props.answersGraded || props.answersStats) {
      const isCorrectAnswer = props.answersGraded?.[radioAnswerKey] === 'true';
      if (props.answersGraded?.[radioAnswerKey] === 'true' && checked) {
        style.border = '1px solid ' + getColors().SUCCESS_TEXT;
        icon = (
          <Img
            style={{
              width: '22px',
              marginRight: '16px',
              background: isCorrectAnswer
                ? getColors().SUCCESS_BACKGROUND
                : getColors().ERROR_BACKGROUND,
            }}
            alt="Answer"
            src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
          />
        );
      }
      if (props.answersGraded?.[radioAnswerKey] === 'false' && checked) {
        style.border = '1px solid ' + getColors().ERROR_TEXT;
        icon = (
          <Img
            style={{
              width: '22px',
              marginRight: '16px',
              background: isCorrectAnswer
                ? getColors().SUCCESS_BACKGROUND
                : getColors().ERROR_BACKGROUND,
            }}
            alt="Answer"
            src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
          />
        );
      }
    }

    radioBoxes.push(
      <div
        key={'radio' + i}
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '9px 0px',
          padding: '8px',
          ...style,
        }}
      >
        {icon}
        <Input
          type="radio"
          checked={checked}
          id={id}
          value={value}
          name={radioName}
          onChange={props.disabled ? () => void 0 : handleRadioChange}
          style={{
            transform: 'scale(1.5)',
            pointerEvents: props.disabled ? 'none' : 'auto',
          }}
        />
        <label
          htmlFor={id}
          style={{
            marginLeft: '16px',
          }}
        >
          {value}
        </label>
      </div>
    );
  }

  if (radioBoxes.length && props.question.answers?.[radioAnswerKey]) {
    radioBoxes.push(
      <QuestionCorrectAnswers
        key={'radio-answer' + props.questionNumber}
        correctAnswers={[props.question.answers?.[radioAnswerKey]]}
        answersStats={props.answersStats}
        numTeams={props.numTeams}
      />
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: getColors().BACKGROUND2,
        margin: '4px 0px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        {props.questionNumber}.{' '}
        {props.question.text.split('\n').map((line, i) => {
          return (
            <React.Fragment key={i}>
              <span key={i} dangerouslySetInnerHTML={{ __html: line }}></span>
              <br />
            </React.Fragment>
          );
        })}
      </div>
      {props.question.imageLink ? (
        props.question.imageLink.includes('<iframe ') ? (
          <div
            dangerouslySetInnerHTML={{ __html: props.question.imageLink }}
          ></div>
        ) : (
          <Img
            style={{
              width: '100%',
            }}
            src={props.question.imageLink}
            alt="Question"
          />
        )
      ) : null}
      <div
        style={{
          marginLeft: '16px',
          marginTop: '24px',
        }}
      >
        {radioBoxes}
        {radioBoxes?.length === 0 ? answerBoxes : null}
      </div>
    </div>
  );
};
