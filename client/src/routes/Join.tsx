import { createAction, fetchAsync, FetchResponse } from 'actions';
import MobileLayout from 'elements/MobileLayout';
import React, { useEffect } from 'react';
import {
  Form,
  json,
  Link,
  redirect,
  useFetcher,
  useNavigate,
  useParams,
} from 'react-router-dom';
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
  getIsNoRedirect,
  getLiveQuizJoinedDate,
  getLiveQuizJoinedId,
  getLiveQuizTeamId,
  setLiveQuizAnswersLs,
  setLiveQuizJoinedDate,
  setLiveQuizJoinedId,
  setLiveQuizSpectateId,
  setLiveQuizTeamId,
  setNoRedirect,
} from 'utils';
import Img from 'elements/Img';
import dayjs from 'dayjs';

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
  spectate?: string;
}
const action = createAction(async (values: JoinQuizValues, params) => {
  if (values.code) {
    setLiveQuizTeamId('');
    return redirect(`/join/${values.code.toLowerCase()}`);
  }

  if (values.spectate !== 'true') {
    if (!values.teamName) {
      throwValidationError('Please specify a team name.', values);
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
  }

  setLiveQuizSpectateId('');

  const joinResponse = await fetchAsync<LiveQuizTeamResponse>(
    'post',
    '/api/live/' + params.userFriendlyQuizId + '/join',
    {
      ...values,
      spectate: values.spectate === 'true',
    }
  );

  if (joinResponse.error) {
    throwValidationError(joinResponse.message, values);
  }

  if (values.spectate === 'true') {
    setLiveQuizSpectateId(joinResponse.data.id);
  } else {
    setLiveQuizTeamId(joinResponse.data.id);
    updateCacheLiveQuiz(params.userFriendlyQuizId);
  }
  for (let i = 0; i < 16; i++) {
    setLiveQuizAnswersLs(i, {});
  }

  console.log('Joined quiz, teamId/spectateId=', params.userFriendlyQuizId);
  setLiveQuizJoinedId(params.userFriendlyQuizId);
  setLiveQuizJoinedDate(new Date());

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
    setNoRedirect(false);
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
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const liveQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizPublicStateResponse>
  >({
    isError: props.error,
    cache: getFromCache(
      'get',
      '/api/live/' + params.userFriendlyQuizId + '/meta'
    ),
  });

  const handleSpectateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();

    const formData = new FormData();
    formData.set('spectate', String(true));
    fetcher.submit(formData, {
      method: 'post',
      action: `/join/${params.userFriendlyQuizId}`,
    });
  };

  useFormResetValues(formId);

  useEffect(() => {
    const existingTeamId = getLiveQuizTeamId();
    const existingQuizId = getLiveQuizJoinedId();
    const existingQuizJoinedDate = getLiveQuizJoinedDate();
    const dayjsJoinedDate = dayjs(existingQuizJoinedDate);
    const dayjsNow = dayjs();
    const isNoRedirect =
      new URLSearchParams(window.location.search).get('noredirect') ===
        'true' || getIsNoRedirect();
    if (
      existingTeamId &&
      existingQuizId &&
      dayjsJoinedDate.add(5, 'hours').isAfter(dayjsNow) &&
      !isNoRedirect &&
      !params.userFriendlyQuizId
    ) {
      (window as any).location = '/live/' + existingQuizId + '?noredirect=true';
    }
  }, []);

  return (
    <>
      <TopBar>
        <CardTitleZone align="left">
          {/* <BackButton useConfirm={false} /> */}
        </CardTitleZone>
        <CardTitle
          style={{
            cursor: 'pointer',
          }}
          onClick={() => {
            window.location.href = '/login';
          }}
        >
          {' '}
          <>
            Trivivia
            {/* <IconLeft
              verticalAdjust={-2}
              style={{
                verticalAlign: 'middle',
              }}
              src="/res/favicon_c2.svg"
            /> */}
          </>
        </CardTitle>
        <CardTitleZone align="right">
          <Button
            color="plain"
            onClick={() => {
              (window as any).location =
                'https://github.com/benjamin-t-brown/trivivia';
            }}
          >
            <Img
              style={{
                width: '22px',
                background: 'unset',
              }}
              alt="Github"
              src="/res/github.svg"
            />
          </Button>
          <Button
            color="plain"
            onClick={() => {
              navigate('/settings');
            }}
          >
            <Img
              style={{
                width: '22px',
                background: 'unset',
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
              <h1
                style={{
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    color: getColors().TEXT_DESCRIPTION,
                  }}
                >
                  Welcome!
                </span>
                <br />
                <br />
                <span
                  style={{
                    fontSize: '20px',
                    color: getColors().PRIMARY_TEXT,
                  }}
                >
                  {liveQuizResponse.data.quiz.name}
                </span>
              </h1>
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
                <p>Or</p>
                <Button
                  flex
                  center
                  color="secondary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleSpectateClick}
                >
                  <IconLeft src="/res/trade.svg" />
                  Spectate Quiz
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
                Enter a quiz code to find a quiz.
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
                      minWidth: '205px',
                    }}
                  >
                    <InputLabel htmlFor="code">Quiz Code</InputLabel>
                    <Input
                      fullWidth
                      placeholder="Quiz Code"
                      aria-label="Quiz Code"
                      type="text"
                      name="code"
                      style={{
                        padding: '24px',
                        fontSize: '2rem',
                      }}
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
                  <IconLeft src="/res/magnifying-glass.svg" />
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
