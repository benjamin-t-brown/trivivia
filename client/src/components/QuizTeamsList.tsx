import SectionTitle from 'elements/SectionTitle';
import React from 'react';
import { LiveQuizPublicStateResponse } from 'shared/responses';
import { getColors } from 'style';
import { getLiveQuizTeamId } from 'utils';

export const QuizTeamsList = (props: {
  quizState: LiveQuizPublicStateResponse;
}) => {
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
