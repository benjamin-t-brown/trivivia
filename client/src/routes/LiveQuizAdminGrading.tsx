import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  json,
  redirect,
  useFetcher,
  useNavigate,
  useParams,
} from 'react-router-dom';
import styled from 'styled-components';
import { getColors } from 'style';
import { throwValidationError, useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import { LiveQuizResponse, LiveQuizTeamResponse } from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import SectionTitle from 'elements/SectionTitle';
import { ANSWER_DELIMITER, getRoundAnswersArrays } from 'utils';
import Input from 'elements/Input';
import { AnswerStateGraded } from 'shared/responses';
import { GradeInputState } from 'shared/requests';
import Accordion, { AccordionItem } from 'elements/Accordion';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const Loading = styled.div<{ visible: boolean }>(props => {
  return {
    display: props.visible ? 'flex' : 'none',
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0px',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '32px',
    background: 'rgba(0,0,0,0.5)',
  };
});

interface GradeQuizValues {
  state: string;
}
const action = createAction(async (values: GradeQuizValues, params) => {
  const result = await fetchAsync<LiveQuizResponse>(
    'put',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/grade',
    {
      gradeState: JSON.parse(values.state),
    }
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheLiveQuizAdmin(result.data.id, result);
  return null;
});

const loader = async ({ params }) => {
  const quizTemplatesResponse = await fetchAsync<LiveQuizResponse>(
    'get',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId,
    undefined,
    {
      bustCache: true,
    }
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

const CustomRadioInput = styled.div(() => {
  return {
    margin: '4px',
  };
});

const TeamRound = styled.div<{ isGraded: boolean }>(props => {
  return {
    margin: '8px 0px',
    background: getColors().BACKGROUND2,
    borderRadius: '8px',
    padding: '8px',
    border: props.isGraded
      ? '1px solid ' + getColors().PRIMARY
      : '1px solid ' + getColors().ERROR_TEXT,
  };
});

const RoundAnswer = (props: {
  questionNumber: number;
  teamAnswers: string;
  correctAnswers: string;
  orderMatters: boolean;
  setGradeForAnswer: (args: {
    teamId: string;
    roundId: string;
    questionNumber: number;
    answerNumber: number;
    isCorrect: boolean;
  }) => void;
  team: LiveQuizTeamResponse;
  roundId: string;
  state: GradeInputState;
}) => {
  const individualAnswersSubmitted = props.teamAnswers.split(ANSWER_DELIMITER);
  const individualAnswersCorrect = props.correctAnswers.split(ANSWER_DELIMITER);
  const gradeState =
    props.state[props.team.id][props.roundId][props.questionNumber] ?? {};

  const handleAnswerGradeChange: (
    i: number,
    isCorrect: boolean
  ) => React.ChangeEventHandler<HTMLInputElement> =
    (i: number, isCorrect: boolean) => ev => {
      props.setGradeForAnswer({
        roundId: props.roundId,
        teamId: props.team.id,
        questionNumber: props.questionNumber,
        answerNumber: i,
        isCorrect,
      });
    };

  return (
    <div
      style={{
        margin: '4px 0px',
        // display: 'flex',
        // justifyContent: 'flex-start',
        borderTop: '1px solid ' + getColors().TEXT_DESCRIPTION,
        borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
        paddingBottom: '4px',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        {props.questionNumber}.{' '}
        <span
          style={{
            color: getColors().TEXT_DEFAULT,
            background: getColors().BACKGROUND2,
          }}
        >
          Correct Answer/s: &quot;
          <span
            style={{
              color: getColors().PRIMARY_TEXT,
            }}
          >
            {props.correctAnswers}
          </span>
          &quot;
        </span>
        {props.orderMatters && <div>Order Matters!</div>}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {individualAnswersCorrect.map((answer, i) => {
          const submittedAnswer = individualAnswersSubmitted[i];

          const correctId =
            props.team.id +
            '.' +
            props.roundId +
            '.' +
            props.questionNumber +
            '_answer-' +
            (i + 1) +
            '-correct';
          const incorrectId =
            props.team.id +
            '.' +
            props.roundId +
            '.' +
            props.questionNumber +
            '_answer-' +
            (i + 1) +
            '-incorrect';

          const gradeKey = 'answer' + (i + 1);
          return (
            <div
              key={i}
              style={{
                padding: '4px',
                border:
                  '1px solid ' +
                  (gradeState[gradeKey] === undefined
                    ? getColors().BACKGROUND2
                    : getColors().PRIMARY),
                minWidth: '142px',
                background: getColors().BACKGROUND,
              }}
            >
              {submittedAnswer ? (
                <span style={{ color: getColors().TEXT_DEFAULT }}>
                  {submittedAnswer}
                </span>
              ) : (
                <span style={{ color: getColors().WARNING_TEXT }}>
                  {'(blank)'}
                </span>
              )}
              <div>
                {gradeState[gradeKey] === 'true' ? (
                  <div
                    style={{
                      color: getColors().SUCCESS_TEXT,
                      fontSize: '12px',
                    }}
                  >
                    Correct
                  </div>
                ) : null}
                {gradeState[gradeKey] === 'false' ? (
                  <div
                    style={{
                      color: getColors().ERROR_TEXT,
                      fontSize: '12px',
                    }}
                  >
                    Incorrect
                  </div>
                ) : null}
                {gradeState[gradeKey] === undefined ? (
                  <div
                    style={{
                      color: getColors().TEXT_DESCRIPTION,
                      fontSize: '12px',
                    }}
                  >
                    (not graded)
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: 'flex',
                }}
              >
                <CustomRadioInput>
                  <Input
                    type="radio"
                    id={correctId}
                    name={correctId}
                    checked={gradeState[gradeKey] === 'true'}
                    onChange={handleAnswerGradeChange(i + 1, true)}
                  />
                  <label
                    htmlFor={correctId}
                    style={{
                      marginLeft: '16px',
                    }}
                  >
                    <img
                      style={{
                        width: '22px',
                        background:
                          gradeState[gradeKey] === 'true'
                            ? getColors().SUCCESS_BACKGROUND
                            : 'unset',
                      }}
                      alt="Correct"
                      src="/res/check-mark.svg"
                    />
                  </label>
                </CustomRadioInput>
                <CustomRadioInput>
                  <Input
                    type="radio"
                    id={incorrectId}
                    name={correctId}
                    checked={gradeState[gradeKey] === 'false'}
                    onChange={handleAnswerGradeChange(i + 1, false)}
                  />
                  <label
                    htmlFor={incorrectId}
                    style={{
                      marginLeft: '16px',
                    }}
                  >
                    <img
                      style={{
                        width: '22px',
                        background:
                          gradeState[gradeKey] === 'false'
                            ? getColors().ERROR_BACKGROUND
                            : 'unset',
                      }}
                      alt="Incorrect"
                      src="/res/cancel.svg"
                    />
                  </label>
                </CustomRadioInput>
              </div>
            </div>
          );
        })}{' '}
      </div>
    </div>
  );
};

const getInitialGradeState = (liveQuiz?: LiveQuizResponse) => {
  if (!liveQuiz) {
    return {};
  }

  const initialState: any = {};

  liveQuiz.liveQuizTeams.forEach(team => {
    const gradeState = (initialState[team.id] = {});
    team.liveQuizRoundAnswers.forEach(roundAnswers => {
      const answerGradeState = (gradeState[roundAnswers.roundId] = {});
      for (const key in roundAnswers.answersGraded) {
        answerGradeState[key] = roundAnswers.answersGraded[key];
      }
    });
  });
  return initialState;
};

const areAllAnswersGradedForTeamRound = (args: {
  state: GradeInputState;
  teamId: string;
  roundId: string;
  answersArr: string[];
}) => {
  const roundGradeState = args.state[args.teamId][args.roundId];

  if (!roundGradeState) {
    return false;
  }

  for (let i = 0; i < args.answersArr.length; i++) {
    const questionGradeState = roundGradeState[i + 1];
    const splitAnswers = args.answersArr[i].split(ANSWER_DELIMITER);

    if (!questionGradeState) {
      return false;
    }

    for (let j = 0; j < splitAnswers.length; j++) {
      if (questionGradeState['answer' + (j + 1)] === undefined) {
        return false;
      }
    }
  }
  return true;
};

interface EditLiveQuizProps {
  error?: boolean;
}
const LiveQuizAdminGrading = (props: EditLiveQuizProps) => {
  const params = useParams();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const formId = 'grade-live-quiz-form';
  const liveQuiz = liveQuizResponse?.data;
  const isLoading = fetcher.state === 'submitting';
  const initialState = getInitialGradeState(liveQuiz);
  const [validationError, setValidationError] = React.useState('');

  const [state, dispatch]: [GradeInputState, any] = React.useReducer<any>(
    (
      state: GradeInputState,
      action: {
        teamId: string;
        roundId: string;
        questionNumber: number;
        answerNumber: number;
        value: string;
      }
    ) => {
      const gradeState = state[action.teamId]?.[action.roundId];

      let answers = gradeState[action.questionNumber];
      if (!answers) {
        answers = gradeState[action.questionNumber] = {} as AnswerStateGraded;
      }
      answers['answer' + action.answerNumber] = action.value;

      setValidationError('');

      return { ...state };
    },
    initialState
  ) as any;

  const setGradeForAnswer = (args: {
    teamId: string;
    roundId: string;
    questionNumber: number;
    answerNumber: number;
    isCorrect: boolean;
  }) => {
    dispatch({
      teamId: args.teamId,
      roundId: args.roundId,
      questionNumber: args.questionNumber,
      answerNumber: args.answerNumber,
      value: args.isCorrect ? 'true' : 'false',
    });
  };

  const handleSubmitGradeClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (!liveQuiz) {
      return;
    }

    for (const teamId in state) {
      const team = liveQuiz?.liveQuizTeams.find(t => t.id === teamId);
      for (let i = 1; i <= liveQuiz.currentRoundNumber; i++) {
        const roundId = liveQuiz.quizTemplateJson.roundOrder[i - 1];
        const roundTemplate = liveQuiz?.quizTemplateJson.rounds?.find(
          r => r.id === roundId
        );

        if (!team || !roundTemplate) {
          setValidationError('Could not find team or round.');
          return;
        }

        const { answersArr } = getRoundAnswersArrays(roundTemplate, team);

        if (
          !areAllAnswersGradedForTeamRound({
            state,
            teamId,
            roundId,
            answersArr,
          })
        ) {
          setValidationError('One or more rounds are not fully graded.');
          console.log('found validation errors, but submitting anyway');
        }
      }
    }

    const formData = new FormData();
    formData.append('state', JSON.stringify(state));
    fetcher.submit(formData, {
      method: 'put',
      action: `/live-quiz-admin/${liveQuiz.id}/grade`,
    });
  };

  const handleGoBackClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/live-quiz-admin/' + params.liveQuizId);
  };

  if (!liveQuiz) {
    return (
      <>
        <DefaultTopBar useBackConfirm={false} upTo={'/live-quizzes'} />
        <MobileLayout topBar>
          <FormErrorText />
        </MobileLayout>
      </>
    );
  }

  const elems: any[] = [];

  for (let i = 0; i < liveQuiz.quizTemplateJson.roundOrder.length; i++) {
    const roundId = liveQuiz.quizTemplateJson.roundOrder[i];
    const roundTemplate = liveQuiz.quizTemplateJson.rounds?.find(
      t => t.id === roundId
    );
    if (!roundTemplate || i >= liveQuiz.currentRoundNumber) {
      continue;
    }

    const subElems: AccordionItem[] = [];

    liveQuiz.liveQuizTeams.forEach(team => {
      const { answersArr, teamAnswersArr, orderMattersArr } =
        getRoundAnswersArrays(roundTemplate, team);

      const isGraded = areAllAnswersGradedForTeamRound({
        state,
        teamId: team.id,
        roundId,
        answersArr,
      });

      subElems.push({
        header: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isGraded ? (
              <img
                alt="Graded"
                src="/res/check-mark.svg"
                style={{
                  marginRight: '16px',
                  background: getColors().SUCCESS_BACKGROUND,
                  width: '22px',
                }}
              />
            ) : (
              <img
                alt="Not Graded"
                src="/res/cancel.svg"
                style={{
                  marginRight: '16px',
                  background: getColors().ERROR_BACKGROUND,
                  width: '22px',
                }}
              />
            )}
            <span>{team.teamName}</span>
          </div>
        ),
        item: (
          <TeamRound key={`round${roundId}-${team.id}`} isGraded={isGraded}>
            <div
              style={{
                borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
              }}
            >
              Team:{' '}
              <span
                style={{
                  color: getColors().PRIMARY_TEXT,
                }}
              >
                {team.teamName}
              </span>
            </div>
            {answersArr.map((correctAnswers, j) => {
              const submittedAnswers = teamAnswersArr[j];
              return (
                <div key={team.id + '-' + j}>
                  <RoundAnswer
                    questionNumber={j + 1}
                    correctAnswers={correctAnswers}
                    teamAnswers={submittedAnswers}
                    orderMatters={orderMattersArr[j]}
                    setGradeForAnswer={setGradeForAnswer}
                    team={team}
                    roundId={roundId}
                    state={state}
                  />
                </div>
              );
            })}
          </TeamRound>
        ),
      });
    });

    elems.push(
      <div key={i}>
        <SectionTitle>
          Round {i + 1}: {roundTemplate.title}
        </SectionTitle>
        <Accordion items={subElems} />
      </div>
    );
  }

  return (
    <>
      <DefaultTopBar
        useBackConfirm={false}
        upTo={'/live-quiz-admin/' + params.liveQuizId}
      />
      <MobileLayout topBar>
        <fetcher.Form method="post" id={formId}>
          <InnerRoot>
            <SectionTitle>Grading</SectionTitle>
            <Button
              color="secondary"
              style={{
                width: '100%',
              }}
              onClick={handleGoBackClick}
            >
              Go Back To Quiz
            </Button>
            <Button
              color="primary"
              style={{
                width: '100%',
              }}
              onClick={handleSubmitGradeClick}
            >
              Submit Grades
            </Button>
            <div style={{ color: getColors().ERROR_TEXT }}>
              {validationError}
            </div>
            {elems}
          </InnerRoot>
        </fetcher.Form>
      </MobileLayout>
      <Loading visible={isLoading}>Loading...</Loading>
    </>
  );
};

export const LiveQuizAdminGradingRoute = {
  path: '/live-quiz-admin/:liveQuizId/grade',
  element: <LiveQuizAdminGrading />,
  errorElement: <LiveQuizAdminGrading error={true} />,
  action,
  loader,
};
