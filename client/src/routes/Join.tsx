import { createAction, fetchAsync, FetchResponse } from 'actions';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { Form, json, Link, redirect, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  throwValidationError,
  useFormResetValues,
  useTypedLoaderData,
} from 'hooks';
import NavButton from 'components/NavButton';
import {
  AccountResponse,
  LiveQuizPublicResponse,
  LiveQuizPublicStateResponse,
  LiveQuizResponse,
  LiveQuizTeamResponse,
} from 'shared/responses';
import TopBar from 'elements/TopBar';
import CardTitleZone from 'elements/CardTitleZone';
import BackButton from 'components/BackButton';
import CardTitle from 'elements/CardTitle';
import Button from 'elements/Button';
import { LiveQuizStartRoute } from './LiveQuizStart';
import { ListQuizTemplatesRoute } from './ListQuizTemplates';
import IconLeft from 'elements/IconLeft';
import FormErrorText from 'components/FormErrorText';
import InputLabel from 'elements/InputLabel';
import Input from 'elements/Input';
import SectionTitle from 'elements/SectionTitle';
import { getColors } from 'style';
import { getFromCache, updateCacheLiveQuiz } from 'cache';
import {
  getLiveQuizTeamId,
  setLiveQuizAnswersLs,
  setLiveQuizTeamId,
} from 'utils';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface JoinQuizValues {
  code?: string;
  teamName?: string;
}
const action = createAction(async (values: JoinQuizValues, params) => {
  console.log('EDIT QUIZ VALUES', values);

  if (values.code) {
    setLiveQuizTeamId('');
    return redirect(`/join/${values.code}`);
  }

  if (!values.teamName) {
    throwValidationError('Please fill out the form.', values);
  } else if (values.teamName.length < 3) {
    throwValidationError(
      'Team name too short (must be 3 or more characters).',
      values
    );
  } else if (values.teamName.length > 40) {
    throwValidationError(
      'Team name too long (must be 40 or less characters).',
      values
    );
  }

  const joinResponse = await fetchAsync<LiveQuizTeamResponse>(
    'post',
    '/api/live/' + params.userFriendlyQuizId + '/join',
    values
  );

  if (joinResponse.error) {
    throwValidationError(joinResponse.message, values);
  }

  console.log('Joined quiz, teamId=', joinResponse.data.id);

  setLiveQuizTeamId(joinResponse.data.id);
  for (let i = 0; i < 16; i++) {
    setLiveQuizAnswersLs(i, {});
  }
  updateCacheLiveQuiz(params.userFriendlyQuizId);

  return redirect(`/live/${params.userFriendlyQuizId}`);
});

const loader = async ({ params }) => {
  const accountResponse = await fetchAsync<LiveQuizPublicStateResponse>(
    'get',
    '/api/live/' + params.userFriendlyQuizId + '/meta'
  );

  if (accountResponse.error) {
    throw new Response('', {
      status: accountResponse.status,
      statusText: `That quiz could not be found.`,
    });
  }

  if (accountResponse.data.teams.find(t => t.id === getLiveQuizTeamId())) {
    return redirect(`/live/${params.userFriendlyQuizId}`);
  }

  return json(accountResponse);
};

const QuizTeamsList = (props: { quizState: LiveQuizPublicStateResponse }) => {
  const currentTeamId = getLiveQuizTeamId();

  return (
    <>
      <SectionTitle>Teams</SectionTitle>
      <div
        style={{
          background: getColors().BACKGROUND2,
          padding: '16px',
          borderRadius: '4px',
        }}
      >
        {props.quizState.teams.map((team, i) => {
          return (
            <div
              key={team.id}
              style={{
                color:
                  currentTeamId === team.id
                    ? getColors().SUCCESS_TEXT
                    : getColors().TEXT_DEFAULT,
                borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
                borderRadius: '4px',
                padding: '4px',
              }}
            >
              {i + 1}. {team.teamName}
            </div>
          );
        })}
        {props.quizState.teams.length === 0 ? (
          <div style={{ color: getColors().TEXT_DESCRIPTION }}>
            No teams yet!
          </div>
        ) : null}
      </div>
    </>
  );
};

