import { createAction, fetchAsync, FetchResponse } from 'actions';
import MobileLayout from 'elements/MobileLayout';
import React, { ReactNode } from 'react';
import {
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
  useSocketIoRefreshState,
} from 'hooks';
import {
  AnswerState,
  AnswerStateGraded,
  AnswerStateStats,
  getNumAnswers,
  getNumRadioBoxes,
  LiveQuizPublicQuestionResponse,
  LiveQuizPublicStateResponse,
  LiveQuizTeamResponse,
} from 'shared/responses';
import TopBar from 'elements/TopBar';
import CardTitleZone from 'elements/CardTitleZone';
import CardTitle from 'elements/CardTitle';
import Button from 'elements/Button';
import IconLeft from 'elements/IconLeft';
import FormErrorText from 'components/FormErrorText';
import InputLabel from 'elements/InputLabel';
import Input from 'elements/Input';
import SectionTitle from 'elements/SectionTitle';
import { colorsDark, getColors } from 'style';
import { getFromCache, updateCacheLiveQuiz } from 'cache';
import {
  getLiveQuizAnswersLs,
  getLiveQuizSpectateId,
  getLiveQuizTeamId,
  setLiveQuizAnswersLs,
  setNoRedirect,
} from 'utils';
import {
  getCurrentRoundFromPublicQuizState,
  isRoundCompletedAndVisible,
  isRoundInProgressAndVisible,
  isRoundLocked,
  isShowingRoundAnswers,
  isWaitingForQuizToStart,
  isWaitingForRoundToComplete,
  isWaitingForRoundToStart,
} from 'quizUtils';
import Img from 'elements/Img';
import { UpdateTeamNameForm } from 'components/UpdateTeamNameForm';
import { SubmittedAnswersForRound } from 'components/SubmittedAnswersForRound';
import { QuizTeamsList } from 'components/QuizTeamsList';
import { QuestionCorrectAnswers } from 'components/QuestionCorrectAnswers';
import { QuestionAnswerInputs } from 'components/QuestionAnswerInputs';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface SubmitAnswersValues {
  submittedAnswers: string;
  didJoker: string;
}
const action = createAction(async (values: SubmitAnswersValues, params) => {
  const submittedAnswers = JSON.parse(values.submittedAnswers);
  for (const i in submittedAnswers) {
    const answers = submittedAnswers[i];
    for (const j in answers) {
      answers[j] = answers[j].trim();
      const answer = answers[j];
      if (answer.length > 255) {
        throwValidationError(
          'Answer too long (must be 255 or less characters).',
          values
        );
      }
    }
  }

  const updateTeamResponse = await fetchAsync<LiveQuizTeamResponse>(
    'put',
    '/api/live/' + params.userFriendlyQuizId + '/submit',
    {
      submittedAnswers: JSON.parse(values.submittedAnswers),
      didJoker: values.didJoker === 'true',
    },
    {
      headers: {
        'live-team-id': getLiveQuizTeamId() ?? '',
      },
    }
  );

  if (updateTeamResponse.error) {
    throwValidationError(updateTeamResponse.message, values);
  }

  updateCacheLiveQuiz(params.userFriendlyQuizId);

  return json(updateTeamResponse);
});

interface UpdateQuizValues {
  teamName?: string;
}
const updateNameAction = createAction(
  async (values: UpdateQuizValues, params) => {
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

    const updateTeamResponse = await fetchAsync<LiveQuizTeamResponse>(
      'put',
      '/api/live/' + params.userFriendlyQuizId + '/join',
      values,
      {
        headers: {
          'live-team-id': getLiveQuizTeamId() ?? '',
        },
      }
    );

    if (updateTeamResponse.error) {
      throwValidationError(updateTeamResponse.message, values);
    }

    updateCacheLiveQuiz(params.userFriendlyQuizId);

    return null;
  }
);

