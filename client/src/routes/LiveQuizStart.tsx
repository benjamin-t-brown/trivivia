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
import { getFromCache, updateCacheLiveQuiz } from 'cache';
import { LiveQuizResponse, QuizTemplateResponse } from 'shared/responses';
import InputLabel from 'elements/InputLabel';
import FormErrorText from 'components/FormErrorText';
import { quizTemplateIsReady } from 'validation';
import IconLeft from 'elements/IconLeft';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { ButtonAction } from 'elements/ButtonAction';
import { IconButton } from 'elements/IconButton';
import { HSpace } from 'elements/HSpace';
import { SearchSelect } from 'elements/SearchSelect';
import HiddenTextField from 'components/HiddenTextField';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
});

interface EditQuizValues {
  name: string;
  quizTemplateId: string;
  quizTemplateName: string;
}
const action = createAction(async (values: EditQuizValues) => {
  if (!values.name || !values.quizTemplateId) {
    throwValidationError('Please fill out the form.', values);
  }

  const result = await fetchAsync<LiveQuizResponse>(
    'post',
    '/api/live-quiz-admin/create/' + values.quizTemplateId,
    values
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheLiveQuiz(result.data.id);

  return redirect(`/live-quiz-admin/${result.data.id}`);
});

const loader = async () => {
  const quizTemplatesResponse = await fetchAsync<QuizTemplateResponse[]>(
    'get',
    '/api/template/all/quiz'
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

interface EditLiveQuizProps {
  error?: boolean;
}
const AdminLiveQuizStart = (props: EditLiveQuizProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const quizTemplateResponse = useTypedLoaderData<
    FetchResponse<QuizTemplateResponse[]>
  >({
    isError: props.error,
    cache: getFromCache('get', '/api/template/all/quiz'),
  });
  const render = useReRender();
  const initialValues: EditQuizValues = {
    name: 'Quiz: ' + new Date().toISOString().slice(0, 10),
    quizTemplateId: quizTemplateResponse?.data[0]?.id ?? '',
    quizTemplateName: '',
  };
  const formId = 'edit-live-quiz-form';
  const formIsPristine = useFormPristine(formId, initialValues);
  const confirmDialog = useConfirmNav(!formIsPristine);
  useFormResetValues(formId);

  const [templateId, setTemplateId] = React.useState(
    initialValues.quizTemplateId
  );

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (location?.state?.from === 'delete') {
      navigate('/landing');
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <DefaultTopBar useBackConfirm={false} />
      <MobileLayout topBar>
        <Form method="post" id={formId} autoComplete="off">
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Fill out information for this live quiz.
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
              fullWidth
            />
            <HiddenTextField
              name="quizTemplateId"
              value={initialValues.quizTemplateId}
            />
            <SearchSelect
              id="quizTemplateName"
              label="Quiz Template"
              value={templateId}
              inputStyle={{
                width: '100%',
              }}
              fullWidth
              setValue={value => {
                initialValues.quizTemplateId = value;

                const form = document.getElementById(
                  formId
                ) as HTMLFormElement | null;
                if (form) {
                  form.elements['quizTemplateId'].value = value;
                }

                setTemplateId(value);
              }}
              getSuggestions={filter => {
                return (
                  quizTemplateResponse?.data
                    .map(t => {
                      if (quizTemplateIsReady(t)) {
                        return {
                          value: t.id,
                          label: t.name,
                        };
                      } else {
                        return {
                          value: '',
                          label: '',
                        };
                      }
                    })
                    .filter(
                      t =>
                        Boolean(t.value) &&
                        t.label
                          .toLocaleLowerCase()
                          .includes(filter.toLocaleLowerCase())
                    ) ?? []
                );
              }}
            />
            {/* <select
              style={{
                maxWidth: '50%',
                padding: '8px',
                marginTop: '2px',
              }}
              name="quizTemplateId"
              defaultValue={initialValues.quizTemplateId}
            >
              {quizTemplateResponse?.data.map(t => {
                if (quizTemplateIsReady(t)) {
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  );
                } else {
                  return null;
                }
              })}
            </select> */}
            <FormErrorText />
            <div style={{ height: '16px' }}></div>

            <JustifyContentDiv justifyContent="left">
              <ButtonAction color="primary" type="submit">
                <IconButton src="/res/check-mark.svg" />
                Save
              </ButtonAction>
              <HSpace />
              <ButtonAction color="secondary" onClick={handleCancelClick}>
                <IconButton src="/res/cancel.svg" />
                Cancel
              </ButtonAction>
            </JustifyContentDiv>
          </InnerRoot>
        </Form>
      </MobileLayout>
      {confirmDialog}
    </>
  );
};

export const LiveQuizStartRoute = {
  path: '/live-quiz-start',
  element: <AdminLiveQuizStart />,
  errorElement: <AdminLiveQuizStart error={true} />,
  action,
  loader,
};
