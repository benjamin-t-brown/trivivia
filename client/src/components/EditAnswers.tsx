import Input from 'elements/Input';
import InputLabel from 'elements/InputLabel';
import React, { ReactNode, useEffect } from 'react';
import {
  AnswerBoxType,
  AnswerState,
  answerStateToString,
  buildAnswerBoxType,
  extractAnswerBoxType,
  getGenericAnswerType,
  getNumAnswers,
  getNumCorrectAnswers,
  getNumRadioBoxes,
  isLegacyAnswerBoxType,
  QuestionTemplateResponse,
  stringToAnswerState,
} from 'shared/responses';
import { colorsDark, getColors } from 'style';
import HiddenTextField from './HiddenTextField';
import Img from 'elements/Img';
import IconLeft from 'elements/IconLeft';
import IconRight from 'elements/IconRight';

interface EditAnswersProps {
  questionTemplate?: QuestionTemplateResponse;
  answerType: AnswerBoxType;
  setAnswerType: (answerType: AnswerBoxType) => void;
  formEdited: () => void;
  formId: string;
  isNew?: boolean;
}

const EditAnswers = (props: EditAnswersProps) => {
  const { answerType, setAnswerType } = props;
  const [state, dispatch]: [AnswerState, any] = React.useReducer(
    (
      state: AnswerState,
      action: { type: 'answer' | 'radio' | 'reset'; i: number; value: string }
    ) => {
      const form = document.getElementById(
        props.formId
      ) as HTMLFormElement | null;

      if (action.type === 'reset') {
        if (form) {
          const state = stringToAnswerState(
            form.elements['answers'].value ?? {}
          );
          return state;
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
      const formAnswerType = form.elements['answerType'].value;
      if (stateAnswers !== formAnswers && !props.isNew) {
        dispatch({
          type: 'reset',
        });
        setAnswerType(formAnswerType as AnswerBoxType);
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

  const handleNumAnswersChange: React.ChangeEventHandler<
    HTMLSelectElement
  > = ev => {
    if (isLegacyAnswerBoxType(answerType)) {
      return;
    }

    const [type, , numCorrectAnswers] = extractAnswerBoxType(answerType);
    const nextNumAnswers = parseInt(ev.target.value);

    if (type === 'radio') {
      // radio inputs can only have 1 correct answer
      const nextAnswerType = buildAnswerBoxType(type, nextNumAnswers, 1);
      setAnswerType(nextAnswerType);
    } else {
      const nextAnswerType = buildAnswerBoxType(
        type,
        nextNumAnswers,
        numCorrectAnswers
      );
      setAnswerType(nextAnswerType);
    }
  };

  const handleNumCorrectAnswersChange: React.ChangeEventHandler<
    HTMLSelectElement
  > = ev => {
    if (isLegacyAnswerBoxType(answerType)) {
      return;
    }

    const [type, numAnswers] = extractAnswerBoxType(answerType);
    const nextNumCorrectAnswers = parseInt(ev.target.value);
    const nextAnswerType = buildAnswerBoxType(
      type,
      numAnswers,
      nextNumCorrectAnswers
    );
    setAnswerType(nextAnswerType);
  };

  const genericAnswerType = getGenericAnswerType(answerType);
  const numAnswers = getNumAnswers(answerType);
  const numRadioBoxes = getNumRadioBoxes(answerType);
  const numListAnswers = getNumCorrectAnswers(answerType);
  console.log('render answers', answerType);

  const answerBoxes: ReactNode[] = [];
  if (isLegacyAnswerBoxType(answerType)) {
    if (numAnswers !== numListAnswers) {
      for (let i = 0; i < 8; i++) {
        answerBoxes.push(
          <div key={i}>
            <InputLabel>Potential Answer {i + 1}</InputLabel>
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
    } else {
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
    }
  } else {
    for (let i = 0; i < numListAnswers; i++) {
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

  const checkBoxes: ReactNode[] = [];
  if (genericAnswerType === AnswerBoxType.CHECKBOX_LIST) {
    for (let i = 0; i < numAnswers; i++) {
      radioBoxes.push(
        <div key={i}>
          <InputLabel>Multiple Choice {i + 1}</InputLabel>
          <Input
            aria-label="Checkbox"
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
  }

  const options = isLegacyAnswerBoxType(genericAnswerType) ? (
    <>
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
      <option value={AnswerBoxType.INPUT1_LIST}>Input 1 List</option>
      <option value={AnswerBoxType.INPUT2_LIST}>Input 2 List</option>
      <option value={AnswerBoxType.INPUT3_LIST}>Input 3 List</option>
      <option value={AnswerBoxType.INPUT4_LIST}>Input 4 List</option>
      <option value={AnswerBoxType.INPUT_LIST}>Text Input</option>
      <option value={AnswerBoxType.RADIO_LIST}>Radio Input</option>
      <option value={AnswerBoxType.CHECKBOX_LIST}>Multi</option>
    </>
  ) : (
    <>
      <option value={AnswerBoxType.INPUT_LIST}>Text Input</option>
      <option value={AnswerBoxType.RADIO_LIST}>Radio Input</option>
      <option value={AnswerBoxType.CHECKBOX_LIST}>Multi</option>
    </>
  );

  return (
    <>
      <HiddenTextField name="answers" value={answerStateToString(state)} />

      <div
        style={{
          flexWrap: 'wrap',
          display: 'flex',
        }}
      >
        <div>
          <InputLabel htmlFor="answerType">Answer Type</InputLabel>
          <select
            style={{
              maxWidth: '148px',
              padding: '8px',
              marginTop: '2px',
            }}
            name="answerType"
            defaultValue={genericAnswerType}
            onChange={handleAnswerBoxChange}
          >
            {options}
          </select>
        </div>
        <div
          style={{
            marginLeft: '8px',
          }}
        >
          <InputLabel htmlFor="numCorrectAnswers">
            Number of Answers{' '}
            <IconRight
              src="/res/help.svg"
              style={{ width: '16px', height: '16px' }}
              title="The number of answers that are correct for this question."
            />
          </InputLabel>
          <select
            style={{
              maxWidth: '148px',
              padding: '8px',
              marginTop: '2px',
            }}
            disabled={
              isLegacyAnswerBoxType(genericAnswerType) || numRadioBoxes > 0
            }
            name="numCorrectAnswers"
            value={numListAnswers}
            onChange={handleNumCorrectAnswersChange}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
          </select>
        </div>
        <div
          style={{
            marginLeft: '8px',
          }}
        >
          <InputLabel htmlFor="numAnswers">
            Number of Inputs{' '}
            <IconRight
              src="/res/help.svg"
              style={{ width: '16px', height: '16px' }}
              title="The number of inputs a user will see when answering this question."
            />
          </InputLabel>
          <select
            style={{
              maxWidth: '148px',
              padding: '8px',
              marginTop: '2px',
            }}
            disabled={isLegacyAnswerBoxType(genericAnswerType)}
            name="numAnswers"
            value={numAnswers}
            onChange={handleNumAnswersChange}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
          </select>
        </div>
      </div>

      <div></div>

      <div
        id="radio boxes"
        style={{
          border: '1px solid ' + getColors().TEXT_DESCRIPTION,
          padding: '8px',
          display: radioBoxes.length <= 0 ? 'none' : 'block',
          marginTop: '12px',
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
      {checkBoxes.length > 0 ? (
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
          marginTop: '12px',
        }}
      >
        {answerBoxes}
      </div>
      <div
        style={{
          margin: '16px 10px',
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
    </>
  );
};

export default EditAnswers;
