// TODO Just delete this and do it better

import Img from 'elements/Img';
import Input from 'elements/Input';
import React, { ReactNode } from 'react';
import {
  AnswerState,
  AnswerStateGraded,
  AnswerStateStats,
  extractAnswerBoxType,
  getNumAnswers,
  getNumCorrectAnswers,
  getNumRadioBoxes,
  isLegacyAnswerBoxType,
  LiveQuizPublicQuestionResponse,
} from 'shared/responses';
import { getColors } from 'style';
import { QuestionCorrectAnswers } from './QuestionCorrectAnswers';
import InputLabel from 'elements/InputLabel';

type GradeResult = 'UNSET' | 'CORRECT' | 'INCORRECT' | 'MIXED';

interface SingleAnswerProps {
  i: number;
  disabled?: boolean;
  gradeResult: GradeResult;
  value: string;
  hideStatsForAnswers?: boolean;
}

const InputAnswer = (
  props: SingleAnswerProps & {
    handleChange: (
      answerNumber: number
    ) => React.ChangeEventHandler<HTMLInputElement>;
  }
) => {
  const style: Record<string, string> = {
    maxWidth: '500px',
  };
  let icon;
  if (!props.hideStatsForAnswers && props.gradeResult !== 'UNSET') {
    const isCorrectAnswer = props.gradeResult === 'CORRECT';
    const isMixedAnswer = props.gradeResult === 'MIXED';

    icon = (
      <Img
        style={{
          width: '22px',
          marginRight: '16px',
          background: isMixedAnswer
            ? getColors().WARNING_BACKGROUND
            : isCorrectAnswer
            ? getColors().SUCCESS_BACKGROUND
            : getColors().ERROR_BACKGROUND,
        }}
        alt="Answer"
        src={
          isMixedAnswer
            ? '/res/warning.svg'
            : isCorrectAnswer
            ? '/res/check-mark.svg'
            : '/res/cancel.svg'
        }
      />
    );
    style.border = isMixedAnswer
      ? '1px solid ' + getColors().WARNING_TEXT
      : isCorrectAnswer
      ? '1px solid ' + getColors().SUCCESS_TEXT
      : '1px solid ' + getColors().ERROR_TEXT;
  }

  return (
    <div
      key={props.i}
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
        // value={props.value}
        // onChange={props.handleChange(props.i + 1)}
        maxLength={255}
        fullWidth
        style={style}
      />
    </div>
  );
};

const RadioAnswer = (props: SingleAnswerProps) => {};

const CheckboxAnswer = (
  props: SingleAnswerProps & {
    text: string;
    checked: boolean;
    otherAnswers: AnswerState;
    maxNumsToCheck: number;
    handleChange: (
      answerNumber: number,
      maxNumsToCheck: number,
      otherAnswers: AnswerState
    ) => React.ChangeEventHandler<HTMLInputElement>;
  }
) => {
  const style: Record<string, string> = {
    maxWidth: '500px',
    transform: 'scale(1.5)',
    marginRight: '16px',
  };
  let border = 'unset';
  let icon;
  if (!props.hideStatsForAnswers && props.gradeResult !== 'UNSET') {
    const isCorrectAnswer = props.gradeResult === 'CORRECT';

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
    border = isCorrectAnswer
      ? '1px solid ' + getColors().SUCCESS_TEXT
      : '1px solid ' + getColors().ERROR_TEXT;
  }

  return (
    <div
      key={props.i}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '75%',
        padding: '8px',
        border: border,
        fontSize: '16px',
      }}
    >
      <input
        type="checkbox"
        disabled={props.disabled}
        // checked={Boolean(props.checked)}
        // onChange={props.handleChange(
        //   props.i + 1,
        //   props.maxNumsToCheck,
        //   props.otherAnswers
        // )}
        style={style}
        id={props.i + props.text}
        name={props.i + props.text}
      />
      {icon}
      <InputLabel htmlFor={props.i + props.text}>{props.text}</InputLabel>
    </div>
  );
};

