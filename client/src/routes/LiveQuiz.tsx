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
import { getColors } from 'style';
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
  for (let questionI = 1; questionI <= 16; questionI++) {
    const answers = props.submittedAnswersRound[questionI];
    if (!answers) {
      continue;
    }
    aggAnswers[questionI] = '';
    for (let answerI = 1; answerI <= 16; answerI++) {
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
              {Number(i)}. {aggAnswers[i]}
            </div>
          );
        })}
    </div>
  );
};

export const CorrectAnswers = (props: {
  correctAnswers: string[];
  numTeams: number;
  answersStats?: AnswerStateStats;
}) => {
  if (props.correctAnswers.length === 1) {
    // the percentage of teams who got 1 answer correct (since there's only one input, then this is
    // all the data)
    const pct = Math.round(
      (100 * ((props.answersStats?.[1] as number | undefined) ?? 0)) /
        props.numTeams
    );

    return (
      <div>
        <span
          style={{
            color: getColors().TEXT_DESCRIPTION,
            margin: '9px 0',
          }}
        >
          {' '}
          Answer:{' '}
        </span>
        <span
          style={{
            color: getColors().PRIMARY_TEXT,
          }}
        >{`${props.correctAnswers[0]}`}</span>
        <span
          style={{
            color: getColors().TEXT_DEFAULT,
          }}
        >
          {' '}
          ({pct}%)
        </span>
      </div>
    );
  } else {
    const answersStats = props.answersStats ?? {};
    const pctResult: number[] = [];
    const pieFills: {
      min: number;
      max: number;
      pct: number;
      numCorrect: number;
      color: string;
    }[] = [];

    const colors = [
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'indigo',
      'violet',
    ];
    let background = `conic-gradient(`;

    let ctr = 0;
    for (let i = 0; i <= props.correctAnswers.length; i++) {
      const numCorrect = i;
      const pct =
        (100 * ((answersStats[numCorrect] as number) ?? 0)) / props.numTeams;
      pctResult.push(pct);
      if (pct) {
        background += `${colors[ctr]} ${pctResult
          .slice(0, -1)
          .reduce((prev, curr) => prev + curr, 0)}% ${pctResult.reduce(
          (prev, curr) => prev + curr,
          0
        )}%, `;

        const min = Math.round(
          pctResult.slice(0, -1).reduce((prev, curr) => prev + curr, 0)
        );
        const max = Math.round(
          pctResult.reduce((prev, curr) => prev + curr, 0)
        );

        pieFills.push({
          min,
          max,
          pct,
          numCorrect,
          color: colors[ctr],
        });
      }
      ctr++;
    }
    background = background.slice(0, -2) + ')';

    return (
      <div>
        <div
          style={{
            background: getColors().BACKGROUND2,
            padding: '8px 16px 16px 10px',
            border: '1px solid ' + getColors().TEXT_DESCRIPTION,
          }}
        >
          <div
            style={{
              color: getColors().TEXT_DESCRIPTION,
              margin: '9px 0',
            }}
          >
            {' '}
            Correct Answers:{' '}
          </div>

          {props.correctAnswers.map((answer, i) => {
            return (
              <div
                key={i}
                style={{
                  marginLeft: '16px',
                  color: getColors().PRIMARY_TEXT,
                }}
              >
                - {answer}
              </div>
            );
          })}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              margin: '42px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  transform: 'translate(-0px, 39px)',
                }}
              >
                {pieFills
                  .filter(obj => Boolean(obj.pct))
                  .map((obj, i) => {
                    const r = 85;
                    const pie2 = 2 * Math.PI;
                    const piePct = (obj.min + (obj.max - obj.min) / 2) / 100;
                    const translate = `translate(${
                      Math.sin(pie2 * piePct) * r
                    }px, ${-Math.cos(pie2 * piePct) * r}px)`;

                    return (
                      <div
                        key={i}
                        style={{
                          color: obj.color,
                          position: 'absolute',
                          transform: translate,
                          width: '100px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          textAlign: 'center',
                          fontSize: '12px',
                        }}
                      >
                        {obj.numCorrect} correct: {Math.round(obj.pct)}%
                      </div>
                    );
                  })}
              </div>
              <div
                style={{
                  background,
                  borderRadius: '50px',
                  width: '100px',
                  height: '100px',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

const QuestionAnswer = (props: {
  question: LiveQuizPublicQuestionResponse;
  questionNumber: number;
  disabled?: boolean;
  dispatch: React.Dispatch<any>;
  answersSaved: AnswerState;
  answersQuestion?: AnswerState;
  answersGraded?: AnswerStateGraded;
  answersStats?: AnswerStateStats;
  numTeams: number;
}) => {
  const handleAnswerChange: (
    answerNumber: number
  ) => React.ChangeEventHandler<HTMLInputElement> = answerNumber => ev => {
    props.dispatch({
      questionNumber: props.questionNumber,
      type: 'answer',
      i: answerNumber,
      value: ev.target.value,
    });
  };

  const handleRadioChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    props.dispatch({
      questionNumber: props.questionNumber,
      type: 'answer',
      i: 1,
      value: ev.target.value,
    });
  };

  const numAnswers = getNumAnswers(props.question.answerType);
  const numRadioBoxes = getNumRadioBoxes(props.question.answerType);

  const answerBoxes: ReactNode[] = [];

  for (let i = 0; i < numAnswers; i++) {
    const answerKey = 'answer' + (i + 1);

    const style: Record<string, string> = {
      width: '75%',
    };

    let icon;
    if (props.answersGraded || props.answersQuestion) {
      const isCorrectAnswer = props.answersGraded?.[answerKey] === 'true';

      icon = (
        <Img
          style={{
            width: '22px',
            marginRight: '16px',
            background: isCorrectAnswer
              ? getColors().SUCCESS_BACKGROUND
              : getColors().ERROR_BACKGROUND,
          }}
          alt="Answer"
          src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
        />
      );
      style.border = isCorrectAnswer
        ? '1px solid ' + getColors().SUCCESS_TEXT
        : '1px solid ' + getColors().ERROR_TEXT;
    }

    answerBoxes.push(
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
        <Input
          disabled={props.disabled}
          aria-label="Answer"
          type="text"
          value={props.answersSaved[answerKey] ?? ''}
          onChange={handleAnswerChange(i + 1)}
          maxLength={255}
          style={style}
        />
      </div>
    );
  }

  if (answerBoxes.length && props.answersQuestion) {
    answerBoxes.push(
      <CorrectAnswers
        key={'answer' + props.questionNumber}
        correctAnswers={
          Object.keys(props.question.answers ?? {})
            .sort()
            .map(i => props.question?.answers?.[i]) ?? []
        }
        answersStats={props.answersStats}
        numTeams={props.numTeams}
      />
    );
  }

  const radioBoxes: ReactNode[] = [];
  const radioName = 'radio' + props.questionNumber;
  const radioAnswerKey = 'answer1';
  for (let i = 0; i < numRadioBoxes; i++) {
    const value = props.answersQuestion?.['radio' + (i + 1)] ?? '';
    const id = props.questionNumber + '-' + i + '-' + value;

    const style: Record<string, string> = {
      width: '75%',
    };
    const checked = props.answersSaved?.[radioAnswerKey] === value;

    let icon;
    if (props.answersGraded || props.answersStats) {
      const isCorrectAnswer = props.answersGraded?.[radioAnswerKey] === 'true';
      if (props.answersGraded?.[radioAnswerKey] === 'true' && checked) {
        style.border = '1px solid ' + getColors().SUCCESS_TEXT;
        icon = (
          <Img
            style={{
              width: '22px',
              marginRight: '16px',
              background: isCorrectAnswer
                ? getColors().SUCCESS_BACKGROUND
                : getColors().ERROR_BACKGROUND,
            }}
            alt="Answer"
            src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
          />
        );
      }
      if (props.answersGraded?.[radioAnswerKey] === 'false' && checked) {
        style.border = '1px solid ' + getColors().ERROR_TEXT;
        icon = (
          <Img
            style={{
              width: '22px',
              marginRight: '16px',
              background: isCorrectAnswer
                ? getColors().SUCCESS_BACKGROUND
                : getColors().ERROR_BACKGROUND,
            }}
            alt="Answer"
            src={isCorrectAnswer ? '/res/check-mark.svg' : '/res/cancel.svg'}
          />
        );
      }
    }

    radioBoxes.push(
      <div
        key={'radio' + i}
        style={{
          display: 'flex',
          margin: '9px 0px',
          padding: '8px',
          ...style,
        }}
      >
        {icon}
        <Input
          type="radio"
          checked={checked}
          id={id}
          value={value}
          name={radioName}
          onChange={props.disabled ? () => void 0 : handleRadioChange}
          style={{
            transform: 'scale(1.5)',
            pointerEvents: props.disabled ? 'none' : 'auto',
          }}
        />
        <label
          htmlFor={id}
          style={{
            marginLeft: '16px',
          }}
        >
          {value}
        </label>
      </div>
    );
  }

  if (radioBoxes.length && props.question.answers?.[radioAnswerKey]) {
    radioBoxes.push(
      <CorrectAnswers
        key={'radio-answer' + props.questionNumber}
        correctAnswers={[props.question.answers?.[radioAnswerKey]]}
        answersStats={props.answersStats}
        numTeams={props.numTeams}
      />
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
        {props.questionNumber}.{' '}
        {props.question.text.split('\n').map((line, i) => {
          return (
            <React.Fragment key={i}>
              <span key={i} dangerouslySetInnerHTML={{ __html: line }}></span>
              <br />
            </React.Fragment>
          );
        })}
      </div>
      {props.question.imageLink ? (
        props.question.imageLink.includes('<iframe ') ? (
          <div
            dangerouslySetInnerHTML={{ __html: props.question.imageLink }}
          ></div>
        ) : (
          <Img
            style={{
              width: '100%',
            }}
            src={props.question.imageLink}
            alt="Question"
          />
        )
      ) : null}
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
          Description -
        </span>{' '}
        {currentRound?.description}
      </p>
      {currentRound?.questions.map((q, i) => {
        let answers = q.answers;
        if (answers && Object.keys(answers).length === 0) {
          answers = undefined;
        }
        return (
          <QuestionAnswer
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
                  display: isSpectating ? 'none' : 'flex',
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
                  color="primary"
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
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
              )}
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
        {props.quizState.teams
          .sort((a, b) => (a.currentScore > b.currentScore ? -1 : 1))
          .map((team, i) => {
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
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    marginRight: '8px',
                  }}
                >
                  {i + 1}. {team.teamName}
                </span>
                <div
                  style={{
                    width: '95px',
                    flexShrink: '0',
                  }}
                >
                  Score: {team.currentScore}
                </div>
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
  const fetcher = useFetcher();
  const navigate = useNavigate();

  let liveQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizPublicStateResponse>
  >({
    isError: props.error,
    cache: getFromCache('get', '/api/live/' + params.userFriendlyQuizId),
  });

  useFormResetValues(formId);
  const { joined } = useSocketIoRefreshState(fetcher);

  if (fetcher.data) {
    liveQuizResponse = fetcher.data;
  }

  if (!liveQuizResponse?.data) {
    return <div>The page will redirect soon...</div>;
  }

  const isSpectating = Boolean(getLiveQuizSpectateId());

  console.log('render live quiz', liveQuizResponse, 'joined?', joined);

  return (
    <>
      <TopBar>
        <CardTitleZone align="left"></CardTitleZone>
        <CardTitle>Trivivia</CardTitle>
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
              </span>
              <br />
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