const loader = async ({ params }) => {
  if (!getLiveQuizTeamId() && !getLiveQuizSpectateId()) {
    console.error('No team id or spectate id in LS');
    setNoRedirect(true);
    return redirect('/join/' + params.userFriendlyQuizId);
  }

  const quizResponse = await fetchAsync<LiveQuizPublicStateResponse>(
    'get',
    '/api/live/' + params.userFriendlyQuizId,
    undefined,
    {
      headers: {
        'live-team-id': getLiveQuizTeamId() ?? '',
        'live-spectate-id': getLiveQuizSpectateId() ?? '',
      },
    }
  );

  if (quizResponse.error) {
    console.error({
      status: quizResponse.status,
      statusText: `That quiz could not be found.`,
    });
    return redirect('/join/' + params.userFriendlyQuizId);
  }

  if (getLiveQuizSpectateId()) {
    return json(quizResponse);
  }

  if (!quizResponse.data.teams.find(t => t.id === getLiveQuizTeamId())) {
    console.error('teamId does not exist in quiz.', quizResponse.data);
    setNoRedirect(true);
    return redirect('/join/' + params.userFriendlyQuizId);
  }

  return json(quizResponse);
};

const QuizInRound = (props: { quizState: LiveQuizPublicStateResponse }) => {
  const currentRound = getCurrentRoundFromPublicQuizState(props.quizState);
  const fetcher = useFetcher();
  const params = useParams();
  const [submitted, setSubmitted] = React.useState(false);
  const [usedJoker, setUsedJoker] = React.useState(
    props.quizState.round?.didJoker ?? false
  );

  let initialState = getLiveQuizAnswersLs(
    props.quizState.quiz.currentRoundNumber
  );

  if (!initialState || isShowingRoundAnswers(props.quizState.quiz)) {
    initialState = props.quizState?.round?.answersSubmitted ?? {};
  }

  const [state, dispatch]: [Record<string, AnswerState>, any] =
    React.useReducer<any>(
      (
        state: AnswerState,
        action: {
          questionNumber: number;
          type: 'answer' | 'radio';
          i: number;
          value: string;
        }
      ) => {
        let answers = state[action.questionNumber];
        if (!answers) {
          answers = state[action.questionNumber] = {};
        }
        answers[action.type + action.i] = action.value;

        const newState: Record<string, AnswerState> = { ...state } as any;
        setLiveQuizAnswersLs(props.quizState.quiz.currentRoundNumber, newState);
        setSubmitted(false);

        return newState;
      },
      initialState
    ) as any;

  const handleJokerChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUsedJoker(Boolean(ev.target.checked));
  };

  const handleSubmitClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    setSubmitted(true);

    const formData = new FormData();
    formData.set('submittedAnswers', JSON.stringify(state));
    formData.set('didJoker', String(usedJoker));
    fetcher.submit(formData, {
      method: 'post',
      action: `/live/${params.userFriendlyQuizId}`,
    });
  };

  if (!currentRound) {
    return <div></div>;
  }

  const isPristine = true || state === initialState;
  const isLoading = fetcher.state === 'submitting';
  const hasSubmitted = submitted;
  const isSpectating = Boolean(getLiveQuizSpectateId());

  const isRoundAcceptingSubmissions =
    currentRound.questionNumber >= currentRound.totalNumberOfQuestions &&
    !isRoundLocked(props.quizState.quiz);
  const hasJokerPreviouslyBeenUsed =
    props.quizState.hasUsedJoker && !props.quizState.round?.didJoker;

  return (
    <fetcher.Form>
      <p
        style={{
          color: getColors().TEXT_DEFAULT,
        }}
      >
        <span
          style={{
            color: getColors().TEXT_DESCRIPTION,
          }}
        >
          Round {currentRound?.roundNumber}:
        </span>{' '}
        {currentRound?.title}
        <br />
        <br />
        <span
          style={{
            color: getColors().TEXT_DESCRIPTION,
          }}
        >
          Description:
        </span>{' '}
        {currentRound?.description}
      </p>
      {currentRound?.questions.map((q, i) => {
        let answers = q.answers;
        if (answers && Object.keys(answers).length === 0) {
          answers = undefined;
        }
        return (
          <QuestionAnswerInputs
            key={i}
            questionNumber={i + 1}
            question={q}
            dispatch={dispatch}
            answersSaved={state[i + 1] ?? {}}
            answersQuestion={answers}
            answersGraded={currentRound.answersGraded?.[i + 1]}
            answersStats={currentRound.stats?.[i + 1]}
            disabled={isRoundLocked(props.quizState.quiz)}
            numTeams={props.quizState.teams.length}
          />
        );
      })}
      {isShowingRoundAnswers(props.quizState.quiz) ? (
        <></>
      ) : (
        <>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div
                style={{
                  display:
                    isSpectating || props.quizState.round?.jokerDisabled
                      ? 'none'
                      : 'flex',
                  alignItems: 'center',
                  minHeight: '42px',
                  marginTop: '16px',
                }}
              >
                <Input
                  aria-label="Answer"
                  type="checkbox"
                  id="use-joker"
                  checked={usedJoker}
                  disabled={hasJokerPreviouslyBeenUsed}
                  onChange={
                    isRoundLocked(props.quizState.quiz) ||
                    hasJokerPreviouslyBeenUsed
                      ? () => void 0
                      : handleJokerChange
                  }
                  style={{
                    transform: 'scale(2)',
                    transformOrigin: 'left',
                    marginRight: '16px',
                    pointerEvents:
                      isRoundLocked(props.quizState.quiz) ||
                      hasJokerPreviouslyBeenUsed
                        ? 'none'
                        : 'auto',
                  }}
                />
                <label
                  htmlFor="use-joker"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Img
                    style={{
                      width: '42px',
                    }}
                    alt="Joker"
                    src="/res/card-joker.svg"
                  />
                  Use Joker?
                </label>
              </div>
              {hasJokerPreviouslyBeenUsed ? (
                <div
                  style={{
                    color: getColors().TEXT_DESCRIPTION,
                    fontSize: '14px',
                  }}
                >
                  {' '}
                  Your joker has already been used{' '}
                </div>
              ) : null}
              {isSpectating ? null : (
                <Button
                  flex
                  center
                  color={
                    !hasSubmitted || !props.quizState.round?.answersSubmitted
                      ? 'tertiary'
                      : 'primary'
                  }
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    textAlign: 'center',
                    justifyContent: 'center',
                  }}
                  disabled={!isRoundAcceptingSubmissions}
                  type="submit"
                  onClick={handleSubmitClick}
                >
                  {isRoundAcceptingSubmissions ? (
                    <>
                      {hasSubmitted ? (
                        <IconLeft
                          style={{
                            marginLeft: '0px',
                          }}
                          src="/res/check-mark.svg"
                        />
                      ) : (
                        <IconLeft
                          style={{
                            marginLeft: '0px',
                          }}
                          src="/res/edit.svg"
                        />
                      )}
                      <span>{hasSubmitted ? 'Submit' : 'Submit*'}</span>
                    </>
                  ) : (
                    <>
                      <IconLeft src="/res/padlock.svg" />
                      {isRoundLocked(props.quizState.quiz) ? (
                        <span>Submit (Round locked)</span>
                      ) : (
                        <span>Submit (Wait to submit)</span>
                      )}
                    </>
                  )}
                </Button>
              )}
              {hasSubmitted ? (
                <div
                  style={{
                    textAlign: 'left',
                  }}
                >
                  Submitted!
                </div>
              ) : null}
              <SubmittedAnswersForRound
                submittedAnswersRound={
                  props.quizState.round?.answersSubmitted || {}
                }
                quizState={props.quizState}
              />
            </>
          )}
        </>
      )}
    </fetcher.Form>
  );
};

