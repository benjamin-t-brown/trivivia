import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React, { useEffect, useState } from 'react';
import {
  Link,
  json,
  redirect,
  useFetcher,
  useNavigate,
  useParams,
  useRevalidator,
} from 'react-router-dom';
import styled from 'styled-components';
import { getColors } from 'style';
import {
  throwValidationError,
  useConfirmDialog,
  useInfoDialog,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
  QuestionTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import {
  formatTextWithUrls,
  getCurrentRound,
  getQuestionAnswerString,
  getQuestionsFromRoundInLiveQuiz,
  getRoundsFromLiveQuiz,
  quizStateToLabel,
  roundStateToLabel,
} from 'utils';
import SectionTitle from 'elements/SectionTitle';
import IconLeft from 'elements/IconLeft';
import {
  isQuizCompleted,
  isRoundCompleted,
  isRoundCompletedAndVisible,
  isRoundInProgressAndVisible,
  isRoundInProgressButNotVisible,
  isRoundLocked,
  isShowingRoundAnswers,
  isShowingRoundQuestions,
  isWaitingForQuizToStart,
  isWaitingForRoundToStart,
} from 'quizUtils';
import Img from 'elements/Img';
import LiveQuizAdminInfo from 'components/LiveQuizAdminInfo';
import { QuestionCorrectAnswers } from 'components/QuestionCorrectAnswers';
import { QuizTeamsListAdmin } from 'components/AdminQuizTeamsList';
import { AdminRoundListControls } from 'components/AdminRoundListControls';
import { HSpace } from 'elements/HSpace';
import { AdminQuestionListControls } from 'components/AdminQuestionListControls';
import { ButtonAction } from 'elements/ButtonAction';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { IconButton } from 'elements/IconButton';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const ContentSpacer = () => {
  return <div style={{ height: '16px' }}></div>;
};

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

interface UpdateQuizValues {
  roundNumber?: number | string;
  questionNumber?: number | string;
  roundAnswerNumber?: number | string;
  quizState?: LiveQuizState;
  roundState?: LiveRoundState;
  reset?: 'true' | 'false' | boolean;
}
const action = createAction(async (values: UpdateQuizValues, params) => {
  if (Object.keys(values).length === 0) {
    return null;
  }

  if (values.reset === 'true') {
    values.reset = true;
  } else if (values.reset === 'false') {
    values.reset = false;
  }

  if (values.roundNumber) {
    values.roundNumber = parseInt(values.roundNumber as string);
  }
  if (values.questionNumber) {
    values.questionNumber = parseInt(values.questionNumber as string);
  }
  if (values.roundAnswerNumber) {
    values.roundAnswerNumber = parseInt(values.roundAnswerNumber as string);
  }

  const result = await fetchAsync<LiveQuizResponse>(
    'put',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/update',
    values
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheLiveQuizAdmin(result.data.id, result);
  return null;
});

const deleteTeamAction = createAction(
  async (values: { teamId: string }, params) => {
    if (!values.teamId) {
      throwValidationError('Please fill out the form.', values);
    }

    const result = await fetchAsync<LiveQuizResponse>(
      'delete',
      '/api/live-quiz-admin/quiz/' +
        params.liveQuizId +
        '/team/' +
        values.teamId
    );

    if (result.error) {
      throwValidationError(result.message, values);
    }

    updateCacheLiveQuizAdmin(params.liveQuizId, undefined);
    return null;
    // return redirect('/live-quiz-admin/' + params.liveQuizId);
  }
);

const updateScoresAction = createAction(
  async (
    values: {
      upToRoundNum: string | number;
    },
    params
  ) => {
    if (values.upToRoundNum) {
      values.upToRoundNum = parseInt(values.upToRoundNum as string);
    }

    const result = await fetchAsync<LiveQuizResponse>(
      'put',
      '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/update-scores',
      values
    );

    if (result.error) {
      throwValidationError(result.message, values);
    }

    updateCacheLiveQuizAdmin(params.liveQuizId, undefined);
    return null;
  }
);

const loader = async ({ params }) => {
  const quizTemplatesResponse = await fetchAsync<LiveQuizResponse>(
    'get',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId,
    undefined,
    {
      // since this page shows current active information that can change frequently,
      // don't use cache.  Also helps the revalidator/refresh button work without
      // extra logic.
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

interface EditLiveQuizProps {
  error?: boolean;
}
const LiveQuizAdmin = (props: EditLiveQuizProps) => {
  const params = useParams();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const render = useReRender();
  const formId = 'edit-live-quiz-form';
  const updateAction = '/live-quiz-admin/' + params.liveQuizId;
  const revalidator = useRevalidator();

  const [adminInfoExpanded, setAdminInfoExpanded] = useState(false);

  const { setOpen: setAdminInfoOpen, infoDialog: adminInfoDialog } =
    useInfoDialog({
      title: 'Quiz Info',
      confirmLabel: 'Okay',
      body: () => {
        return (
          <div>
            {liveQuiz ? (
              <LiveQuizAdminInfo liveQuiz={liveQuiz} expanded={true} />
            ) : (
              <div>Error... live quiz not set</div>
            )}
          </div>
        );
      },
      onConfirm: () => {
        setAdminInfoOpen(false);
      },
    });

  const { setOpen: setResetConfirmOpen, confirmDialog: resetConfirmDialog } =
    useConfirmDialog({
      title: 'Confirm Reset',
      body: () => {
        return (
          <div>
            Are you sure you wish to reset this quiz? All teams will be deleted
            and their answers will be lost.
          </div>
        );
      },
      onConfirm: () => {
        const formData = new FormData();
        formData.set('reset', true as any);
        fetcher.submit(formData, {
          method: 'post',
          action: updateAction,
        });
        render();
      },
    });

  const { setOpen: setHaltConfirmOpen, confirmDialog: haltConfirmDialog } =
    useConfirmDialog({
      title: 'Confirm Stop',
      body: () => {
        return (
          <div>
            Are you sure you wish to stop this quiz? The quiz will immediately
            end, and will not be able to be restarted.
          </div>
        );
      },
      onConfirm: () => {
        const formData = new FormData();
        formData.set('reset', true as any);
        fetcher.submit(formData, {
          method: 'post',
          action: updateAction,
        });
        render();
      },
    });

  const handleStartQuizClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.append('quizState', LiveQuizState.STARTED_WAITING);

    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleBackRoundClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'roundNumber',
      String((liveQuiz?.currentRoundNumber ?? 0) - 1)
    );
    formData.set('questionNumber', String(0));
    // formData.set('quizState', LiveQuizState.STARTED_IN_ROUND);
    // formData.set('roundState', LiveRoundState.STARTED_ACCEPTING_ANSWERS);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleStopRoundClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('quizState', LiveQuizState.STARTED_WAITING);
    formData.set('roundState', LiveRoundState.COMPLETED);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleResetQuizClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    setResetConfirmOpen(true);
  };

  const handleHaltQuizClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    setHaltConfirmOpen(true);
  };

  const handleStartRoundClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'roundNumber',
      String((liveQuiz?.currentRoundNumber ?? 0) + 1)
    );
    formData.set('questionNumber', String(0));
    formData.set('quizState', LiveQuizState.STARTED_IN_ROUND);
    formData.set('roundState', LiveRoundState.STARTED_ACCEPTING_ANSWERS);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
    render();
  };

  const handleResumeRoundClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('quizState', LiveQuizState.STARTED_IN_ROUND);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleGradeClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/live-quiz-admin/' + params.liveQuizId + '/grade');
  };

  const handleShowAnswersClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('quizState', LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleUpdateScoresClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'upToRoundNum',
      String(liveQuiz?.currentRoundAnswerNumber ?? 8)
    );
    fetcher.submit(formData, {
      method: 'put',
      action: `/live-quiz-admin/${params.liveQuizId}/scores`,
    });
  };

  const handleLockUnlockSubmissions = ev => {
    ev.preventDefault();
    const isCurrentlyLocked = isRoundLocked(liveQuiz);
    const formData = new FormData();
    formData.set(
      'roundState',
      isCurrentlyLocked
        ? LiveRoundState.STARTED_ACCEPTING_ANSWERS
        : LiveRoundState.COMPLETED
    );
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleRoundAnswersShowClick =
    (round: RoundTemplateResponse) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      if (!liveQuiz) {
        return;
      }
      const formData = new FormData();
      formData.set('quizState', LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN);
      formData.set(
        'roundAnswerNumber',
        String(
          liveQuiz.quizTemplateJson.roundOrder.findIndex(
            id => round.id === id
          ) + 1
        )
      );
      fetcher.submit(formData, {
        method: 'post',
        action: updateAction,
      });
    };

  const liveQuiz = liveQuizResponse?.data;
  const isLoading = fetcher.state === 'submitting';

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

  const roundNotes = formatTextWithUrls(getCurrentRound(liveQuiz)?.notes);

  return (
    <>
      <DefaultTopBar useBackConfirm={false} upTo={'/live-quizzes'} />
      <MobileLayout topBar>
        <fetcher.Form method="post" id={formId}>
          <InnerRoot>
            <p></p>
            <div>
              Live Quiz:{' '}
              <span style={{ color: getColors().TEXT_DEFAULT }}>
                {liveQuiz.name}{' '}
                <span
                  style={{
                    userSelect: 'text',
                    cursor: 'auto',
                  }}
                >
                  ({liveQuiz.userFriendlyId})
                </span>
              </span>
              <HSpace />
              <Button
                color="plain"
                style={{
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setAdminInfoOpen(true);
                }}
              >
                View Info
              </Button>
            </div>
            <p>
              Link:{' '}
              <span
                style={{
                  color: getColors().TEXT_DEFAULT,
                  userSelect: 'text',
                  cursor: 'pointer',
                }}
              >
                <Link to={'/qr/' + liveQuiz.userFriendlyId}>Link/QR Code</Link>
              </span>
            </p>
            {isWaitingForQuizToStart(liveQuiz) ? (
              <ButtonAction onClick={handleStartQuizClick}>
                Start Quiz
              </ButtonAction>
            ) : null}
            {/* {isWaitingForRoundToStart(liveQuiz) ||
            isRoundInProgressButNotVisible(liveQuiz) ? (
              <Button
                disabled={
                  (!isRoundCompleted(liveQuiz) &&
                    liveQuiz.currentRoundNumber > 0) ||
                  liveQuiz.currentRoundNumber <= 1
                }
                color="secondary"
                style={{
                  width: '100%',
                }}
                onClick={handleBackRoundClick}
              >
                ↑ Go To Previous Round
                {!isRoundCompleted(liveQuiz) && liveQuiz.currentRoundNumber > 0
                  ? ' (Ensure submissions are locked.)'
                  : ''}
              </Button>
            ) : null} */}
            {isRoundInProgressButNotVisible(liveQuiz) ? (
              <>
                <ButtonAction color="primary" onClick={handleGradeClick}>
                  Grade Answers{' '}
                </ButtonAction>
              </>
            ) : null}
            {/* {(isWaitingForRoundToStart(liveQuiz) ||
              isRoundInProgressButNotVisible(liveQuiz)) &&
            !isQuizCompleted(liveQuiz) ? (
              <>
                <Button
                  disabled={
                    !isRoundCompleted(liveQuiz) &&
                    liveQuiz.currentRoundNumber > 0
                  }
                  color="tertiary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleStartRoundClick}
                >
                  ↓ Start Next Round{' '}
                  {!isRoundCompleted(liveQuiz) &&
                  liveQuiz.currentRoundNumber > 0
                    ? '(Ensure round is locked.)'
                    : ''}
                </Button>
              </>
            ) : null} */}
            {isRoundInProgressAndVisible(liveQuiz) ||
            isRoundCompletedAndVisible(liveQuiz) ? (
              <>
                {getCurrentRound(liveQuiz)?.notes ? (
                  <p
                    style={{
                      margin: '0',
                    }}
                  >
                    Notes: {roundNotes || 'No notes specified.'}
                  </p>
                ) : null}
                <ContentSpacer />
                <JustifyContentDiv justifyContent="left">
                  <ButtonAction
                    color="secondary"
                    onClick={handleStopRoundClick}
                  >
                    ← Stop Showing Questions
                  </ButtonAction>
                  <HSpace />
                  <ButtonAction
                    color="primary"
                    onClick={handleLockUnlockSubmissions}
                  >
                    {isRoundLocked(liveQuiz) ? (
                      <>
                        <IconButton src={'/res/unlocking.svg'} />
                        Unlock Submissions
                      </>
                    ) : (
                      <>
                        {' '}
                        <IconButton src={'/res/padlock.svg'} />
                        Lock Submissions
                      </>
                    )}
                  </ButtonAction>
                  <HSpace />
                  <ButtonAction color="primary" onClick={handleGradeClick}>
                    <IconButton src="/res/secret-book.svg" /> Grade Answers
                  </ButtonAction>
                </JustifyContentDiv>
                <ContentSpacer />
                <AdminQuestionListControls
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                  showAnswers={false}
                  revalidator={revalidator}
                />
              </>
            ) : null}
            {isRoundInProgressButNotVisible(liveQuiz) ||
            isWaitingForRoundToStart(liveQuiz) ? (
              <>
                <AdminRoundListControls
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                />
              </>
            ) : null}
            {isShowingRoundAnswers(liveQuiz) ? (
              <>
                <JustifyContentDiv justifyContent="left">
                  <ButtonAction
                    color="secondary"
                    onClick={handleStopRoundClick}
                  >
                    ← Stop Showing Answers
                  </ButtonAction>
                  <HSpace />
                  <ButtonAction
                    color="primary"
                    onClick={handleShowAnswersClick}
                    disabled={
                      liveQuiz.quizState ===
                      LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE
                    }
                  >
                    Set Answers Visible
                  </ButtonAction>
                  <HSpace />
                  <ButtonAction
                    color="primary"
                    onClick={handleUpdateScoresClick}
                  >
                    Update Scores
                  </ButtonAction>
                </JustifyContentDiv>
                <ContentSpacer />
                <AdminQuestionListControls
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                  showAnswers={true}
                  revalidator={revalidator}
                />
              </>
            ) : null}
            <ContentSpacer />
            <Button
              color="primary"
              onClick={() => {
                revalidator.revalidate();
              }}
            >
              <IconLeft verticalAdjust={-3} src="/res/recycle.svg" />
              Refresh Submissions
            </Button>
            <ContentSpacer />
            <QuizTeamsListAdmin liveQuiz={liveQuiz} />
            <SectionTitle>{'The "Be Careful" Zone!'}</SectionTitle>
            <div
              style={{
                display: 'flex',
              }}
            >
              <Button
                color="cancel"
                style={{
                  width: '50%',
                }}
                onClick={handleResetQuizClick}
              >
                Reset Quiz
              </Button>
              <Button
                color="cancel"
                style={{
                  width: '50%',
                }}
                onClick={handleHaltQuizClick}
              >
                Stop Quiz
              </Button>
            </div>
          </InnerRoot>
        </fetcher.Form>
      </MobileLayout>
      <Loading visible={isLoading}>Loading...</Loading>
      {resetConfirmDialog}
      {haltConfirmDialog}
      {adminInfoDialog}
    </>
  );
};

export const LiveQuizAdminRoute = {
  path: '/live-quiz-admin/:liveQuizId',
  element: <LiveQuizAdmin />,
  errorElement: <LiveQuizAdmin error={true} />,
  action,
  loader,
};

export const LiveQuizAdminUpdateScoresRoute = {
  path: '/live-quiz-admin/:liveQuizId/scores',
  element: <LiveQuizAdmin />,
  errorElement: <LiveQuizAdmin error={true} />,
  action: updateScoresAction,
  loader,
};

export const LiveQuizAdminDeleteTeamRoute = {
  path: '/live-quiz-admin/:liveQuizId/delete-team',
  element: <LiveQuizAdmin />,
  errorElement: <LiveQuizAdmin error={true} />,
  action: deleteTeamAction,
  loader,
};
