import Img from 'elements/Img';
import React from 'react';
import { useFetcher } from 'react-router-dom';
import {
  LiveQuizResponse,
  QuestionTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import { getColors } from 'style';
import styled from 'styled-components';
import { QuestionCorrectAnswers } from './QuestionCorrectAnswers';
import Button from 'elements/Button';
import { isRoundLocked } from 'quizUtils';
import { formatTextWithUrls } from 'utils';

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

export const AdminQuestionControl = (props: {
  liveQuiz: LiveQuizResponse;
  currentRound: RoundTemplateResponse;
  showAnswers: boolean;
  teams: LiveQuizResponse['liveQuizTeams'];
  i: number;
  q: QuestionTemplateResponse;
  updateAction: string;
  answersVisible: boolean;
}) => {
  const { liveQuiz, currentRound, i, q, updateAction } = props;
  const fetcher = useFetcher();
  const [selectedPublicTeamId, setSelectedPublicTeamId] = React.useState('');
  const [submittedAnswers, setSubmittedAnswers] = React.useState<unknown>({});
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

  const teamAnswers = props.liveQuiz.liveQuizTeams
    .map(team => {
      const currentRoundAnswers = team.liveQuizRoundAnswers?.find(
        r => r.roundId === currentRound?.id
      );
      const thisAnswer = currentRoundAnswers?.answers?.[i + 1];
      if (thisAnswer) {
        return {
          teamName: team.teamName,
          answer: Object.values(thisAnswer).join(','),
          publicTeamId: team.publicId,
        };
      } else {
        return undefined;
      }
    })
    .filter(obj => obj !== undefined);

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
            <QuestionCorrectAnswers
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
              <>
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
                      marginRight: '8px',
                    }}
                  >
                    Hide Question
                  </Button>
                  <div>Question is Visible!</div>
                </div>
              </>
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
          {q.notes ? (
            <React.Fragment>
              <p
                style={{
                  margin: '0',
                }}
              >
                {formatTextWithUrls(q.notes)}
              </p>
            </React.Fragment>
          ) : null}
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
          {props.answersVisible
            ? teamAnswers.map(teamAnswer => {
                return (
                  <div
                    key={teamAnswer?.publicTeamId}
                    style={{
                      marginTop: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: getColors().TEXT_DESCRIPTION,
                      }}
                    >
                      {teamAnswer?.teamName}: {teamAnswer?.answer}
                    </span>
                  </div>
                );
              })
            : null}
        </>
      )}
    </Question>
  );
};
