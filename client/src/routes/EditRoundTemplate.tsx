import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  json,
  redirect,
  useActionData,
  useLocation,
  useNavigate,
  useNavigation,
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
import {
  QuestionTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import InputLabel from 'elements/InputLabel';
import FormErrorText, { FormError } from 'components/FormErrorText';
import IconLeft from 'elements/IconLeft';
import TextArea from 'elements/TextArea';
import HiddenTextField from 'components/HiddenTextField';
import { fetchImportRoundTemplate } from 'fetches';
import { LoadingPage } from 'components/LoadingPage';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

export interface EditRoundValues {
  isNew: boolean;
  title: string;
  description: string;
  notes: string;
  jokerDisabled: boolean;
  importedRoundTemplate?: string;
  'import-round'?: string;
}
const action = createAction(async (values: EditRoundValues, params) => {
  if (!values.title) {
    throw {
      message: 'Please fill out the form.',
      values,
    } as FormError;
  }

  values.jokerDisabled = (values.jokerDisabled as any) === 'true';

  let roundTemplate: RoundTemplateResponse | undefined = undefined;
  if (values.importedRoundTemplate) {
    roundTemplate = JSON.parse(values.importedRoundTemplate);
  }

  delete values['importedRoundTemplate'];
  delete values['import-round'];

  let result: FetchResponse<RoundTemplateResponse>;
  if (roundTemplate) {
    result = await fetchImportRoundTemplate(
      { ...roundTemplate, ...values },
      params.quizTemplateId
    );
  } else if (values.isNew) {
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

  if (!roundTemplate) {
    updateCacheRoundTemplate(params.quizTemplateId, result.data.id, result);
  }

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
    jokerDisabled: roundTemplateResponse?.data?.jokerDisabled ?? false,
  };
  const formIsPristine = useFormPristine('edit-round-form', initialValues, [
    'import-round',
    'importedRoundTemplate',
  ]);
  const confirmDialog = useConfirmNav(!formIsPristine);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [roundTemplateImport, setRoundTemplateImport] = React.useState<
    RoundTemplateResponse | undefined
  >();
  useFormResetValues('edit-round-form');

  const handleImportClick = (ev: React.ChangeEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const file = fileInputRef?.current?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e: any) {
        let parsedData: RoundTemplateResponse | undefined = undefined;
        if (e?.target?.result) {
          try {
            parsedData = JSON.parse(e.target.result);
          } catch (e) {
            throw new Error('Invalid JSON');
          }
        }
        if (parsedData) {
          const form = document.getElementById(
            'edit-round-form'
          ) as HTMLFormElement | null;
          if (form) {
            form.elements['title'].value = parsedData.title;
            form.elements['description'].value = parsedData.description;
            form.elements['notes'].value = parsedData.notes;
            form.elements['jokerDisabled'].value = parsedData.jokerDisabled;
          }
          setRoundTemplateImport(parsedData);
        }
      };
      reader.readAsText(file);
    }
  };

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

  const navigation = useNavigation();
  if (navigation.state === 'submitting') {
    return <LoadingPage />;
  }

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
            <HiddenTextField
              name="importedRoundTemplate"
              value={
                roundTemplateImport ? JSON.stringify(roundTemplateImport) : ''
              }
            />
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
            <div
              style={{
                margin: '16px 0px',
                display: 'flex',
              }}
            >
              <input
                type="checkbox"
                name="jokerDisabled"
                id="jokerDisabled"
                defaultChecked={
                  props.isNew
                    ? false
                    : roundTemplateResponse?.data.jokerDisabled
                }
                onChange={ev => {
                  ev.target.value = String(ev.target.checked);
                }}
              ></input>
              <label
                htmlFor="jokerDisabled"
                style={{
                  marginLeft: '8px',
                }}
              >
                Disable Joker
              </label>
            </div>
            <p>
              <Button
                flex
                type="submit"
                color="secondary"
                style={{
                  width: '100%',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <IconLeft src="/res/clone.svg" />
                  Upload Round
                  <label htmlFor="import-round">
                    <input
                      onChange={handleImportClick}
                      ref={fileInputRef}
                      name="import-round"
                      id="import-round"
                      type="file"
                      style={{
                        transform: 'translateY(-6px) scaleY(1.5)',
                        cursor: 'pointer',
                        opacity: 0,
                        left: 0,
                        width: '100%',
                        position: 'absolute',
                      }}
                    />
                  </label>
                </div>
              </Button>
            </p>
            <div
              style={{
                display: roundTemplateImport ? 'block' : 'none',
                color: getColors().SUCCESS_TEXT,
              }}
            >
              <p>
                Importing {roundTemplateImport?.questionOrder?.length}{' '}
                questions.
              </p>
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
