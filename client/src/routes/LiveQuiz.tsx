import { createAction, fetchAsync, FetchResponse } from 'actions';
import MobileLayout from 'elements/MobileLayout';
import React, { ReactNode } from 'react';
import {
  Form,
  json,
  Link,
  redirect,
  useFetcher,
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
  AnswerState,
  getNumAnswers,
  getNumRadioBoxes,
  LiveQuizPublicQuestionResponse,
  LiveQuizPublicResponse,
  LiveQuizPublicStateResponse,
  LiveQuizResponse,
  LiveQuizTeamResponse,
  QuestionTemplateResponse,
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
  getLiveQuizAnswersLs,
  getLiveQuizTeamId,
  setLiveQuizAnswersLs,
} from 'utils';
import {
  getCurrentRoundFromPublicQuizState,
  isRoundCompletedAndVisible,
  isRoundInProgressAndVisible,
  isRoundLocked,
  isWaitingForQuizToStart,
  isWaitingForRoundToComplete,
  isWaitingForRoundToStart,
} from 'quizUtils';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface SubmitAnswersValues {
  submittedAnswers: string;
}
const action = createAction(async (values: SubmitAnswersValues, params) => {
  const submittedAnswers = JSON.parse(values.submittedAnswers);
  for (const i in submittedAnswers) {
    const answers = submittedAnswers[i];
    for (const j in answers) {
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
    console.log('UPDATE QUIZ VALUES', values);

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
  if (!getLiveQuizTeamId()) {
    console.error('No team id in LS');
    return redirect('/join/' + params.userFriendlyQuizId);
  }

  const quizResponse = await fetchAsync<LiveQuizPublicStateResponse>(
    'get',
    '/api/live/' + params.userFriendlyQuizId,
    undefined,
    {
      headers: {
        'live-team-id': getLiveQuizTeamId() ?? '',
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

  if (!quizResponse.data.teams.find(t => t.id === getLiveQuizTeamId())) {
    console.error('teamId does not exist in quiz.', quizResponse.data);
    return redirect('/join/' + params.userFriendlyQuizId);
  }

  return json(quizResponse);
};

const UpdateTeamNameForm = () => {
  const fetcher = useFetcher();
  const params = useParams();
  const formId = 'update-team-name-form';
  const [teamName, setTeamName] = React.useState('');

  const handleSubmitClick = (ev: React.MouseEvent) => {
    ev.preventDefault();

    const formData = new FormData();
    formData.set('teamName', teamName);
    fetcher.submit(formData, {
      method: 'post',
      action: `/live/${params.userFriendlyQuizId}/update`,
    });
    setTeamName('');
  };

  const isLoading = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post" id={formId}>
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
          <InputLabel htmlFor="code">Update Team Name</InputLabel>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Input
              placeholder="Team Name"
              aria-label="Team Name"
              type="text"
              name="teamName"
              fullWidth
              value={teamName}
              onChange={ev => setTeamName(ev.target.value)}
            />
          )}
        </div>
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <FormErrorText />
      </div>
      <div style={{ height: '16px' }}></div>
      <Button
        flex
        center
        color="secondary"
        style={{
          width: '100%',
        }}
        disabled={teamName.length <= 0 || isLoading}
        type="submit"
        onClick={handleSubmitClick}
      >
        <IconLeft src="/res/edit.svg" />
        Update Team Name
      </Button>
    </fetcher.Form>
  );
};

const SubmittedAnswersRound = (props: {
  submittedAnswersRound: Record<string, AnswerState>;
  quizState: LiveQuizPublicStateResponse;
}) => {
  const aggAnswers: Record<string, string> = {};
  for (let questionI = 0; questionI < 16; questionI++) {
    const answers = props.submittedAnswersRound[questionI];
    if (!answers) {
      continue;
    }
    aggAnswers[questionI] = '';
    for (let answerI = 0; answerI < 16; answerI++) {
      const answerText = answers['answer' + answerI];
      if (answerText) {
        aggAnswers[questionI] +=
          (aggAnswers[questionI] === '' ? '' : ', ') + answerText;
      }
    }
  }
  return (
    <div
      style={{
        textAlign: 'left',
        display: Object.keys(aggAnswers).length === 0 ? 'none' : 'block',
      }}
    >
      <div
        style={{
          color: getColors().TEXT_DESCRIPTION,
          marginBottom: '8px',
        }}
      >
        Submitted Answers:
      </div>
      {Object.keys(aggAnswers)
        .sort()
        .map(i => {
          return (
            <div
              key={i + 1}
              style={{
                width: '75%',
              }}
            >
              {Number(i) + 1}. {aggAnswers[i]}
            </div>
          );
        })}
    </div>
  );
};

const QuestionAnswer = (props: {
  question: LiveQuizPublicQuestionResponse;
  i: number;
  disabled?: boolean;
  dispatch: React.Dispatch<any>;
  answersSaved: AnswerState;
  answersQuestion: AnswerState;
}) => {
  const handleAnswerChange: (
    i: number
  ) => React.ChangeEventHandler<HTMLInputElement> = i => ev => {
    props.dispatch({
      questionNumber: props.i,
      type: 'answer',
      i,
      value: ev.target.value,
    });
  };

  const handleRadioChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    console.log('SET VALUE', ev.target.value);
    props.dispatch({
      questionNumber: props.i,
      type: 'answer',
      i: 1,
      value: ev.target.value,
    });
  };

  const numAnswers = getNumAnswers(props.question.answerType);
  const numRadioBoxes = getNumRadioBoxes(props.question.answerType);

  const answerBoxes: ReactNode[] = [];
  for (let i = 0; i < numAnswers; i++) {
    answerBoxes.push(
      <div key={i}>
        {/* <InputLabel>Answer {i + 1}</InputLabel> */}
        <Input
          disabled={props.disabled}
          aria-label="Answer"
          type="text"
          value={props.answersSaved['answer' + (i + 1)] ?? ''}
          onChange={handleAnswerChange(i + 1)}
          maxLength={255}
          style={{
            width: '75%',
          }}
        />
      </div>
    );
  }

  const radioBoxes: ReactNode[] = [];
  for (let i = 0; i < numRadioBoxes; i++) {
    const value = props.answersQuestion['radio' + (i + 1)] ?? '';
    radioBoxes.push(
      <div
        key={i}
        style={{
          display: 'flex',
        }}
      >
        <Input
          // disabled={props.disabled}
          type="radio"
          checked={props.answersSaved?.['answer1'] === value}
          id={value}
          value={value}
          onChange={props.disabled ? () => void 0 : handleRadioChange}
        />
        <label
          htmlFor={value}
          style={{
            marginLeft: '16px',
          }}
        >
          {value}
        </label>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: getColors().BACKGROUND2,
        margin: '4px 0px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        {props.i + 1}. {props.question.text}
      </div>
      <div
        style={{
          marginLeft: '16px',
          marginTop: '24px',
        }}
      >
        {radioBoxes}
        {radioBoxes?.length === 0 ? answerBoxes : null}
      </div>
    </div>
  );
};

const QuizInRound = (props: { quizState: LiveQuizPublicStateResponse }) => {
  const currentRound = getCurrentRoundFromPublicQuizState(props.quizState);
  const fetcher = useFetcher();
  const params = useParams();
  const [submitted, setSubmitted] = React.useState(false);

  const initialState =
    getLiveQuizAnswersLs(props.quizState.quiz.currentRoundNumber) ??
    props.quizState?.round?.answersSubmitted;

  console.log('INITIAL STATE?', initialState);

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

  const handleSubmitClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    setSubmitted(true);

    const formData = new FormData();
    formData.set('submittedAnswers', JSON.stringify(state));
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

  const isRoundAcceptingSubmissions =
    currentRound.questionNumber >= currentRound.totalNumberOfQuestions &&
    !isRoundLocked(props.quizState.quiz);

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
          Description -
        </span>{' '}
        {currentRound?.description}
      </p>
      {currentRound?.questions.map((q, i) => {
        return (
          <QuestionAnswer
            key={i}
            i={i}
            question={q}
            dispatch={dispatch}
            answersSaved={state[i] ?? {}}
            answersQuestion={q.answers ?? {}}
            disabled={isRoundLocked(props.quizState.quiz)}
          />
        );
      })}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Button
            flex
            center
            color="primary"
            style={{
              marginTop: '16px',
              width: '100%',
            }}
            disabled={!isRoundAcceptingSubmissions}
            type="submit"
            onClick={handleSubmitClick}
          >
            {isRoundAcceptingSubmissions ? (
              <>
                {hasSubmitted ? (
                  <IconLeft src="/res/check-mark.svg" />
                ) : (
                  <IconLeft src="/res/edit.svg" />
                )}
                <span>{isPristine ? 'Submit' : 'Submit (changed)'}</span>
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
          {hasSubmitted ? (
            <div
              style={{
                textAlign: 'center',
              }}
            >
              Submitted!
            </div>
          ) : null}
          <SubmittedAnswersRound
            submittedAnswersRound={
              props.quizState.round?.answersSubmitted || {}
            }
            quizState={props.quizState}
          />
        </>
      )}
    </fetcher.Form>
  );
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

const LiveQuiz = (props: { error?: boolean }) => {
  const params = useParams();
  const formId = 'live-quiz-form';

  const liveQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizPublicStateResponse>
  >({
    isError: props.error,
    cache: getFromCache('get', '/api/live/' + params.userFriendlyQuizId),
  });

  useFormResetValues(formId);
  console.log('render live quiz', liveQuizResponse);

  if (!liveQuizResponse?.data) {
    return <div>The page will redirect soon...</div>;
  }

  return (
    <>
      <TopBar>
        <CardTitleZone align="left"></CardTitleZone>
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
          <>
            <p
              style={{
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: getColors().TEXT_DESCRIPTION,
                }}
              >
                Connected to quiz:
              </span>{' '}
              {liveQuizResponse.data.quiz.name}
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
                <UpdateTeamNameForm />
              </>
            ) : null}
            {isWaitingForRoundToStart(liveQuizResponse.data.quiz) ||
            isWaitingForRoundToComplete(liveQuizResponse.data.quiz) ? (
              <>
                <p
                  style={{
                    textAlign: 'center',
                    color: getColors().TEXT_DESCRIPTION,
                  }}
                >
                  Get ready! The next round is about to start...
                </p>
              </>
            ) : null}
            {isRoundInProgressAndVisible(liveQuizResponse.data.quiz) ||
            isRoundCompletedAndVisible(liveQuizResponse.data.quiz) ? (
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