const LiveQuiz = (props: { error?: boolean }) => {
  const params = useParams();
  const formId = 'live-quiz-form';
  const fetcher = useFetcher();
  const navigate = useNavigate();

  let liveQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizPublicStateResponse>
  >({
    isError: props.error,
    cache: getFromCache('get', '/api/live/' + params.userFriendlyQuizId),
  });

  useFormResetValues(formId);
  const { requireReconnected } = useSocketIoRefreshState(fetcher);

  if (fetcher.data) {
    liveQuizResponse = fetcher.data;
  }

  if (!liveQuizResponse?.data) {
    return <div>The page will redirect soon...</div>;
  }

  const isSpectating = Boolean(getLiveQuizSpectateId());

  return (
    <>
      <TopBar>
        <CardTitleZone align="left">
          <Button
            color="plain"
            onClick={() => {
              (window as any).location = '/login';
            }}
          >
            <Img
              style={{
                width: '22px',
                background: 'unset',
              }}
              alt="login"
              src="/res/person.svg"
            />
          </Button>
        </CardTitleZone>
        <CardTitle>
          <>Trivivia</>
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
          <>
            <p>
              {requireReconnected ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: colorsDark.ERROR_TEXT,
                    position: 'fixed',
                    left: 0,
                    top: '54px',
                    background: '#000',
                    width: '100%',
                  }}
                >
                  Disconnected! Please refresh...
                </div>
              ) : null}
              <span
                style={{
                  color: getColors().TEXT_DESCRIPTION,
                }}
              >
                Connected to quiz:
              </span>{' '}
              {liveQuizResponse.data.quiz.name}
              {isSpectating ? (
                <>
                  <br />
                  <span
                    style={{
                      textAlign: 'center',
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    You are spectating this quiz.
                  </span>
                </>
              ) : null}
            </p>
            {isWaitingForQuizToStart(liveQuizResponse.data.quiz) ? (
              <>
                <p
                  style={{
                    textAlign: 'center',
                    color: getColors().SUCCESS_TEXT,
                  }}
                >
                  Successfully connected!
                </p>
                <p
                  style={{
                    textAlign: 'center',
                    color: getColors().TEXT_DESCRIPTION,
                  }}
                >
                  Waiting for quiz to start...
                </p>
                {isSpectating ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    Want to join instead?{' '}
                    <Link to={`/join/${params.userFriendlyQuizId}`}>
                      Click here.
                    </Link>
                  </p>
                ) : (
                  <UpdateTeamNameForm />
                )}
              </>
            ) : null}
            {isWaitingForRoundToStart(liveQuizResponse.data.quiz) ||
            isWaitingForRoundToComplete(liveQuizResponse.data.quiz) ? (
              <>
                {liveQuizResponse.data.isComplete ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    Thank you for playing!
                  </p>
                ) : (
                  <p
                    style={{
                      textAlign: 'center',
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    Please wait for the next round to start...
                  </p>
                )}
              </>
            ) : null}
            {isRoundInProgressAndVisible(liveQuizResponse.data.quiz) ||
            isRoundCompletedAndVisible(liveQuizResponse.data.quiz) ||
            isShowingRoundAnswers(liveQuizResponse.data.quiz) ? (
              <QuizInRound quizState={liveQuizResponse.data} />
            ) : null}
            <FormErrorText />
            <QuizTeamsList quizState={liveQuizResponse.data} />
          </>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const LiveQuizRoute = {
  path: '/live/:userFriendlyQuizId',
  element: <LiveQuiz />,
  errorElement: <LiveQuiz error={true} />,
  loader,
  action,
};

export const LiveQuizUpdateRoute = {
  path: '/live/:userFriendlyQuizId/update',
  element: <LiveQuiz />,
  errorElement: <LiveQuiz error={true} />,
  loader,
  action: updateNameAction,
};
