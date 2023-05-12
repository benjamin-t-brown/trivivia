import Input from 'elements/Input';
import InputLabel from 'elements/InputLabel';
import React, { ReactNode, useEffect } from 'react';
import {
  AnswerBoxType,
  AnswerState,
  answerStateToString,
  getNumAnswers,
  getNumRadioBoxes,
  QuestionTemplateResponse,
  stringToAnswerState,
} from 'shared/responses';
import { colorsDark, getColors } from 'style';
import HiddenTextField from './HiddenTextField';
import Img from 'elements/Img';

interface EditAnswersProps {
  questionTemplate?: QuestionTemplateResponse;
  formEdited: () => void;
  formId: string;
  isNew?: boolean;
}

const EditAnswers = (props: EditAnswersProps) => {
  const [answerType, setAnswerType] = React.useState(
    props.questionTemplate?.answerType ?? AnswerBoxType.INPUT1
  );
  const [state, dispatch]: [AnswerState, any] = React.useReducer<any>(
    (
      state: AnswerState,
      action: { type: 'answer' | 'radio' | 'reset'; i: number; value: string }
    ) => {
      const form = document.getElementById(
        props.formId
      ) as HTMLFormElement | null;

      if (action.type === 'reset') {
        if (form) {
          return stringToAnswerState(form.elements['answers'].value ?? {});
        }
      } else {
        state[action.type + action.i] = action.value;
      }

      if (form) {
        form.elements['answers'].value = answerStateToString(state);
        props.formEdited();
      }

      return { ...state };
    },
    props.questionTemplate?.answers ?? {}
  ) as any;

  // This syncs the reducer state with the form state.  If it detects that they are different,
  // it resets the reducer state to be equal to the form state
  useEffect(() => {
    const form = document.getElementById(
      props.formId
    ) as HTMLFormElement | null;
    if (form) {
      const stateAnswers = answerStateToString(state);
      const formAnswers = form.elements['answers'].value;
      if (stateAnswers !== formAnswers && !props.isNew) {
        console.log('reset');
        dispatch({
          type: 'reset',
        });
      }
    }
  }, [state, dispatch, props.formId]);

  const handleAnswerBoxChange: React.ChangeEventHandler<
    HTMLSelectElement
  > = ev => {
    setAnswerType(ev.target.value as AnswerBoxType);
  };

  const handleAnswerChange: (
    i: number
  ) => React.ChangeEventHandler<HTMLInputElement> = i => ev => {
    dispatch({
      type: 'answer',
      i,
      value: ev.target.value,
    });
  };

  const handleRadioChange: (
    i: number
  ) => React.ChangeEventHandler<HTMLInputElement> = i => ev => {
    dispatch({
      type: 'radio',
      i,
      value: ev.target.value,
    });
  };

  const numAnswers = getNumAnswers(answerType);
  const numRadioBoxes = getNumRadioBoxes(answerType);

  const answerBoxes: ReactNode[] = [];
  for (let i = 0; i < numAnswers; i++) {
    answerBoxes.push(
      <div key={i}>
        <InputLabel>Answer {i + 1}</InputLabel>
        <Input
          aria-label="Answer"
          type="text"
          defaultValue={state['answer' + (i + 1)]}
          onChange={handleAnswerChange(i + 1)}
          style={{
            width: '75%',
          }}
        />
      </div>
    );
  }

  const radioBoxes: ReactNode[] = [];
  for (let i = 0; i < numRadioBoxes; i++) {
    radioBoxes.push(
      <div key={i}>
        <InputLabel>Radio {i + 1}</InputLabel>
        <Input
          aria-label="Radio"
          type="text"
          defaultValue={state['radio' + (i + 1)]}
          onChange={handleRadioChange(i + 1)}
          style={{
            width: '75%',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <HiddenTextField name="answers" value={answerStateToString(state)} />
      <InputLabel htmlFor="answerType">Answer Type</InputLabel>
      <select
        style={{
          maxWidth: '140px',
          padding: '8px',
          marginTop: '2px',
        }}
        name="answerType"
        defaultValue={answerType}
        onChange={handleAnswerBoxChange}
      >
        <option value={AnswerBoxType.INPUT1}>Input 1</option>
        <option value={AnswerBoxType.INPUT2}>Input 2</option>
        <option value={AnswerBoxType.INPUT3}>Input 3</option>
        <option value={AnswerBoxType.INPUT4}>Input 4</option>
        <option value={AnswerBoxType.INPUT8}>Input 8</option>
        <option value={AnswerBoxType.INPUT16}>Input 16</option>
        <option value={AnswerBoxType.INPUT16_WITH_EXTRA}>Input 16 Extra</option>
        <option value={AnswerBoxType.RADIO2}>Radio 2</option>
        <option value={AnswerBoxType.RADIO3}>Radio 3</option>
        <option value={AnswerBoxType.RADIO4}>Radio 4</option>
        <option value={AnswerBoxType.RADIO8}>Radio 8</option>
      </select>
      <div
        style={{
          margin: '16px 0px',
        }}
      >
        <input
          type="checkbox"
          name="orderMatters"
          id="orderMatters"
          defaultChecked={props.questionTemplate?.orderMatters}
          style={{
            transform: 'scale(1.5)',
          }}
        ></input>
        <label htmlFor="orderMatters">
          {' '}
          The order of these answers matters.{' '}
        </label>
        <br />
        <br />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="checkbox"
            name="isBonus"
            id="isBonus"
            defaultChecked={props.questionTemplate?.isBonus}
            style={{
              transform: 'scale(1.5)',
              marginRight: '8px',
            }}
          ></input>
          <Img
            style={{
              width: '22px',
              marginRight: '8px',
              background: colorsDark.BACKGROUND,
            }}
            alt="star"
            src="/res/allied-star.svg"
          />
          <label htmlFor="isBonus"> This is a bonus question.</label>
        </div>
      </div>
      <div
        id="radio boxes"
        style={{
          border: '1px solid ' + getColors().TEXT_DESCRIPTION,
          padding: '8px',
          display: radioBoxes.length <= 0 ? 'none' : 'block',
        }}
      >
        {radioBoxes}
      </div>
      {radioBoxes.length > 0 ? (
        <div
          style={{
            height: '16px',
            borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
            marginBottom: '16px',
          }}
        ></div>
      ) : null}
      <div
        id="answer-boxes"
        style={{
          border: '1px solid ' + getColors().PRIMARY_TEXT,
          padding: '8px',
        }}
      >
        {answerBoxes}
      </div>
    </>
  );
};

export default EditAnswers;
