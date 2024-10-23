import SectionTitle from 'elements/SectionTitle';
import { useConfirmDialog } from 'hooks';
import { isShowingRoundQuestions } from 'quizUtils';
import React, { useState } from 'react';
import { useFetcher, useParams } from 'react-router-dom';
import { LiveQuizResponse } from 'shared/responses';
import { getColors } from 'style';
import { getRoundsFromLiveQuiz } from 'utils';

export const QuizTeamsListAdmin = (props: { liveQuiz: LiveQuizResponse }) => {
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
