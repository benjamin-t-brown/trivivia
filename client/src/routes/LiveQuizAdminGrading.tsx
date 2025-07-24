import { fetchAsync, FetchResponse, createAction } from 'actions';
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
import { throwValidationError, useConfirmNav, useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import {
  LiveQuizResponse,
  AnswerStateGraded,
  getRoundAnswersArrays,
  GradeOutputState,
  AnswerStateGradedCertainty,
} from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import SectionTitle from 'elements/SectionTitle';
import { GradeInputState } from 'shared/requests';
import { ButtonAction } from 'elements/ButtonAction';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { HSpace } from 'elements/HSpace';
import { StickyContent } from 'elements/FixedContent';
import { IconButton } from 'elements/IconButton';
import { AdminGradeRoundAccordion } from 'components/AdminGradeRoundAccordion';
import { areAllAnswersGradedForTeamRound } from 'gradeHelpers';

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
  const result = await fetchAsync<GradeInputState>(
    'put',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/grade',
    {
      gradeState: JSON.parse(values.state),
    }
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  // updateCacheLiveQuizAdmin(result.data.id, result);
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

interface DispatchAction {
  resetState?: LiveQuizResponse;
  teamId: string;
  roundId: string;
  questionNumber: number;
  answerNumber: number;
  value: string;
  certainty?: number;
}

export type GradeCertaintyState = Record<
  string,
  Record<string, AnswerStateGradedCertainty>
>;

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
  const initialState = {
    gradeInputState: getInitialGradeState(liveQuiz) as GradeInputState,
    gradeCertaintyState: {} as GradeCertaintyState,
  };
  const [validationError, setValidationError] = React.useState('');
  const [isAutograding, setIsAutograding] = React.useState(false);
  const confirmDialog = useConfirmNav(false); // TODO: Implement this

  const [outerState, dispatch]: [
    typeof initialState,
    (action: DispatchAction) => void
  ] = React.useReducer(
    (prevState: typeof initialState, action: DispatchAction) => {
      if (action.resetState) {
        return getInitialGradeState(action.resetState);
      }

      const gradeState =
        prevState.gradeInputState[action.teamId]?.[action.roundId];

      let answers = gradeState[action.questionNumber];
      if (!answers) {
        answers = gradeState[action.questionNumber] = {} as AnswerStateGraded;
      }
      answers['answer' + action.answerNumber] = action.value;

      if (action.certainty !== undefined) {
        if (!prevState.gradeCertaintyState) {
          prevState.gradeCertaintyState = {} as GradeCertaintyState;
        }

        if (!prevState.gradeCertaintyState[action.teamId]) {
          prevState.gradeCertaintyState[action.teamId] = {} as Record<
            string,
            AnswerStateGradedCertainty
          >;
        }

        if (!prevState.gradeCertaintyState[action.teamId][action.roundId]) {
          prevState.gradeCertaintyState[action.teamId][action.roundId] =
            {} as any;
        }

        const certaintyState =
          prevState.gradeCertaintyState[action.teamId][action.roundId];

        let certainties = certaintyState[action.questionNumber];
        if (!certainties) {
          certainties = certaintyState[action.questionNumber] = {} as Record<
            string,
            AnswerStateGradedCertainty
          >;
        }

        certainties['answer' + action.answerNumber] = action.certainty;
      }

      setValidationError('');

      return {
        ...prevState,
      };
    },
    initialState
  );

  const setGradeForAnswer = (args: {
    teamId: string;
    roundId: string;
    questionNumber: number;
    answerNumber: number;
    isCorrect: boolean;
    certainty?: number;
  }) => {
    dispatch({
      teamId: args.teamId,
      roundId: args.roundId,
      questionNumber: args.questionNumber,
      answerNumber: args.answerNumber,
      value: args.isCorrect ? 'true' : 'false',
      certainty: args.certainty,
    });
  };

  const handleSubmitGradeClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (!liveQuiz) {
      return;
    }

    // check if some things aren't graded yet and show warning if true
    for (const teamId in outerState.gradeInputState) {
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
            state: outerState.gradeInputState,
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
    formData.append('state', JSON.stringify(outerState.gradeInputState));
    fetcher.submit(formData, {
      method: 'put',
      action: `/live-quiz-admin/${liveQuiz.id}/grade`,
    });
  };

  const handleGoBackClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/live-quiz-admin/' + params.liveQuizId);
  };

  const handleAutogradeClick = async (roundId: string) => {
    if (!liveQuiz) {
      return;
    }

    setIsAutograding(true);

    try {
      const result = await fetchAsync<GradeOutputState>(
        'put',
        `/api/live-quiz-admin/quiz/${liveQuiz.id}/autograde`,
        {
          roundIds: [roundId],
        }
      );

      if (result.error) {
        setValidationError('Autograding failed: ' + result.message);
      } else {
        liveQuiz.updatedOn = new Date().toISOString();
        for (const teamId in result.data) {
          for (const roundId in result.data[teamId]) {
            for (const questionNumber in result.data[teamId][roundId]) {
              const questionNumberP = parseInt(questionNumber);
              if (isNaN(questionNumberP)) {
                continue;
              }
              const obj = result.data[teamId][roundId][questionNumber];
              const answerState = obj.gradeState;
              const certainty = obj.certainty;
              for (const answerNumber in answerState) {
                const answerNumberP = parseInt(
                  answerNumber.slice('answer'.length)
                );
                if (isNaN(answerNumberP)) {
                  continue;
                }
                setGradeForAnswer({
                  teamId,
                  roundId,
                  questionNumber: questionNumberP,
                  answerNumber: answerNumberP,
                  isCorrect: answerState[answerNumber] === 'true',
                  certainty: certainty[answerNumber],
                });
              }
            }
          }
        }
      }
    } catch (error) {
      setValidationError('Autograding failed: ' + error.message);
    } finally {
      setIsAutograding(false);
    }
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

    elems.push(
      <div key={i}>
        <SectionTitle>
          Round {i + 1}: {roundTemplate.title}
        </SectionTitle>
        <div
          style={{
            margin: '4px 0px',
          }}
        >
          <ButtonAction
            color="primary"
            onClick={ev => {
              ev.preventDefault();
              handleAutogradeClick(roundId);
            }}
            disabled={isAutograding}
          >
            <IconButton src="/res/notebook.svg" />
            {isAutograding ? 'Autograding...' : 'Autograde Round'}
          </ButtonAction>
        </div>
        <AdminGradeRoundAccordion
          gradeState={outerState.gradeInputState}
          certaintyState={outerState.gradeCertaintyState}
          roundId={roundId}
          roundTemplate={roundTemplate}
          liveQuiz={liveQuiz}
          setGradeForAnswer={setGradeForAnswer}
        />
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
      <Loading visible={isLoading || isAutograding}>
        {isAutograding ? 'Autograding...' : 'Loading...'}
      </Loading>
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
