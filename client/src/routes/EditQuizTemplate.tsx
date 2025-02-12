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
  throwValidationError,
  useConfirmNav,
  useFormPristine,
  useFormResetValues,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheQuizTemplate } from 'cache';
import {
  QuestionTemplateResponse,
  QuizTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import InputLabel from 'elements/InputLabel';
import FormErrorText, { FormError } from 'components/FormErrorText';
import TextArea from 'elements/TextArea';
import { fetchImportQuizTemplate } from 'fetches';
import HiddenTextField from 'components/HiddenTextField';
import { LoadingPage } from 'components/LoadingPage';
import IconLeft from 'elements/IconLeft';
import NavButton from 'components/NavButton';
import { ButtonAction } from 'elements/ButtonAction';
import { IconButton } from 'elements/IconButton';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { HSpace } from 'elements/HSpace';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

export interface EditQuizValues {
  isNew: boolean;
  name: string;
  notes: string;
  importedQuizTemplate?: string;
  'import-quiz'?: string;
}
const action = createAction(async (values: EditQuizValues, params) => {
  if (!values.name) {
    throwValidationError('Please fill out the form.', values);
  }

  let quizTemplate: QuizTemplateResponse | undefined = undefined;
  if (values.importedQuizTemplate) {
    quizTemplate = JSON.parse(values.importedQuizTemplate);
  }

  delete values['importedQuizTemplate'];
  delete values['import-quiz'];

  let result: FetchResponse<QuizTemplateResponse>;
  if (quizTemplate) {
    result = await fetchImportQuizTemplate({
      ...quizTemplate,
      ...values,
    });
  } else if (values.isNew) {
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

  if (!quizTemplate) {
    updateCacheQuizTemplate(result.data.id, result);
  }

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
    notes: quizTemplateResponse?.data?.notes ?? '',
  };
  const formIsPristine = useFormPristine('edit-quiz-form', initialValues, [
    'import-quiz',
    'importedQuizTemplate',
  ]);
  const confirmDialog = useConfirmNav(!formIsPristine);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [quizTemplateImport, setQuizTemplateImport] = React.useState<
    QuizTemplateResponse | undefined
  >();
  useFormResetValues('edit-quiz-form');

  const navigation = useNavigation();
  if (navigation.state === 'submitting') {
    return <LoadingPage />;
  }

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

  const handleImportClick = (ev: React.ChangeEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const file = fileInputRef?.current?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e: any) {
        let parsedData: QuizTemplateResponse | undefined = undefined;
        if (e?.target?.result) {
          try {
            parsedData = JSON.parse(e.target.result);
          } catch (e) {
            throw new Error('Invalid JSON');
          }
        }
        if (parsedData) {
          const form = document.getElementById(
            'edit-quiz-form'
          ) as HTMLFormElement | null;
          if (form) {
            form.elements['name'].value = parsedData.name;
            // form.elements['numRounds'].value = parsedData.numRounds;
            form.elements['notes'].value = parsedData.notes;
          }
          setQuizTemplateImport(parsedData);
        }
      };
      reader.readAsText(file);
    }
  };

  let numQuestionsToImport = 0;
  if (quizTemplateImport) {
    for (const roundId of quizTemplateImport.roundOrder) {
      const round = quizTemplateImport.rounds?.find(r => r.id === roundId);
      if (round) {
        for (const questionId of round.questionOrder) {
          const question = round.questions?.find(q => q.id === questionId);
          if (question) {
            numQuestionsToImport++;
          }
        }
      }
    }
  }

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
            <HiddenTextField
              name="importedQuizTemplate"
              value={
                quizTemplateImport ? JSON.stringify(quizTemplateImport) : ''
              }
            />
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
              maxLength={1024}
              onChange={() => {
                render();
              }}
            />
            <p />
            <div
              style={{
                display: props.isNew ? 'block' : 'none',
              }}
            >
              <ButtonAction type="submit" color="secondary">
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <IconButton src="/res/clone.svg" verticalAdjust={7} />
                  Upload Quiz
                  <label htmlFor="import-quiz">
                    <input
                      onChange={handleImportClick}
                      ref={fileInputRef}
                      name="import-quiz"
                      id="import-quiz"
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
              </ButtonAction>
            </div>
            <div
              style={{
                display: quizTemplateImport ? 'block' : 'none',
                color: getColors().SUCCESS_TEXT,
              }}
            >
              <p>
                Importing {quizTemplateImport?.roundOrder?.length} rounds with{' '}
                {numQuestionsToImport} questions.
              </p>
            </div>
            <FormErrorText />
            <div style={{ height: '16px' }}></div>
            <JustifyContentDiv justifyContent="center">
              <ButtonAction color="primary" type="submit">
                <IconButton src="/res/check-mark.svg" />
                Save
              </ButtonAction>
              <HSpace />
              <ButtonAction color="secondary" onClick={handleCancelClick}>
                <IconButton src="/res/cancel.svg" />
                Cancel
              </ButtonAction>
              <HSpace />
              {props.isNew ? null : (
                <ButtonAction color="cancel" onClick={handleDeleteClick}>
                  <IconButton src="/res/trash-can.svg" verticalAdjust={3} />
                  Delete
                </ButtonAction>
              )}
            </JustifyContentDiv>
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