export const QuestionAnswerInputsStatic = (props: {
  question: LiveQuizPublicQuestionResponse;
  questionNumber: number;
  disabled?: boolean;
  dispatch: React.Dispatch<any>;
  answersSaved: AnswerState;
  answersQuestion?: AnswerState;
  answersGraded?: Partial<AnswerStateGraded>;
  answersStats?: AnswerStateStats;
  numTeams: number;
  hideStatsForAnswers?: boolean;
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

  const handleCheckboxChange: (
    answerNumber: number,
    maxNumsToCheck: number,
    otherAnswers: AnswerState
  ) => React.ChangeEventHandler<HTMLInputElement> =
    (answerNumber, maxNumsToCheck, otherAnswers) => ev => {
      const isChecked = Boolean(ev.target.checked);
      let numAnswersAlreadyChecked = 0;
      for (let i = 0; i < 16; i++) {
        const key = 'answer' + (i + 1);
        if (otherAnswers[key] === 'true') {
          numAnswersAlreadyChecked++;
        }
      }
      if (isChecked && numAnswersAlreadyChecked >= maxNumsToCheck) {
        props.dispatch({
          questionNumber: props.questionNumber,
          type: 'answer',
          i: answerNumber,
          value: 'false',
        });
      } else {
        props.dispatch({
          questionNumber: props.questionNumber,
          type: 'answer',
          i: answerNumber,
          value: isChecked ? 'true' : 'false',
        });
      }
    };

  const numAnswers = getNumAnswers(props.question.answerType);
  const numRadioBoxes = getNumRadioBoxes(props.question.answerType);

  const answerBoxes: ReactNode[] = [];

  if (isLegacyAnswerBoxType(props.question.answerType)) {
    for (let i = 0; i < numAnswers; i++) {
      const answerKey = 'answer' + (i + 1);

      const style: Record<string, string> = {
        maxWidth: '500px',
      };

      let icon;
      if (
        !props.hideStatsForAnswers &&
        (props.answersGraded || props.answersQuestion)
      ) {
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
            // value={props.answersSaved[answerKey] ?? ''}
            // onChange={handleAnswerChange(i + 1)}
            maxLength={255}
            fullWidth
            style={style}
          />
        </div>
      );
    }
    if (answerBoxes.length && props.answersQuestion && props.answersGraded) {
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
          hideStatsForAnswers={props.hideStatsForAnswers}
        />
      );
    }
  } else {
    const [extractedAnswerType, numInputs, numCorrectAnswers] =
      extractAnswerBoxType(props.question.answerType);
    if (extractedAnswerType === 'input') {
      if (numCorrectAnswers < numInputs && props.answersQuestion) {
        let numberOfGradedCorrectAnswers = 0;
        for (let i = 0; i < numCorrectAnswers; i++) {
          if (props.answersGraded?.['answer' + (i + 1)] === 'true') {
            numberOfGradedCorrectAnswers++;
          }
        }
        answerBoxes.push(
          <div key={'answer-info-' + props.questionNumber}>
            You got{' '}
            <span
              style={{
                color:
                  numberOfGradedCorrectAnswers < numCorrectAnswers
                    ? getColors().WARNING_TEXT
                    : getColors().SUCCESS_TEXT,
              }}
            >
              {numberOfGradedCorrectAnswers}
            </span>{' '}
            of <span>{numCorrectAnswers}</span> correct.
          </div>
        );
      }
      for (let i = 0; i < numAnswers; i++) {
        const answerKey = 'answer' + (i + 1);
        let gradeResult = 'UNSET' as GradeResult;
        if (props.answersGraded || props.answersQuestion) {
          gradeResult =
            props.answersGraded?.[answerKey] === 'true'
              ? 'CORRECT'
              : 'INCORRECT';
          if (numCorrectAnswers < numInputs) {
            let numAnswersGradedAsCorrect = 0;
            for (let i = 0; i < numAnswers; i++) {
              if (props.answersGraded?.['answer' + (i + 1)] === 'true') {
                numAnswersGradedAsCorrect++;
              }
            }
            if (numAnswersGradedAsCorrect === numCorrectAnswers) {
              gradeResult = 'CORRECT';
            } else if (numAnswersGradedAsCorrect < numCorrectAnswers) {
              gradeResult = 'MIXED';
            } else {
              gradeResult = 'INCORRECT';
            }
          }
        }

        answerBoxes.push(
          <InputAnswer
            i={i}
            key={i}
            disabled={props.disabled}
            gradeResult={gradeResult}
            value={props.answersSaved[answerKey] ?? ''}
            handleChange={handleAnswerChange}
            hideStatsForAnswers={props.hideStatsForAnswers}
          />
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
            hideStatsForAnswers={props.hideStatsForAnswers}
          />
        );
      }
    } else if (extractedAnswerType === 'checkbox') {
      const maxNumsToCheck = getNumCorrectAnswers(props.question.answerType);

      // graded answers have keys which go from answer1-answerN where N is the number of
      // correct answers, but checkbox fields could have more than N fields checked, so this
      // function maps those 1-N to the keys which were checked by the team that submitted
      const mapGradedAnswersToSubmittedAnswers = (
        graded?: Partial<AnswerStateGraded>,
        submitted?: AnswerState
      ) => {
        if (!graded || !submitted) {
          return undefined;
        }

        const obj: Partial<AnswerStateGraded> = {};
        let numChoicesChecked = 0;
        const [, numInputs] = extractAnswerBoxType(props.question.answerType);
        for (let i = 0; i < numInputs; i++) {
          const didTeamChooseThisField =
            submitted['answer' + (i + 1)] === 'true';
          if (didTeamChooseThisField) {
            const wasGradedCorrectAnswer =
              graded['answer' + (numChoicesChecked + 1)] === 'true';
            if (wasGradedCorrectAnswer) {
              obj['answer' + (i + 1)] = 'true';
            } else {
              obj['answer' + (i + 1)] = 'false';
            }
            numChoicesChecked++;
          }
        }
        return obj;
      };

      const mappedGraded = mapGradedAnswersToSubmittedAnswers(
        props.answersGraded,
        props.answersSaved
      );

      for (let i = 0; i < numAnswers; i++) {
        const radioKey = 'radio' + (i + 1);
        const answerKey = 'answer' + (i + 1);
        let gradeResult = 'UNSET' as GradeResult;
        if (mappedGraded?.[answerKey] !== undefined) {
          gradeResult =
            mappedGraded?.[answerKey] === 'true' ? 'CORRECT' : 'INCORRECT';
        }
        answerBoxes.push(
          <CheckboxAnswer
            i={i}
            key={i}
            checked={props.answersSaved[answerKey] === 'true'}
            text={props.question.answers?.[radioKey] ?? ''}
            disabled={props.disabled}
            gradeResult={gradeResult}
            value={props.answersSaved[answerKey] ?? ''}
            handleChange={handleCheckboxChange}
            otherAnswers={props.answersSaved}
            maxNumsToCheck={maxNumsToCheck}
          />
        );
      }

      if (mappedGraded) {
        const numCorrectAnswers = getNumCorrectAnswers(
          props.question.answerType
        );
        const correctAnswers: string[] = [];
        for (let i = 0; i < numCorrectAnswers; i++) {
          const answerValue = props.question.answers?.['answer' + (i + 1)];
          correctAnswers.push(answerValue ?? '');
        }
        answerBoxes.push(
          <QuestionCorrectAnswers
            key={'radio-answer' + props.questionNumber}
            correctAnswers={correctAnswers}
            answersStats={props.answersStats}
            numTeams={props.numTeams}
            hideStatsForAnswers={props.hideStatsForAnswers}
          />
        );
      }
    }
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
    if (
      !props.hideStatsForAnswers &&
      (props.answersGraded || props.answersStats)
    ) {
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
        <Input
          type="radio"
          // checked={checked}
          id={id}
          // value={value}
          name={radioName}
          // onChange={props.disabled ? () => void 0 : handleRadioChange}
          style={{
            transform: 'scale(1.5)',
            pointerEvents: props.disabled ? 'none' : 'auto',
            marginRight: '16px',
          }}
        />
        {icon}
        <label htmlFor={id} style={{}}>
          {value}
        </label>
      </div>
    );
  }

  if (
    numRadioBoxes &&
    radioBoxes.length &&
    props.question.answers?.[radioAnswerKey] &&
    props.answersGraded
  ) {
    radioBoxes.push(
      <QuestionCorrectAnswers
        key={'radio-answer' + props.questionNumber}
        correctAnswers={[props.question.answers?.[radioAnswerKey]]}
        answersStats={props.answersStats}
        numTeams={props.numTeams}
        hideStatsForAnswers={props.hideStatsForAnswers}
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
