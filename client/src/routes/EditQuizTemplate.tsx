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
import Input from 'elements/Input';
import HiddenBooleanField from 'components/HiddenBooleanField';
import {
  throwValidationError,
  useConfirmNav,
  useFormPristine,
  useFormResetValues,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheQuizTemplate } from 'cache';
import { QuizTemplateResponse } from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import InputLabel from 'elements/InputLabel';
import FormErrorText from 'components/FormErrorText';
import TextArea from 'elements/TextArea';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface EditQuizValues {
  isNew: boolean;
  name: string;
  numRounds: number | string;
  notes: string;
}
const action = createAction(async (values: EditQuizValues, params) => {
  if (!values.name) {
    throwValidationError('Please fill out the form.', values);
  }
  const numRounds = parseInt(values.numRounds as string);
  if (isNaN(numRounds) || numRounds <= 0) {
    throwValidationError('Please specify a valid number of rounds.', values);
  }

  let result: FetchResponse<QuizTemplateResponse>;
  if (values.isNew) {
    result = await fetchAsync<QuizTemplateResponse>(
      'post',
      '/api/template/quiz',
      values
    );
  } else {
    result = await fetchAsync<QuizTemplateResponse>(
      'put',
      '/api/template/quiz/' + params?.quizTemplateId,
      values
    );
  }

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheQuizTemplate(result.data.id, result);

  return redirect(`/quiz-templates`);
});

const deleteAction = createAction(async (_, params) => {
  const result = await fetchAsync<QuizTemplateResponse>(
    'delete',
    '/api/template/quiz/' + params?.quizTemplateId
  );

  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }

  updateCacheQuizTemplate(result.data.id, undefined);

  return redirect(`/quiz-templates`);
});

const loader = async ({ params }) => {
  const response = await fetchAsync<QuizTemplateResponse>(
    'get',
    '/api/template/quiz/' + params.quizTemplateId
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

const DeleteQuizTemplate = () => {
  const navigate = useNavigate();
  const params = useParams();

  const handleCancelClick = () => {
    navigate(`/quiz-template/${params.quizTemplateId}/edit`, {
      state: {
        from: 'delete',
      },
    });
  };

  return (
    <>
      <DefaultTopBar />
      <MobileLayout topBar>
        <Form method="delete" id="delete-quiz-form">
          <InnerRoot>
            <TextCenter>
              Are you sure you wish to delete this quiz template?
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

interface EditQuizProps {
  isNew?: boolean;
  error?: boolean;
}
const EditQuizTemplate = (props: EditQuizProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const quizTemplateResponse = useTypedLoaderData<
    FetchResponse<QuizTemplateResponse>
  >({
    isError: props.error,
  });
  const render = useReRender();
  const initialValues: EditQuizValues = {
    isNew: Boolean(props.isNew),
    name: quizTemplateResponse?.data.name ?? '',
    numRounds: quizTemplateResponse?.data?.numRounds ?? 7,
    notes: quizTemplateResponse?.data?.notes ?? '',
  };
  const formIsPristine = useFormPristine('edit-quiz-form', initialValues);
  const confirmDialog = useConfirmNav(!formIsPristine);
  useFormResetValues('edit-quiz-form');

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (location?.state?.from === 'delete') {
      navigate('/quiz-templates');
    } else {
      navigate(-1);
    }
  };

  const handleDeleteClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(`/quiz-template/${params.quizTemplateId}/delete`);
  };

  console.log('Quiz template response', quizTemplateResponse);

  return (
    <>
      <DefaultTopBar useBackConfirm={false} upTo={'/quiz-templates'} />
      <MobileLayout topBar>
        <Form method="post" id="edit-quiz-form">
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Fill out information for this quiz template.
            </p>
            <HiddenBooleanField name="isNew" value={Boolean(props.isNew)} />
            <InputLabel htmlFor="name">Quiz Name</InputLabel>
            <Input
              placeholder="Quiz Name"
              aria-label="Quiz Name"
              type="text"
              name="name"
              onChange={() => {
                render();
              }}
            />
            <InputLabel htmlFor="numRounds">Number of Rounds</InputLabel>
            <Input
              aria-label="Number of Rounds"
              type="number"
              name="numRounds"
              onChange={() => {
                render();
              }}
              style={{
                width: '60px',
              }}
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
              color="primary"
              style={{
                width: '100%',
              }}
              type="submit"
            >
              Save
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
            {props.isNew ? null : (
              <Button
                color="cancel"
                style={{
                  width: '100%',
                }}
                onClick={handleDeleteClick}
              >
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

export const EditQuizTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/edit',
  element: <EditQuizTemplate />,
  errorElement: <EditQuizTemplate error={true} />,
  action,
  loader,
};

export const DeleteQuizTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/delete',
  element: <DeleteQuizTemplate />,
  action: deleteAction,
};

export const NewQuizTemplateRoute = {
  path: 'quiz-template-new',
  element: <EditQuizTemplate isNew={true} />,
  errorElement: <EditQuizTemplate error={true} isNew={true} />,
  action,
  loader: async () => {
    return null;
  },
};
