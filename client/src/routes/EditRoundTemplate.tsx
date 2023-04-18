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
  useConfirmNav,
  useFormPristine,
  useFormResetValues,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheRoundTemplate } from 'cache';
import { RoundTemplateResponse } from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import InputLabel from 'elements/InputLabel';
import FormErrorText, { FormError } from 'components/FormErrorText';
import IconLeft from 'elements/IconLeft';
import TextArea from 'elements/TextArea';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface EditRoundValues {
  isNew: boolean;
  title: string;
  description: string;
  notes: string;
}
const action = createAction(async (values: EditRoundValues, params) => {
  if (!values.title) {
    throw {
      message: 'Please fill out the form.',
      values,
    } as FormError;
  }

  let result: FetchResponse<RoundTemplateResponse>;
  if (values.isNew) {
    result = await fetchAsync<RoundTemplateResponse>(
      'post',
      '/api/template/round',
      { ...values, quizTemplateId: params.quizTemplateId }
    );
  } else {
    result = await fetchAsync<RoundTemplateResponse>(
      'put',
      '/api/template/round/' + params.roundTemplateId,
      { ...values, quizTemplateId: params.quizTemplateId }
    );
  }

  if (result.error) {
    throw {
      message: result.message,
      values,
    } as FormError;
  }

  updateCacheRoundTemplate(params.quizTemplateId, result.data.id, result);

  return redirect(
    '/quiz-template/' + params.quizTemplateId + '/round-templates'
  );
});

const deleteAction = createAction(async (_, params) => {
  const result = await fetchAsync<RoundTemplateResponse>(
    'delete',
    '/api/template/round/' + params.roundTemplateId
  );

  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }

  updateCacheRoundTemplate(params.quizTemplateId, result.data.id, undefined);

  return redirect(`/quiz-template/${params.quizTemplateId}/round-templates`);
});

const loader = async ({ params }) => {
  const response = await fetchAsync<RoundTemplateResponse>(
    'get',
    '/api/template/round/' + params.roundTemplateId
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

const DeleteRoundTemplate = () => {
  const navigate = useNavigate();
  const params = useParams();

  const handleCancelClick = () => {
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/edit`,
      {
        state: {
          from: 'delete',
        },
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
              Are you sure you wish to delete this round template?
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

interface EditRoundProps {
  isNew?: boolean;
  error?: boolean;
}
const EditRoundTemplate = (props: EditRoundProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const roundTemplateResponse = useTypedLoaderData<
    FetchResponse<RoundTemplateResponse>
  >({
    isError: props.error,
  });
  const render = useReRender();
  const initialValues: EditRoundValues = {
    isNew: Boolean(props.isNew),
    title: roundTemplateResponse?.data.title ?? '',
    description: roundTemplateResponse?.data?.description ?? '',
    notes: roundTemplateResponse?.data?.notes ?? '',
  };
  const formIsPristine = useFormPristine('edit-round-form', initialValues);
  const confirmDialog = useConfirmNav(!formIsPristine);
  useFormResetValues('edit-round-form');

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (location?.state?.from === 'delete') {
      navigate(`/quiz-template/${params.quizTemplateId}/round-templates`);
    } else {
      navigate(-1);
    }
  };

  const handleDeleteClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/delete`
    );
  };

  return (
    <>
      <DefaultTopBar
        useBackConfirm={false}
        upTo={`/quiz-template/${params.quizTemplateId}/round-templates`}
      />
      <MobileLayout topBar>
        <Form method="post" id="edit-round-form">
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Fill out information for this round template.
            </p>
            <HiddenBooleanField name="isNew" value={Boolean(props.isNew)} />
            <InputLabel htmlFor="title">Title</InputLabel>
            <Input
              fullWidth={true}
              placeholder="Round Title"
              aria-label="Round Title"
              type="text"
              name="title"
              onChange={() => {
                render();
              }}
              defaultValue={
                props.isNew ? '' : roundTemplateResponse?.data.title
              }
            />
            <InputLabel htmlFor="description">Description</InputLabel>
            <TextArea
              placeholder="Round Description"
              aria-label="Round Description"
              name="description"
              onChange={() => {
                render();
              }}
              defaultValue={
                props.isNew ? '' : roundTemplateResponse?.data.description
              }
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

export const EditRoundTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/edit',
  element: <EditRoundTemplate />,
  errorElement: <EditRoundTemplate error={true} />,
  action,
  loader,
};

export const DeleteRoundTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/delete',
  element: <DeleteRoundTemplate />,
  action: deleteAction,
};

export const NewRoundTemplateRoute = {
  path: '/quiz-template/:quizTemplateId/round-template-new',
  element: <EditRoundTemplate isNew={true} />,
  errorElement: <EditRoundTemplate error={true} isNew={true} />,
  action,
  loader: async () => {
    return null;
  },
};
