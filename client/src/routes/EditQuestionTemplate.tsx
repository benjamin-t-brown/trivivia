import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  json,
  redirect,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import styled from 'styled-components';
import { getColors } from 'style';
import HiddenBooleanField from 'components/HiddenBooleanField';
import {
  useConfirmNav,
  useFormPristine,
  useFormResetValues,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheQuestionTemplate } from 'cache';
import {
  AnswerBoxType,
  AnswerState,
  answerStateToString,
  getNumAnswers,
  getNumCorrectAnswers,
  getNumRadioBoxes,
  QuestionTemplateResponse,
  stringToAnswerState,
} from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import InputLabel from 'elements/InputLabel';
import FormErrorText, { FormError } from 'components/FormErrorText';
import IconLeft from 'elements/IconLeft';
import TextArea from 'elements/TextArea';
import EditAnswers from 'components/EditAnswers';
import EditImageLink from 'components/EditImageLink';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface EditQuestionValues {
  isNew: boolean;
  text: string;
  answers: string;
  answerType: AnswerBoxType;
  orderMatters: boolean;
  isBonus: boolean;
  imageLink?: string;
  notes: string;
}
const action = createAction(async (values: EditQuestionValues, params) => {
  if (
    !(values.text || values.imageLink) ||
    !values.answers ||
    !values.answerType
  ) {
    throw {
      message: 'Please fill out the form.',
      values,
    } as FormError;
  }
  const valuesCopy = { ...values };

  values.orderMatters = Boolean(values.orderMatters);
  values.isBonus = Boolean(values.isBonus);

  const answerState = stringToAnswerState(values.answers);
  const numAnswers = getNumAnswers(values.answerType);
  const numCorrectAnswers = getNumCorrectAnswers(values.answerType);
  const numRadioBoxes = getNumRadioBoxes(values.answerType);
  const newAnswerState: AnswerState = {};
  if (numCorrectAnswers !== numAnswers) {
    for (let i = 0; i < 8; i++) {
      const key = 'answer' + (i + 1);
      if (answerState[key]) {
        newAnswerState[key] = answerState[key];
      }
    }
  } else {
    for (let i = 0; i < numAnswers; i++) {
      const key = 'answer' + (i + 1);
      if (answerState[key]) {
        newAnswerState[key] = answerState[key];
      }
    }
  }
  for (let i = 0; i < numRadioBoxes; i++) {
    const key = 'radio' + (i + 1);
    if (answerState[key]) {
      newAnswerState[key] = answerState[key];
    }
  }

  if (Object.keys(newAnswerState).length === 0) {
    throw {
      message: 'Please fill out answers in the form.',
      values,
    } as FormError;
  }

  values.answers = answerStateToString(newAnswerState);

  let result: FetchResponse<QuestionTemplateResponse>;
  if (values.isNew) {
    result = await fetchAsync<QuestionTemplateResponse>(
      'post',
      '/api/template/question',
      {
        ...values,
        roundTemplateId: params.roundTemplateId,
      }
    );
  } else {
    result = await fetchAsync<QuestionTemplateResponse>(
      'put',
      '/api/template/question/' + params.questionTemplateId,
      {
        ...values,
        roundTemplateId: params.roundTemplateId,
      }
    );
  }

  if (result.error) {
    throw {
      message: result.message,
      values: valuesCopy,
    } as FormError;
  }

  updateCacheQuestionTemplate(params.roundTemplateId, result.data.id, result);

  return redirect(
    `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-templates`
  );
});

const deleteAction = createAction(async (_, params) => {
  const result = await fetchAsync<QuestionTemplateResponse>(
    'delete',
    '/api/template/question/' + params.questionTemplateId
  );

  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }

  updateCacheQuestionTemplate(
    params.roundTemplateId,
    result.data.id,
    undefined
  );

  return redirect(
    `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-templates`
  );
});

const loader = async ({ params }) => {
  const response = await fetchAsync<QuestionTemplateResponse>(
    'get',
    '/api/template/question/' + params.questionTemplateId
  );
  if (response.error) {
    if (response.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: response.status,
      statusText: response.message,
    });
  }
  return json(response);
};

