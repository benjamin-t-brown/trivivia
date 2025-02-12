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
import { colorsDark, getColors } from 'style';
import { throwValidationError, useConfirmNav, useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import {
  AnswerBoxType,
  LiveQuizResponse,
  LiveQuizTeamResponse,
  QuestionTemplateResponse,
  RoundTemplateResponse,
  getNumAnswers,
  AnswerStateGraded,
  ANSWER_DELIMITER,
  getRoundAnswersArrays,
  isLegacyAnswerBoxType,
  getNumCorrectAnswers,
  extractAnswerBoxType,
} from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import SectionTitle from 'elements/SectionTitle';
import Input from 'elements/Input';
import { GradeInputState } from 'shared/requests';
import Accordion, { AccordionItem } from 'elements/Accordion';
import Img from 'elements/Img';
import { ButtonAction } from 'elements/ButtonAction';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { HSpace } from 'elements/HSpace';
import { StickyContent } from 'elements/FixedContent';

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
    display: 'flex',
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
  questionTemplate?: QuestionTemplateResponse;
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

  let numCorrectAnswers = 0;

  if (
    isLegacyAnswerBoxType(props.questionTemplate?.answerType as AnswerBoxType)
  ) {
    numCorrectAnswers = props.questionTemplate?.answerType
      ? getNumAnswers(props.questionTemplate?.answerType)
      : individualAnswersCorrect.length;
  } else {
    numCorrectAnswers = getNumCorrectAnswers(
      props.questionTemplate?.answerType as AnswerBoxType
    );
    const [type, numInputs, numCorrectAns] = extractAnswerBoxType(
      props.questionTemplate?.answerType as AnswerBoxType
    );
    if (type === 'input') {
      if (numInputs < numCorrectAns) {
        numCorrectAnswers = numInputs;
      }
    }
  }

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
        {new Array(numCorrectAnswers).fill(numCorrectAnswers).map((_, i) => {
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
                    style={{
                      transform: 'scale(1.5)',
                      cursor: 'pointer',
                    }}
                  />
                  <label htmlFor={correctId}>
                    <div
                      style={{
                        width: '16px',
                        display: 'inline-block',
                        cursor: 'pointer',
                      }}
                    ></div>
                    <Img
                      draggable={false}
                      style={{
                        width: '22px',
                        height: '22px',
                        cursor: 'pointer',
                        background:
                          gradeState[gradeKey] === 'true'
                            ? getColors().SUCCESS_BACKGROUND
                            : colorsDark.BACKGROUND,
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
                    style={{
                      transform: 'scale(1.5)',
                      cursor: 'pointer',
                    }}
                  />
                  <label htmlFor={incorrectId}>
                    <div
                      style={{
                        width: '16px',
                        display: 'inline-block',
                        cursor: 'pointer',
                      }}
                    ></div>
                    <Img
                      draggable={false}
                      style={{
                        width: '22px',
                        height: '22px',
                        background:
                          gradeState[gradeKey] === 'false'
                            ? getColors().ERROR_BACKGROUND
                            : colorsDark.BACKGROUND,
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
  roundTemplate: RoundTemplateResponse;
  answersArr: string[];
}) => {
  const roundGradeState = args.state[args.teamId][args.roundId];

  if (!roundGradeState) {
    return false;
  }

  for (let i = 0; i < args.answersArr.length; i++) {
    const questionId = args.roundTemplate.questionOrder[i];
    const questionTemplate = args.roundTemplate.questions?.find(
      q => q.id === questionId
    );
    if (!questionTemplate) {
      return false;
    }

    if (isLegacyAnswerBoxType(questionTemplate.answerType)) {
      const numAnswers = getNumAnswers(questionTemplate.answerType);

      const questionGradeState = roundGradeState[i + 1];

      if (!questionGradeState) {
        return false;
      }

      for (let j = 0; j < numAnswers; j++) {
        if (questionGradeState['answer' + (j + 1)] === undefined) {
          return false;
        }
      }
    } else {
      const [type, numInputs, numCorrectAnswers] = extractAnswerBoxType(
        questionTemplate.answerType
      );

      const questionGradeState = roundGradeState[i + 1];

      if (!questionGradeState) {
        return false;
      }

      if (type === 'input') {
        if (numCorrectAnswers > numInputs) {
          for (let j = 0; j < numInputs; j++) {
            if (questionGradeState['answer' + (j + 1)] === undefined) {
              return false;
            }
          }
        } else {
          for (let j = 0; j < numCorrectAnswers; j++) {
            if (questionGradeState['answer' + (j + 1)] === undefined) {
              return false;
            }
          }
        }
      } else {
        for (let j = 0; j < numCorrectAnswers; j++) {
          if (questionGradeState['answer' + (j + 1)] === undefined) {
            return false;
          }
        }
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
  const confirmDialog = useConfirmNav(false); // TODO: Implement this

  const [state, dispatch]: [GradeInputState, any] = React.useReducer(
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
            roundTemplate,
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

  for (let i = liveQuiz.quizTemplateJson.roundOrder.length - 1; i >= 0; i--) {
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

      const handleMarkAllIncorrectClick = () => {
        answersArr.map((correctAnswers, j) => {
          const individualAnswersCorrect =
            correctAnswers.split(ANSWER_DELIMITER);
          individualAnswersCorrect.map((answer, i) => {
            setGradeForAnswer({
              roundId: roundId,
              teamId: team.id,
              questionNumber: j + 1,
              answerNumber: i + 1,
              isCorrect: false,
            });
          });
        });
      };

      const isGraded = areAllAnswersGradedForTeamRound({
        state,
        teamId: team.id,
        roundId,
        roundTemplate,
        answersArr,
      });
      const didJoker = team.liveQuizRoundAnswers.find(
        a => a.roundId === roundTemplate.id
      )?.didJoker;

      subElems.push({
        header: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isGraded ? (
              <Img
                alt="Graded"
                src="/res/check-mark.svg"
                draggable={false}
                style={{
                  marginRight: '16px',
                  background: getColors().SUCCESS_BACKGROUND,
                  width: '22px',
                }}
              />
            ) : (
              <Img
                alt="Not Graded"
                src="/res/cancel.svg"
                draggable={false}
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
              {didJoker ? (
                <div>
                  <span
                    style={{
                      color: getColors().SUCCESS_TEXT,
                      cursor: 'pointer',
                      fontSize: '12px',
                      userSelect: 'none',
                      lineHeight: '24px',
                    }}
                  >
                    Joker was used!
                  </span>
                </div>
              ) : null}
              <div
                style={{
                  marginBottom: '8px',
                }}
              >
                <span
                  onClick={handleMarkAllIncorrectClick}
                  style={{
                    color: getColors().TEXT_DESCRIPTION,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '12px',
                    userSelect: 'none',
                    lineHeight: '24px',
                  }}
                >
                  Mark All Incorrect
                </span>
              </div>
            </div>
            {answersArr.map((correctAnswers, j) => {
              const questionId = roundTemplate.questionOrder[j];
              const questionTemplate = roundTemplate.questions?.find(
                q => q.id === questionId
              );
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
                    questionTemplate={questionTemplate}
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
            <StickyContent>
              <div style={{ color: getColors().ERROR_TEXT }}>
                {validationError}
              </div>
              <JustifyContentDiv justifyContent="left">
                <ButtonAction color="secondary" onClick={handleGoBackClick}>
                  Go Back To Quiz
                </ButtonAction>
                <HSpace />
                <ButtonAction color="primary" onClick={handleSubmitGradeClick}>
                  Submit Grades
                </ButtonAction>
              </JustifyContentDiv>
            </StickyContent>
            {elems}
          </InnerRoot>
        </fetcher.Form>
      </MobileLayout>
      <Loading visible={isLoading}>Loading...</Loading>
      {confirmDialog}
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
