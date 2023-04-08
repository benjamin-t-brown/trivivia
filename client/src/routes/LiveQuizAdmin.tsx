import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React, { useState } from 'react';
import {
  Link,
  json,
  redirect,
  useFetcher,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import styled from 'styled-components';
import { getColors } from 'style';
import {
  throwValidationError,
  useConfirmDialog,
  useReRender,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
  RoundTemplateResponse,
} from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import {
  getCurrentRound,
  getQuestionsFromRoundInLiveQuiz,
  getRoundsFromLiveQuiz,
  quizStateToLabel,
  roundStateToLabel,
} from 'utils';
import SectionTitle from 'elements/SectionTitle';
import IconLeft from 'elements/IconLeft';
import {
  isRoundCompleted,
  isRoundCompletedAndVisible,
  isRoundInProgressAndVisible,
  isRoundInProgressButNotVisible,
  isRoundLocked,
  isWaitingForQuizToStart,
  isWaitingForRoundToStart,
} from 'quizUtils';

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

const Round = styled.div<Object>(() => {
  return {
    padding: '16px',
    backgroundColor: getColors().BACKGROUND,
    boxSizing: 'border-box',
    border: '1px solid ' + getColors().BACKGROUND2,
    margin: '4px 0px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
});

const Question = styled.div<{ selected: boolean }>(props => {
  return {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: getColors().BACKGROUND2,
    margin: '4px 0px',
    boxSizing: 'border-box',
    border: props.selected
      ? '1px solid ' + getColors().PRIMARY
      : getColors().BACKGROUND2,
  };
});

interface UpdateQuizValues {
  roundIndex?: number | string;
  questionIndex?: number | string;
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

  if (values.roundIndex) {
    values.roundIndex = parseInt(values.roundIndex as string);
  }
  if (values.questionIndex) {
    values.questionIndex = parseInt(values.questionIndex as string);
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

const loader = async ({ params }) => {
  const quizTemplatesResponse = await fetchAsync<LiveQuizResponse>(
    'get',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId
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

const AdminQuestionList = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
}) => {
  const { liveQuiz, updateAction } = props;
  const fetcher = useFetcher();

  const handleShowQuestionClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'questionIndex',
      String((liveQuiz?.currentQuestionNumber ?? 0) + 1)
    );
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleHideQuestionClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'questionIndex',
      String((liveQuiz?.currentQuestionNumber ?? 1) - 1)
    );
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  return (
    <div>
      <SectionTitle>Round Visibility</SectionTitle>
      <div
        style={{
          color: getColors().TEXT_DESCRIPTION,
        }}
      >
        Players are able to see what is in the highlighted box below: <br />
        <br />
        They can see the round description and each question as you show them.
      </div>
      <ContentSpacer />
      <div
        style={{
          border: '1px solid ' + getColors().SUCCESS_TEXT,
          padding: '8px',
        }}
      >
        <div
          style={{
            color: getColors().TEXT_DEFAULT,
          }}
        >
          Description:
          <br />
          <br />
          {getCurrentRound(liveQuiz)?.description}
        </div>
        <ContentSpacer />
        {getQuestionsFromRoundInLiveQuiz(
          liveQuiz,
          liveQuiz.currentRoundNumber - 1
        ).map((q, i) => {
          return (
            <Question
              key={q.id}
              selected={i === liveQuiz.currentQuestionNumber}
            >
              <div
                style={{
                  margin: '16px 0px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {i === liveQuiz.currentQuestionNumber ? (
                  <Button
                    color="primary"
                    onClick={handleShowQuestionClick}
                    disabled={isRoundLocked(liveQuiz)}
                  >
                    Show Question
                  </Button>
                ) : null}
                {i < liveQuiz.currentQuestionNumber ? (
                  <div
                    style={{
                      color: getColors().SUCCESS_TEXT,
                    }}
                  >
                    <Button
                      color="cancel"
                      onClick={handleHideQuestionClick}
                      disabled={
                        i < liveQuiz.currentQuestionNumber - 1 ||
                        isRoundLocked(liveQuiz)
                      }
                      style={{
                        marginRight: '16px',
                      }}
                    >
                      Hide Question
                    </Button>
                    Question is Visible!
                  </div>
                ) : null}
                {i > liveQuiz.currentQuestionNumber ? (
                  <div
                    style={{
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    Waiting to show...
                  </div>
                ) : null}
              </div>
              {i + 1}. {q.text}
            </Question>
          );
        })}
      </div>
    </div>
  );
};

const AdminRoundList = (props: { liveQuiz: LiveQuizResponse }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { liveQuiz } = props;

  const handleGradeRoundClick =
    (r: RoundTemplateResponse) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      navigate(
        '/live-quiz-admin/' + params.liveQuizId + '/grade?roundId=' + r.id
      );
    };

  return (
    <div>
      <SectionTitle>Round Overview</SectionTitle>
      {getRoundsFromLiveQuiz(liveQuiz).map((r, i) => {
        return (
          <Round key={r.id}>
            <div>
              {i + 1}. {r.title}
            </div>
            <div>
              <Button
                color="primary"
                disabled={liveQuiz.currentRoundNumber <= i}
                onClick={handleGradeRoundClick(r)}
              >
                Grade Round
              </Button>
            </div>
          </Round>
        );
      })}
    </div>
  );
};

const AdminRoundSubmissionControlsButtons = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
}) => {
  const fetcher = useFetcher();
  const { liveQuiz, updateAction } = props;

  const handleToggleLockRoundClick =
    (isCurrentlyLocked: boolean) => (ev: React.MouseEvent) => {
      ev.preventDefault();
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

  const lockRoundDisabled =
    liveQuiz.currentQuestionNumber <
    getQuestionsFromRoundInLiveQuiz(liveQuiz, liveQuiz.currentRoundNumber - 1)
      ?.length;

  return (
    <div>
      <Button
        flex
        color="primary"
        onClick={handleToggleLockRoundClick(isRoundLocked(liveQuiz))}
        disabled={lockRoundDisabled}
        style={{
          width: '100%',
        }}
      >
        {isRoundLocked(liveQuiz) ? (
          <>
            <IconLeft src={'/res/unlocking.svg'} />
            Unlock Round
          </>
        ) : (
          <>
            {' '}
            <IconLeft src={'/res/padlock.svg'} />
            Lock Round {lockRoundDisabled ? '(Show all questions to lock)' : ''}
          </>
        )}
      </Button>
    </div>
  );
};

const AdminQuizTeamsList = (props: { liveQuiz: LiveQuizResponse }) => {
  const fetcher = useFetcher();
  const params = useParams();
  const [teamIdToDelete, setTeamIdToDelete] = useState('');

  const { setOpen, confirmDialog } = useConfirmDialog({
    title: 'Confirm Reset',
    body: () => {
      return (
        <div>
          Are you sure you wish to delete the team{' '}
          <span
            style={{
              color: getColors().ERROR_TEXT,
            }}
          >
            {
              props.liveQuiz.liveQuizTeams.find(t => t.id === teamIdToDelete)
                ?.teamName
            }
          </span>
          ? The action cannot be undone.
        </div>
      );
    },
    onConfirm: () => {
      const formData = new FormData();
      formData.set('teamId', teamIdToDelete);
      fetcher.submit(formData, {
        method: 'delete',
        action: `/live-quiz-admin/${params.liveQuizId}/delete-team`,
      });
    },
  });

  const handleDeleteTeamClick = (teamId: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setTeamIdToDelete(teamId);
    setOpen(true);
  };

  return (
    <div>
      <SectionTitle>Teams</SectionTitle>
      {/* <fetcher.Form> */}
      <div
        style={{
          background: getColors().BACKGROUND2,
          padding: '16px',
          borderRadius: '4px',
        }}
      >
        {props.liveQuiz.liveQuizTeams.map((team, i) => {
          return (
            <div
              key={team.id}
              style={{
                borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
                borderRadius: '4px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                onClick={handleDeleteTeamClick(team.id)}
                style={{
                  color: getColors().ERROR_TEXT,
                  cursor: 'pointer',
                  marginRight: '8px',
                }}
              >
                X
              </div>{' '}
              {i + 1}. {team.teamName}
            </div>
          );
        })}
        {props.liveQuiz.liveQuizTeams.length === 0 ? (
          <div style={{ color: getColors().ERROR_TEXT }}>No teams yet!</div>
        ) : null}
      </div>
      {/* </fetcher.Form> */}
      {confirmDialog}
    </div>
  );
};

interface EditLiveQuizProps {
  error?: boolean;
}
const LiveQuizAdmin = (props: EditLiveQuizProps) => {
  const params = useParams();
  const fetcher = useFetcher();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const render = useReRender();
  const formId = 'edit-live-quiz-form';
  const updateAction = '/live-quiz-admin/' + params.liveQuizId;

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

  const handleStopRoundClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('quizState', LiveQuizState.STARTED_WAITING);
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
    // render();
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
    formData.set('roundIndex', String((liveQuiz?.currentRoundNumber ?? 0) + 1));
    formData.set('questionIndex', String(0));
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
    // formData.set('roundState', LiveRoundState.STARTED_ACCEPTING_ANSWERS);
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

  return (
    <>
      <DefaultTopBar useBackConfirm={false} upTo={'/live-quizzes'} />
      <MobileLayout topBar>
        <fetcher.Form method="post" id={formId}>
          <InnerRoot>
            <p
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
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
              <br />
              Quiz Template:{' '}
              <Link
                style={{ color: getColors().TEXT_DEFAULT }}
                to={`/quiz-template/${liveQuiz.quizTemplateJson.id}/round-templates`}
              >
                {liveQuiz.quizTemplateJson.name}
              </Link>
              <br />
              Status:{' '}
              <span style={{ color: getColors().TEXT_DEFAULT }}>
                {quizStateToLabel(liveQuiz.quizState ?? '')}
              </span>
              <br />
              Round Status:{' '}
              <span
                style={{
                  color: isRoundCompleted(liveQuiz)
                    ? getColors().SUCCESS_TEXT
                    : getColors().TEXT_DEFAULT,
                }}
              >
                {roundStateToLabel(liveQuiz.roundState ?? '')}
              </span>
              <br />
              {isWaitingForRoundToStart(liveQuiz) ? (
                <>
                  Next Round:{' '}
                  <span style={{ color: getColors().TEXT_DEFAULT }}>
                    {liveQuiz.currentRoundNumber + 1}
                  </span>
                </>
              ) : null}
              {isRoundInProgressButNotVisible(liveQuiz) ||
              isRoundInProgressAndVisible(liveQuiz) ? (
                <>
                  Current Round:{' '}
                  <span style={{ color: getColors().TEXT_DEFAULT }}>
                    {liveQuiz.currentRoundNumber} (
                    {getCurrentRound(liveQuiz)?.title})
                  </span>
                </>
              ) : null}
            </p>
            <ContentSpacer />
            {isWaitingForQuizToStart(liveQuiz) ? (
              <Button
                color="primary"
                style={{
                  width: '100%',
                }}
                onClick={handleStartQuizClick}
              >
                Start Quiz
              </Button>
            ) : null}
            {isRoundInProgressButNotVisible(liveQuiz) ? (
              <Button
                color="secondary"
                style={{
                  width: '100%',
                }}
                onClick={handleResumeRoundClick}
              >
                Resume Showing Round
              </Button>
            ) : null}
            {isWaitingForRoundToStart(liveQuiz) ||
            isRoundInProgressButNotVisible(liveQuiz) ? (
              <Button
                disabled={
                  !isRoundCompleted(liveQuiz) && liveQuiz.currentRoundNumber > 0
                }
                color="primary"
                style={{
                  width: '100%',
                }}
                onClick={handleStartRoundClick}
              >
                Begin Next Round{' '}
                {!isRoundCompleted(liveQuiz) && liveQuiz.currentRoundNumber > 0
                  ? '(Ensure current round is locked.)'
                  : ''}
              </Button>
            ) : null}
            {isRoundInProgressAndVisible(liveQuiz) ||
            isRoundCompletedAndVisible(liveQuiz) ? (
              <>
                <Button
                  color="secondary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleStopRoundClick}
                >
                  Stop Showing Round
                </Button>
                <ContentSpacer />
                <AdminQuestionList
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                />
                <ContentSpacer />
                <AdminRoundSubmissionControlsButtons
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                />
              </>
            ) : null}
            {isRoundInProgressButNotVisible(liveQuiz) ? (
              <AdminRoundList liveQuiz={liveQuiz} />
            ) : null}
            <ContentSpacer />
            <AdminQuizTeamsList liveQuiz={liveQuiz} />
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

export const LiveQuizAdminDeleteTeamRoute = {
  path: '/live-quiz-admin/:liveQuizId/delete-team',
  element: <LiveQuizAdmin />,
  errorElement: <LiveQuizAdmin error={true} />,
  action: deleteTeamAction,
  loader,
};