const JoinQuiz = (props: { error?: boolean }) => {
  const params = useParams();
  const formId = 'join-quiz-form';

  const liveQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizPublicStateResponse>
  >({
    isError: props.error,
    cache: getFromCache(
      'get',
      '/api/live/' + params.userFriendlyQuizId + '/meta'
    ),
  });

  useFormResetValues(formId);

  console.log('render join', liveQuizResponse);

  return (
    <>
      <TopBar>
        <CardTitleZone align="left">
          {/* <BackButton useConfirm={false} /> */}
        </CardTitleZone>
        <CardTitle>Trivivia</CardTitle>
        <CardTitleZone align="right">
          <Button color="plain">
            <img
              style={{
                width: '22px',
              }}
              alt="Settings"
              src="/res/cog.svg"
            />
          </Button>
        </CardTitleZone>
      </TopBar>
      <MobileLayout topBar>
        <InnerRoot>
          {liveQuizResponse?.data ? (
            <>
              <p
                style={{
                  textAlign: 'center',
                }}
              >
                Welcome to the quiz: {liveQuizResponse.data.quiz.name}
              </p>
              <p
                style={{
                  textAlign: 'center',
                  color: getColors().TEXT_DESCRIPTION,
                }}
              >
                Ready to join?
              </p>
              <Form method="post" id={formId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '50%',
                      minWidth: '164px',
                    }}
                  >
                    <InputLabel htmlFor="code">Team Name</InputLabel>
                    <Input
                      placeholder="Team Name"
                      aria-label="Team Name"
                      type="text"
                      name="teamName"
                      // maxLength={20}
                      // minLength={3}
                      fullWidth
                    />
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <FormErrorText />
                </div>
                <p
                  style={{
                    textAlign: 'center',
                    color: getColors().TEXT_DESCRIPTION,
                    fontSize: '0.8rem',
                  }}
                >
                  Not the right quiz? Click{' '}
                  <Link
                    to="/join"
                    style={{
                      color: getColors().TEXT_DEFAULT,
                    }}
                  >
                    here
                  </Link>{' '}
                  to go back.
                </p>
                <div style={{ height: '16px' }}></div>
                <Button
                  flex
                  center
                  color="primary"
                  style={{
                    width: '100%',
                  }}
                  type="submit"
                >
                  <IconLeft src="/res/check-mark.svg" />
                  Join Quiz
                </Button>
                <QuizTeamsList quizState={liveQuizResponse.data} />
              </Form>
            </>
          ) : (
            <>
              <p
                style={{
                  textAlign: 'center',
                }}
              >
                Welcome!
              </p>
              <p
                style={{
                  textAlign: 'center',
                }}
              >
                Enter a quiz code to join a quiz.
              </p>
              <Form method="post" id={formId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '50%',
                      minWidth: '164px',
                    }}
                  >
                    <InputLabel htmlFor="code">Quiz Code</InputLabel>
                    <Input
                      fullWidth
                      placeholder="Quiz Code"
                      aria-label="Quiz Code"
                      type="text"
                      name="code"
                    />
                  </div>
                </div>
                <div style={{ height: '16px' }}></div>
                <Button
                  flex
                  center
                  color="primary"
                  style={{
                    width: '100%',
                  }}
                  type="submit"
                >
                  <IconLeft src="/res/check-mark.svg" />
                  Find Quiz
                </Button>
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <FormErrorText />
                </div>
              </Form>
            </>
          )}
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const JoinRoute = {
  path: '/join',
  element: <JoinQuiz />,
  errorElement: <JoinQuiz error={true} />,
  action,
};

export const JoinQuizRoute = {
  path: '/join/:userFriendlyQuizId',
  element: <JoinQuiz />,
  errorElement: <JoinQuiz error={true} />,
  loader,
  action,
};
