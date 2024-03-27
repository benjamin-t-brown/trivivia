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
import {
  throwValidationError,
  useConfirmNav,
  useFormPristine,
  useFormResetValues,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import { LiveQuizResponse } from 'shared/responses';
import InputLabel from 'elements/InputLabel';
import FormErrorText from 'components/FormErrorText';
import TextCenter from 'elements/TextCenter';
import IconLeft from 'elements/IconLeft';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface EditQuizValues {
  name: string;
  reImportQuizTemplate?: boolean;
  forceReImport?: boolean;
}
const action = createAction(async (values: EditQuizValues, params) => {
  if (!values.name) {
    throwValidationError('Please fill out the form.', values);
  }

  const result = await fetchAsync<LiveQuizResponse>(
    'put',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/update',
    values
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheLiveQuizAdmin(result.data.id);

  return redirect(`/live-quiz-admin/${result.data.id}`);
});

const deleteAction = createAction(async (_, params) => {
  const result = await fetchAsync<LiveQuizResponse>(
    'delete',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId
  );

  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }

  updateCacheLiveQuizAdmin(result.data.id);

  return redirect(`/live-quizzes`);
});

const loader = async ({ params }) => {
  const quizTemplatesResponse = await fetchAsync<LiveQuizResponse>(
    'get',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId
  );

  if (quizTemplatesResponse.error) {
    if (quizTemplatesResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: quizTemplatesResponse.status,
      statusText: quizTemplatesResponse.message,
    });
  }

  return json(quizTemplatesResponse);
};

const DeleteLiveQuiz = () => {
  const navigate = useNavigate();
  const params = useParams();

  const handleCancelClick = () => {
    navigate(`/live-quiz-admin/${params.liveQuizId}/edit`, {
      state: { from: 'delete' },
    });
  };

  return (
    <>
      <DefaultTopBar />
      <MobileLayout topBar>
        <Form method="delete" id="delete-question-form">
          <InnerRoot>
            <TextCenter>
              Are you sure you wish to delete this live quiz?
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

interface EditLiveQuizProps {
  error?: boolean;
}
const AdminEditLiveQuiz = (props: EditLiveQuizProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const render = useReRender();
  const initialValues: EditQuizValues = {
    name: liveQuizResponse?.data?.name ?? '',
  };
  const formId = 'edit-live-quiz-form';
  const formIsPristine = useFormPristine(formId, initialValues);
  const confirmDialog = useConfirmNav(!formIsPristine);
  useFormResetValues(formId);

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (location?.state?.from === 'delete') {
      navigate('/live-quizzes');
    } else {
      navigate(-1);
    }
  };

  const handleDeleteClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(`/live-quiz-admin/${params.liveQuizId}/delete`);
  };

  return (
    <>
      <DefaultTopBar useBackConfirm={false} upTo={'/live-quizzes'} />
      <MobileLayout topBar>
        <Form method="post" id={formId}>
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Fill out information for this quiz template.
            </p>
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
            <div
              style={{
                margin: '16px 0px',
                display: 'flex',
              }}
            >
              <input
                type="checkbox"
                name="reImportQuizTemplate"
                id="reImportQuizTemplate"
              ></input>
              <label
                htmlFor="reImportQuizTemplate"
                style={{
                  marginLeft: '8px',
                }}
              >
                {' '}
                Re-Import quiz template for this quiz.{' '}
              </label>
            </div>
            <div
              style={{
                margin: '16px 0px',
                display: 'flex',
              }}
            >
              <input
                type="checkbox"
                name="forceReImport"
                id="forceReImport"
              ></input>
              <label
                htmlFor="forceReImport"
                style={{
                  marginLeft: '8px',
                }}
              >
                {' '}
                If importing, force the re-import (may reset the quiz and erase
                all answers).{' '}
              </label>
            </div>

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
          </InnerRoot>
        </Form>
      </MobileLayout>
      {confirmDialog}
    </>
  );
};

export const EditLiveQuizRoute = {
  path: '/live-quiz-admin/:liveQuizId/edit',
  element: <AdminEditLiveQuiz />,
  errorElement: <AdminEditLiveQuiz error={true} />,
  action,
  loader,
};

export const DeleteLiveQuizRoute = {
  path: '/live-quiz-admin/:liveQuizId/delete',
  element: <DeleteLiveQuiz />,
  action: deleteAction,
};
