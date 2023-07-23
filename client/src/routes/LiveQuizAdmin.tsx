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
import { CorrectAnswers } from './LiveQuiz';
import Img from 'elements/Img';

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

const Round = styled.div<{ isActive: boolean }>(props => {
  return {
    padding: '16px',
    backgroundColor: getColors().BACKGROUND,
    boxSizing: 'border-box',
    border:
      '1px solid ' +
      (props.isActive ? getColors().PRIMARY_TEXT : getColors().BACKGROUND2),
    margin: '4px 0px',
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

const QuestionSection = (props: {
  liveQuiz: LiveQuizResponse;
  currentRound: RoundTemplateResponse;
  showAnswers: boolean;
  i: number;
  q: QuestionTemplateResponse;
  updateAction: string;
}) => {
  const { liveQuiz, currentRound, i, q, updateAction } = props;
  const fetcher = useFetcher();
  const [selectedPublicTeamId, setSelectedPublicTeamId] = React.useState('');
  const stats = props.liveQuiz.stats?.[currentRound.id]?.[i + 1] ?? {};
  const bonusCorrectPublicTeamIds =
    (stats?.publicTeamIdsCorrect as string[]) ?? [];

  const handleShowQuestionClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set(
      'questionNumber',
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
      'questionNumber',
      String((liveQuiz?.currentQuestionNumber ?? 1) - 1)
    );
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleRandomizeTeamIdClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    setSelectedPublicTeamId(
      bonusCorrectPublicTeamIds[
        Math.floor(Math.random() * bonusCorrectPublicTeamIds.length)
      ] ?? ''
    );
  };

  return (
    <Question key={q.id} selected={i === liveQuiz.currentQuestionNumber}>
      {props.showAnswers ? (
        <>
          {i + 1}.{' '}
          {q.text.split('\n').map((line, i) => {
            return (
              <React.Fragment key={i}>
                <span key={i} dangerouslySetInnerHTML={{ __html: line }}></span>
                <br />
              </React.Fragment>
            );
          })}
          {q.imageLink ? (
            <Img
              style={{
                width: '100%',
              }}
              src={q.imageLink}
              alt="Question"
            />
          ) : null}
          <div
            style={{
              marginTop: '8px',
            }}
          >
            <CorrectAnswers
              key="answer"
              correctAnswers={
                Object.keys(q.answers ?? {})
                  .filter(key => key.includes('answer'))
                  .sort()
                  .map(i => q.answers?.[i]) ?? []
              }
              answersStats={stats}
              numTeams={props.liveQuiz.liveQuizTeams.length}
            />
            {q.isBonus ? (
              <div
                style={{
                  margin: '8px 0px',
                  padding: '8px',
                  paddingTop: '0px',
                  border: '1px solid ' + getColors().TEXT_DESCRIPTION,
                }}
              >
                <div
                  style={{
                    color: getColors().TEXT_DESCRIPTION,
                    marginTop: '16px',
                  }}
                >
                  Teams Who Got Bonus:
                  <br />
                  <br />
                </div>
                <div>
                  {bonusCorrectPublicTeamIds.map(publicTeamId => {
                    return (
                      <div
                        key={publicTeamId}
                        style={{
                          color:
                            publicTeamId === selectedPublicTeamId
                              ? getColors().PRIMARY_TEXT
                              : getColors().TEXT_DEFAULT,
                          textDecoration:
                            publicTeamId === selectedPublicTeamId
                              ? 'underline'
                              : 'none',
                        }}
                      >
                        {
                          props.liveQuiz.liveQuizTeams.find(
                            t => t.publicId === publicTeamId
                          )?.teamName
                        }
                      </div>
                    );
                  })}
                  <Button
                    color="primary"
                    onClick={handleRandomizeTeamIdClick}
                    style={{
                      marginTop: '24px',
                    }}
                  >
                    Pick Random
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
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
                  marginBottom: '8px',
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
                <div>Question is Visible!</div>
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
          {i + 1}.{' '}
          {q.text.split('\n').map((line, i) => {
            return (
              <React.Fragment key={i}>
                <span key={i} dangerouslySetInnerHTML={{ __html: line }}></span>
                <br />
              </React.Fragment>
            );
          })}
          {q.imageLink ? (
            q.imageLink.includes('<iframe ') ? (
              <div dangerouslySetInnerHTML={{ __html: q.imageLink }}></div>
            ) : (
              <Img
                style={{
                  width: '100%',
                }}
                src={q.imageLink}
                alt="Question"
              />
            )
          ) : null}
        </>
      )}
    </Question>
  );
};

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

const AdminQuestionList = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
  showAnswers: boolean;
}) => {
  const { liveQuiz, updateAction } = props;
  const fetcher = useFetcher();

  const handleShowAllClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('questionNumber', String(currentRound.questionOrder.length));
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const handleHideAllClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.set('questionNumber', String(0));
    fetcher.submit(formData, {
      method: 'post',
      action: updateAction,
    });
  };

  const currentRound =
    getRoundsFromLiveQuiz(liveQuiz)[
      isShowingRoundAnswers(liveQuiz)
        ? liveQuiz.currentRoundAnswerNumber - 1
        : liveQuiz.currentRoundNumber - 1
    ];

  return (
    <div>
      <SectionTitle>Round Visibility</SectionTitle>
      <div
        style={{
          color: getColors().TEXT_DESCRIPTION,
        }}
      >
        {props.showAnswers ? (
          <>{"You can read out and show this round's answers from here."}</>
        ) : (
          <>
            Players are able to see what is in the highlighted box below: <br />
            <br />
            They can see the round description and each question as you show
            them.
          </>
        )}
      </div>
      <ContentSpacer />
      <div
        style={{
          border:
            '1px solid ' +
            (props.showAnswers &&
            liveQuiz.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN
              ? getColors().PRIMARY_TEXT
              : getColors().SUCCESS_TEXT),
          padding: '8px',
        }}
      >
        <div
          style={{
            color: getColors().TEXT_DEFAULT,
          }}
        >
          {currentRound?.title}
          <br />
          <br />
          {currentRound?.description}
          <div
            style={{
              display: isShowingRoundAnswers(liveQuiz) ? 'none' : 'block',
            }}
          >
            <br />
            <Button
              color="secondary"
              onClick={handleShowAllClick}
              style={{
                marginRight: '8px',
              }}
            >
              Show All
            </Button>
            <Button color="secondary" onClick={handleHideAllClick}>
              Hide All
            </Button>
          </div>
        </div>
        <ContentSpacer />
        {getQuestionsFromRoundInLiveQuiz(
          liveQuiz,
          isShowingRoundAnswers(liveQuiz)
            ? liveQuiz.currentRoundAnswerNumber - 1
            : liveQuiz.currentRoundNumber - 1
        ).map((q, i) => {
          return (
            <QuestionSection
              key={q.id}
              liveQuiz={props.liveQuiz}
              q={q}
              i={i}
              currentRound={currentRound}
              showAnswers={props.showAnswers}
              updateAction={updateAction}
            />
          );
        })}
      </div>
    </div>
  );
};

const AdminRoundList = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
}) => {
  const { liveQuiz } = props;
  const fetcher = useFetcher();

  const handleRoundAnswersShowClick =
    (round: RoundTemplateResponse) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      const formData = new FormData();
      formData.set('quizState', LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN);
      formData.set(
        'roundAnswerNumber',
        String(
          props.liveQuiz.quizTemplateJson.roundOrder.findIndex(
            id => round.id === id
          ) + 1
        )
      );
      fetcher.submit(formData, {
        method: 'post',
        action: props.updateAction,
      });
    };

  return (
    <div>
      <SectionTitle>Rounds Overview</SectionTitle>
      {getRoundsFromLiveQuiz(liveQuiz).map((r, i) => {
        return (
          <Round key={r.id} isActive={i + 1 === liveQuiz.currentRoundNumber}>
            <div>
              {i + 1}. {r.title}
            </div>
            <div
              style={{
                marginTop: '8px',
              }}
            >
              <Button
                color="primary"
                onClick={handleRoundAnswersShowClick(r)}
                disabled={
                  !isRoundCompleted(props.liveQuiz) ||
                  i >= props.liveQuiz.currentRoundNumber
                }
              >
                Go To Show Answers
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

  const lockRoundDisabled = false;

  return (
    <div>
      <Button
        flex
        color="primary"
        onClick={handleToggleLockRoundClick(isRoundLocked(liveQuiz))}
        disabled={lockRoundDisabled}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isRoundLocked(liveQuiz) ? (
          <>
            <IconLeft
              src={'/res/unlocking.svg'}
              style={{
                marginLeft: '0px',
              }}
            />
            Unlock Round
          </>
        ) : (
          <>
            {' '}
            <IconLeft
              src={'/res/padlock.svg'}
              style={{
                marginLeft: '0px',
              }}
            />
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
      <div
        style={{
          background: getColors().BACKGROUND2,
          padding: '16px',
          borderRadius: '4px',
        }}
      >
        {props.liveQuiz.liveQuizTeams
          .sort((a, b) => (a.currentScore > b.currentScore ? -1 : 1))
          .map((team, i) => {
            const currentRound = getRoundsFromLiveQuiz(props.liveQuiz)[
              props.liveQuiz.currentRoundNumber - 1
            ];
            const currentRoundAnswers = team.liveQuizRoundAnswers?.find(
              r => r.roundId === currentRound?.id
            );
            const hasSubmitted =
              Object.keys(currentRoundAnswers?.answers ?? {}).length > 0;

            return (
              <div
                key={team.id}
                style={{
                  borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
                  borderRadius: '4px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    onClick={handleDeleteTeamClick(team.id)}
                    style={{
                      color: getColors().ERROR_TEXT,
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    X
                  </span>{' '}
                  <span
                    style={{
                      marginRight: '8px',
                    }}
                  >
                    {i + 1}. {team.teamName}
                  </span>
                  {isShowingRoundQuestions(props.liveQuiz) ? (
                    <span
                      style={{
                        color: hasSubmitted
                          ? getColors().SUCCESS_TEXT
                          : getColors().ERROR_TEXT,
                      }}
                    >
                      {hasSubmitted ? ' Submitted' : ' Not Submitted'}
                    </span>
                  ) : null}
                </div>
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
        {props.liveQuiz.liveQuizTeams.length === 0 ? (
          <div style={{ color: getColors().ERROR_TEXT }}>No teams yet!</div>
        ) : null}
      </div>
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
  const navigate = useNavigate();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const render = useReRender();
  const formId = 'edit-live-quiz-form';
  const updateAction = '/live-quiz-admin/' + params.liveQuizId;
  const revalidator = useRevalidator();

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     revalidator.revalidate();
  //   }, 20000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

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
              Link:{' '}
              <span
                style={{
                  color: getColors().TEXT_DEFAULT,
                  userSelect: 'text',
                  cursor: 'pointer',
                }}
              >
                <Link to={'/qr/' + liveQuiz.userFriendlyId}>QR Code</Link>
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
            {isWaitingForRoundToStart(liveQuiz) ||
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
                  ? ' (Ensure current round is locked.)'
                  : ''}
              </Button>
            ) : null}
            {isRoundInProgressButNotVisible(liveQuiz) ? (
              <>
                <Button
                  color="secondary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleResumeRoundClick}
                >
                  Resume Showing Round
                </Button>
                <ContentSpacer />
                <Button
                  disabled={!isRoundLocked(liveQuiz)}
                  color="primary"
                  onClick={handleGradeClick}
                >
                  Grade Answers
                </Button>
              </>
            ) : null}
            {(isWaitingForRoundToStart(liveQuiz) ||
              isRoundInProgressButNotVisible(liveQuiz)) &&
            !isQuizCompleted(liveQuiz) ? (
              <>
                <Button
                  disabled={
                    !isRoundCompleted(liveQuiz) &&
                    liveQuiz.currentRoundNumber > 0
                  }
                  color="primary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleStartRoundClick}
                >
                  ↓ Begin Next Round{' '}
                  {!isRoundCompleted(liveQuiz) &&
                  liveQuiz.currentRoundNumber > 0
                    ? '(Ensure current round is locked.)'
                    : ''}
                </Button>
              </>
            ) : null}
            {isRoundInProgressAndVisible(liveQuiz) ||
            isRoundCompletedAndVisible(liveQuiz) ? (
              <>
                {getCurrentRound(liveQuiz)?.notes ? (
                  <p
                    style={{
                      margin: '0',
                    }}
                  >
                    {formatTextWithUrls(getCurrentRound(liveQuiz)?.notes)}
                  </p>
                ) : null}
                <ContentSpacer />
                <Button
                  color="secondary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleStopRoundClick}
                >
                  ✔ Complete Round
                </Button>
                <ContentSpacer />
                <AdminRoundSubmissionControlsButtons
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                />
                <Button
                  disabled={!isRoundLocked(liveQuiz)}
                  color="primary"
                  onClick={handleGradeClick}
                >
                  Grade Answers{' '}
                  {!isRoundLocked(liveQuiz) ? '(Ensure round is locked.)' : ''}
                </Button>
                <AdminQuestionList
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                  showAnswers={false}
                />
              </>
            ) : null}
            {isRoundInProgressButNotVisible(liveQuiz) ||
            isWaitingForRoundToStart(liveQuiz) ? (
              <>
                <AdminRoundList
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                />
              </>
            ) : null}
            {isShowingRoundAnswers(liveQuiz) ? (
              <>
                <Button
                  color="secondary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleStopRoundClick}
                >
                  Go Back To Rounds
                </Button>
                <Button
                  color="primary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleShowAnswersClick}
                  disabled={
                    liveQuiz.quizState ===
                    LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE
                  }
                >
                  Show Answers
                </Button>
                <Button
                  color="primary"
                  style={{
                    width: '100%',
                  }}
                  onClick={handleUpdateScoresClick}
                >
                  Update Scores To This Round
                </Button>
                <ContentSpacer />
                <AdminQuestionList
                  liveQuiz={liveQuiz}
                  updateAction={updateAction}
                  showAnswers={true}
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
              Refresh
            </Button>
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
