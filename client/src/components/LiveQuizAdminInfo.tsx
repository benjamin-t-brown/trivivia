import { isRoundCompleted, isWaitingForRoundToStart } from 'quizUtils';
import React from 'react';
import { Link } from 'react-router-dom';
import { LiveQuizResponse } from 'shared/responses';
import { getColors } from 'style';
import { getCurrentRound, quizStateToLabel, roundStateToLabel } from 'utils';

const LiveQuizAdminInfo = (props: {
  liveQuiz: LiveQuizResponse;
  expanded: boolean;
}) => {
  const { liveQuiz } = props;
  return (
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
      <span
        style={{
          display: props.expanded ? 'block' : 'none',
        }}
      >
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
              ? getColors().ERROR_TEXT
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
        <>
          Current Round:{' '}
          <span style={{ color: getColors().TEXT_DEFAULT }}>
            {liveQuiz.currentRoundNumber} ({getCurrentRound(liveQuiz)?.title})
          </span>
        </>
        <>
          <br />
          <a href={`/api/live-quiz-admin/quiz/${liveQuiz?.id}/export`}>
            Export JSON
          </a>
        </>
      </span>
    </p>
  );
};

export default LiveQuizAdminInfo;
