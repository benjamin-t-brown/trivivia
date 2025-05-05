import Accordion, { AccordionItem } from 'elements/Accordion';
import Img from 'elements/Img';
import { areAllAnswersGradedForTeamRound } from 'gradeHelpers';
import React from 'react';
import { GradeInputState } from 'shared/requests';
import {
  ANSWER_DELIMITER,
  getRoundAnswersArrays,
  LiveQuizResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import { getColors } from 'style';
import styled from 'styled-components';
import { AdminGradeRoundAnswer } from './AdminGradeRoundAnswer';
import { GradeCertaintyState } from 'routes/LiveQuizAdminGrading';

interface AdminGradeRoundAccordionProps {
  gradeState: GradeInputState;
  certaintyState: GradeCertaintyState;
  liveQuiz: LiveQuizResponse;
  roundTemplate: RoundTemplateResponse;
  roundId: string;
  setGradeForAnswer: (args: {
    roundId: string;
    teamId: string;
    questionNumber: number;
    answerNumber: number;
    isCorrect: boolean;
  }) => void;
}

const TeamRound = styled.div<{ isGraded: boolean }>(props => {
  return {
    margin: '8px 0px',
    background: getColors().BACKGROUND2,
    borderRadius: '8px',
    padding: '8px',
    border: props.isGraded
      ? '1px solid ' + getColors().PRIMARY
      : '1px solid ' + getColors().ERROR_TEXT,
  };
});

export const AdminGradeRoundAccordion = (
  props: AdminGradeRoundAccordionProps
) => {
  const liveQuiz = props.liveQuiz;
  const subElems: AccordionItem[] = [];

  for (const teamId in liveQuiz.liveQuizTeams) {
    const team = liveQuiz.liveQuizTeams[teamId];
    const { answersArr, teamAnswersArr, orderMattersArr } =
      getRoundAnswersArrays(props.roundTemplate, team);

    const handleMarkAllIncorrectClick = () => {
      answersArr.map((correctAnswers, j) => {
        const individualAnswersCorrect = correctAnswers.split(ANSWER_DELIMITER);
        individualAnswersCorrect.map((answer, i) => {
          props.setGradeForAnswer({
            roundId: props.roundId,
            teamId: team.id,
            questionNumber: j + 1,
            answerNumber: i + 1,
            isCorrect: false,
          });
        });
      });
    };

    const isGraded = areAllAnswersGradedForTeamRound({
      state: props.gradeState,
      teamId: team.id,
      roundId: props.roundId,
      roundTemplate: props.roundTemplate,
      answersArr,
    });
    const didJoker = team.liveQuizRoundAnswers.find(
      a => a.roundId === props.roundTemplate.id
    )?.didJoker;

    const roundAnswers = team.liveQuizRoundAnswers.find(
      a => a.roundId === props.roundTemplate.id
    );

    const answersUpdatedOn = new Date(roundAnswers?.updatedOn ?? 0);
    const quizUpdatedOn = new Date(props.liveQuiz.updatedOn ?? 0);

    const hasSubmittedAfterGrading =
      isGraded && answersUpdatedOn > quizUpdatedOn;

    subElems.push({
      header: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isGraded ? (
            hasSubmittedAfterGrading ? (
              <Img
                alt="Submitted After Grading"
                src="/res/help.svg"
                draggable={false}
                style={{
                  marginRight: '16px',
                  background: getColors().WARNING_BACKGROUND,
                  width: '22px',
                }}
              />
            ) : (
              <Img
                alt="Graded"
                src="/res/check-mark.svg"
                draggable={false}
                style={{
                  marginRight: '16px',
                  background: getColors().SUCCESS_BACKGROUND,
                  width: '22px',
                }}
              />
            )
          ) : (
            <Img
              alt="Not Graded"
              src="/res/cancel.svg"
              draggable={false}
              style={{
                marginRight: '16px',
                background: getColors().ERROR_BACKGROUND,
                width: '22px',
              }}
            />
          )}
          <span>{team.teamName}</span>
        </div>
      ),
      item: (
        <TeamRound key={`round${props.roundId}-${team.id}`} isGraded={isGraded}>
          <div
            style={{
              borderBottom: '1px solid ' + getColors().TEXT_DESCRIPTION,
            }}
          >
            Team:{' '}
            <span
              style={{
                color: getColors().PRIMARY_TEXT,
              }}
            >
              {team.teamName}
            </span>
            {didJoker ? (
              <div>
                <span
                  style={{
                    color: getColors().SUCCESS_TEXT,
                    cursor: 'pointer',
                    fontSize: '12px',
                    userSelect: 'none',
                    lineHeight: '24px',
                  }}
                >
                  Joker was used!
                </span>
              </div>
            ) : null}
            <div
              style={{
                marginBottom: '8px',
              }}
            >
              <span
                onClick={handleMarkAllIncorrectClick}
                style={{
                  color: getColors().TEXT_DESCRIPTION,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '12px',
                  userSelect: 'none',
                  lineHeight: '24px',
                }}
              >
                Mark All Incorrect
              </span>
            </div>
          </div>
          {answersArr.map((correctAnswers, j) => {
            const questionId = props.roundTemplate.questionOrder[j];
            const questionTemplate = props.roundTemplate.questions?.find(
              q => q.id === questionId
            );
            const submittedAnswers = teamAnswersArr[j];
            return (
              <div key={team.id + '-' + j}>
                <AdminGradeRoundAnswer
                  questionNumber={j + 1}
                  correctAnswers={correctAnswers}
                  teamAnswers={submittedAnswers}
                  orderMatters={orderMattersArr[j]}
                  setGradeForAnswer={props.setGradeForAnswer}
                  team={team}
                  roundId={props.roundId}
                  questionTemplate={questionTemplate}
                  state={props.gradeState}
                  certaintyState={props.certaintyState}
                />
              </div>
            );
          })}
        </TeamRound>
      ),
    });
  }

  return <Accordion items={subElems} />;
};