const DeleteQuestionTemplate = () => {
  const navigate = useNavigate();
  const params = useParams();

  const handleCancelClick = () => {
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-template/${params.questionTemplateId}/edit`,
      {
        state: { from: 'delete' },
      }
    );
  };

  return (
    <>
      <DefaultTopBar />
      <MobileLayout topBar>
        <Form method="delete" id="delete-question-form">
          <InnerRoot>
            <TextCenter>
              Are you sure you wish to delete this question template?
            </TextCenter>
            <Button
              color="cancel"
              style={{
                width: '100%',
              }}
              type="submit"
            >
              Delete
            </Button>
            <Button
              color="secondary"
              style={{
                width: '100%',
              }}
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
          </InnerRoot>
        </Form>
      </MobileLayout>
    </>
  );
};

interface EditQuestionProps {
  isNew?: boolean;
  error?: boolean;
}
const EditQuestionTemplate = (props: EditQuestionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const questionTemplateResponse = useTypedLoaderData<
    FetchResponse<QuestionTemplateResponse>
  >({
    isError: props.error,
  });

  const render = useReRender();
  const initialValues: EditQuestionValues = {
    isNew: Boolean(props.isNew),
    text: props.isNew ? '' : questionTemplateResponse?.data.text ?? '',
    answers: questionTemplateResponse?.data?.answers
      ? answerStateToString(questionTemplateResponse?.data?.answers)
      : '{}',
    answerType:
      questionTemplateResponse?.data?.answerType ?? AnswerBoxType.INPUT1,
    orderMatters: questionTemplateResponse?.data?.orderMatters ?? false,
    isBonus: questionTemplateResponse?.data?.isBonus ?? false,
    imageLink: questionTemplateResponse?.data?.imageLink ?? '',
    notes: questionTemplateResponse?.data?.notes ?? '',
  };
  const formIsPristine = useFormPristine('edit-question-form', initialValues);
  const confirmDialog = useConfirmNav(!formIsPristine);
  useFormResetValues('edit-question-form');

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (location?.state?.from === 'delete') {
      navigate(
        `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-templates`
      );
    } else {
      navigate(-1);
    }
  };

  const handleDeleteClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-template/${params.questionTemplateId}/delete`
    );
  };

  return (
    <>
      <DefaultTopBar
        useBackConfirm={false}
        upTo={`/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-templates`}
      />
      <MobileLayout topBar>
        <Form method="post" id="edit-question-form">
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Fill out information for this question template.
            </p>
            <HiddenBooleanField name="isNew" value={Boolean(props.isNew)} />
            <InputLabel htmlFor="text">Question Text</InputLabel>
            <TextArea
              fullWidth={true}
              placeholder="Question Text"
              aria-label="Question Text"
              name="text"
              maxLength={512}
              onChange={() => {
                render();
              }}
            />
            <EditImageLink questionTemplate={questionTemplateResponse?.data} />
            <EditAnswers
              questionTemplate={questionTemplateResponse?.data}
              formEdited={() => {
                setTimeout(() => {
                  render();
                }, 1);
              }}
              formId="edit-question-form"
              isNew={props.isNew}
            />
            <InputLabel
              htmlFor="notes"
              style={{
                marginTop: '32px',
              }}
            >
              Notes
            </InputLabel>
            <TextArea
              fullWidth={true}
              placeholder="Notes"
              aria-label="Notes"
              name="notes"
              maxLength={512}
              onChange={() => {
                render();
              }}
            />
            <FormErrorText />
            <div style={{ height: '16px' }}></div>
            <Button
              flex
              color="primary"
              style={{
                width: '100%',
              }}
              type="submit"
            >
              <IconLeft src="/res/check-mark.svg" />
              Save
            </Button>
            <Button
              flex
              color="secondary"
              style={{
                width: '100%',
              }}
              onClick={handleCancelClick}
            >
              <IconLeft src="/res/cancel.svg" />
              Cancel
            </Button>
            {props.isNew ? null : (
              <Button
                flex
                color="cancel"
                style={{
                  width: '100%',
                }}
                onClick={handleDeleteClick}
              >
                <IconLeft src="/res/trash-can.svg" />
                Delete
              </Button>
            )}
          </InnerRoot>
        </Form>
      </MobileLayout>
      {confirmDialog}
    </>
  );
};

export const EditQuestionTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template/:questionTemplateId/edit',
  element: <EditQuestionTemplate />,
  errorElement: <EditQuestionTemplate error={true} />,
  action,
  loader,
};

export const DeleteQuestionTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template/:questionTemplateId/delete',
  element: <DeleteQuestionTemplate />,
  action: deleteAction,
};

export const NewQuestionTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-template-new',
  element: <EditQuestionTemplate isNew={true} />,
  errorElement: <EditQuestionTemplate error={true} isNew={true} />,
  action,
  loader: async () => {
    return null;
  },
};
