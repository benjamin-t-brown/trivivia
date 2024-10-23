import Button from 'elements/Button';
import { HSpace } from 'elements/HSpace';
import SectionTitle from 'elements/SectionTitle';
import { VSpace } from 'elements/VSpace';
import { isRoundLocked, isShowingRoundAnswers } from 'quizUtils';
import React, { useState } from 'react';
import { useFetcher, useRevalidator } from 'react-router-dom';
import { LiveQuizResponse, LiveQuizState } from 'shared/responses';
import { getColors } from 'style';
import { getQuestionsFromRoundInLiveQuiz, getRoundsFromLiveQuiz } from 'utils';
import { AdminQuestionControl } from './AdminQuestionControl';

export const AdminQuestionListControls = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
  showAnswers: boolean;
  revalidator: ReturnType<typeof useRevalidator>;
}) => {
  const { liveQuiz, updateAction } = props;
  const fetcher = useFetcher();
  const [answersVisible, setAnswersVisible] = useState(false);

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
            Control quiz visibility in the highlighted box below. <br />
            <br />
            Players can see the round title, description, and each question as
            you show them.
          </>
        )}
      </div>
      <VSpace />
      <div
        style={{
          border:
            '1px solid ' +
            (props.showAnswers &&
            liveQuiz.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN
              ? getColors().PRIMARY_TEXT
              : isRoundLocked(liveQuiz)
              ? getColors().ERROR_TEXT
              : getColors().SUCCESS_TEXT),
          padding: '8px',
        }}
      >
        <div
          style={{
            color: getColors().TEXT_DEFAULT,
          }}
        >
          <span
            style={{
              color: getColors().TEXT_DESCRIPTION,
            }}
          >
            {' '}
            Round Title:{' '}
          </span>
          {currentRound?.title}
          <br />
          <br />
          <span
            style={{
              color: getColors().TEXT_DESCRIPTION,
            }}
          >
            {' '}
            Round Description:
          </span>{' '}
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
                textDecoration: 'underline',
              }}
            >
              Show All
            </Button>
            <Button
              style={{
                marginRight: '8px',
                textDecoration: 'underline',
              }}
              color="secondary"
              onClick={handleHideAllClick}
            >
              Hide All
            </Button>
            <HSpace />
            <Button
              color="plain"
              onClick={() => {
                const nextAnswersVisible = !answersVisible;
                setAnswersVisible(nextAnswersVisible);
                if (nextAnswersVisible) {
                  props.revalidator.revalidate();
                }
              }}
              // disabled={isRoundLocked(liveQuiz)}
              style={{
                filter: 'grayscale(1)',
                textDecoration: 'underline',
              }}
            >
              {answersVisible ? 'Hide' : 'View'} Submissions
            </Button>
          </div>
        </div>
        <VSpace />
        {getQuestionsFromRoundInLiveQuiz(
          liveQuiz,
          isShowingRoundAnswers(liveQuiz)
            ? liveQuiz.currentRoundAnswerNumber - 1
            : liveQuiz.currentRoundNumber - 1
        ).map((q, i) => {
          return (
            <AdminQuestionControl
              key={q.id}
              liveQuiz={props.liveQuiz}
              q={q}
              i={i}
              teams={props.liveQuiz.liveQuizTeams}
              currentRound={currentRound}
              showAnswers={props.showAnswers}
              updateAction={updateAction}
              answersVisible={answersVisible}
            />
          );
        })}
      </div>
    </div>
  );
};
