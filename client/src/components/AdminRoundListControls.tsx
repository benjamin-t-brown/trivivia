import Button from 'elements/Button';
import { ButtonAction } from 'elements/ButtonAction';
import { HSpace } from 'elements/HSpace';
import { IconButton } from 'elements/IconButton';
import IconLeft from 'elements/IconLeft';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import SectionTitle from 'elements/SectionTitle';
import { isRoundCompleted, isRoundLocked } from 'quizUtils';
import React from 'react';
import { useFetcher } from 'react-router-dom';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
  RoundTemplateResponse,
} from 'shared/responses';
import { getColors } from 'style';
import styled from 'styled-components';
import { getRoundsFromLiveQuiz } from 'utils';

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

export const AdminRoundListControls = (props: {
  liveQuiz: LiveQuizResponse;
  updateAction: string;
}) => {
  const { liveQuiz } = props;
  const fetcher = useFetcher();

  const handleRoundQuestionsShowClick =
    (round: RoundTemplateResponse) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      const formData = new FormData();
      formData.set('quizState', LiveQuizState.STARTED_IN_ROUND);
      formData.set(
        'roundNumber',
        String(
          liveQuiz.quizTemplateJson.roundOrder.findIndex(
            id => round.id === id
          ) + 1
        )
      );
      formData.set('questionNumber', String(0));
      formData.set('roundState', LiveRoundState.STARTED_ACCEPTING_ANSWERS);
      fetcher.submit(formData, {
        method: 'post',
        action: props.updateAction,
      });
    };

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
            <JustifyContentDiv justifyContent="left">
              <ButtonAction
                color="primary"
                onClick={handleRoundQuestionsShowClick(r)}
              >
                <IconButton src={'/res/notebook.svg'} />
                Go To Questions
              </ButtonAction>
              <HSpace />
              <ButtonAction
                color="primary"
                onClick={handleRoundAnswersShowClick(r)}
              >
                <IconButton src={'/res/secret-book.svg'} />
                Go To Answers
              </ButtonAction>
            </JustifyContentDiv>
          </Round>
        );
      })}
    </div>
  );
};
