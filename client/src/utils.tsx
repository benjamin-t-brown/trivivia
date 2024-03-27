import React from 'react';
import {
  ANSWER_DELIMITER,
  AnswerState,
  LiveQuizResponse,
  LiveQuizState,
  LiveQuizTeamResponse,
  LiveRoundState,
  QuestionTemplateResponse,
  RoundTemplateResponse,
  getNumAnswers,
  getNumCorrectAnswers,
} from 'shared/responses';

export const quizStateToLabel = (quizState: string) => {
  switch (quizState) {
    case LiveQuizState.COMPLETED:
      return 'Completed';
    case LiveQuizState.NOT_STARTED:
      return 'Not Started';
    case LiveQuizState.STARTED_WAITING:
      return 'Waiting';
    case LiveQuizState.STARTED_IN_ROUND:
      return 'In Round';
    case LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN:
      return 'Answers Hidden';
    case LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE:
      return 'Answers Visible';
    case LiveQuizState.HALTED:
      return 'Halted';
  }

  return '';
};

export const roundStateToLabel = (roundState: string) => {
  switch (roundState) {
    case LiveRoundState.NOT_STARTED:
      return 'Not Started';
    case LiveRoundState.STARTED_ACCEPTING_ANSWERS:
      return 'Accepting Answers';
    case LiveRoundState.STARTED_NOT_ACCEPTING_ANSWERS:
      return 'Not Accepting Answers';
    case LiveRoundState.COMPLETED:
      return 'Locked';
    case LiveRoundState.HALTED:
      return 'Halted';
  }

  return '';
};

export const getRoundsFromLiveQuiz = (liveQuiz: LiveQuizResponse) => {
  return (
    (liveQuiz.quizTemplateJson.roundOrder
      ?.map(id => liveQuiz.quizTemplateJson.rounds?.find(r => r.id === id))
      .filter(t => t) as RoundTemplateResponse[]) ?? []
  );
};

export const getQuestionsFromRoundInLiveQuiz = (
  liveQuiz: LiveQuizResponse,
  roundIndex: number
) => {
  const round = liveQuiz.quizTemplateJson.rounds?.find(
    t => t.id === liveQuiz.quizTemplateJson.roundOrder[roundIndex]
  );
  return (
    (round?.questionOrder
      ?.map(id => round?.questions?.find(q => q.id === id))
      .filter(t => t) as QuestionTemplateResponse[]) ?? []
  );
};

export const getCurrentRound = (liveQuiz: LiveQuizResponse) => {
  const roundId =
    liveQuiz.quizTemplateJson.roundOrder[liveQuiz.currentRoundNumber - 1] ?? '';
  return liveQuiz.quizTemplateJson.rounds?.find(r => r.id === roundId);
};

export const setLiveQuizTeamId = (teamId: string) => {
  localStorage.setItem('trivivia-liveTeamId', teamId);
};

export const getLiveQuizTeamId = () => {
  return localStorage.getItem('trivivia-liveTeamId');
};

export const setLiveQuizSpectateId = (spectateId: string) => {
  localStorage.setItem('trivivia-liveSpectateId', spectateId);
};

export const getLiveQuizSpectateId = () => {
  return localStorage.getItem('trivivia-liveSpectateId') ?? '';
};

export const setLiveQuizJoinedId = (quizId: string) => {
  localStorage.setItem('trivivia-liveQuizId', quizId);
};

export const getLiveQuizJoinedId = () => {
  return localStorage.getItem('trivivia-liveQuizId');
};

export const setLiveQuizJoinedDate = (date: Date) => {
  localStorage.setItem('trivivia-liveJoinedDate', date.toISOString());
};

let noRedirect = false;
export const setNoRedirect = (_noRedirect: boolean) => {
  noRedirect = _noRedirect;
};
export const getIsNoRedirect = () => {
  return noRedirect;
};

export const getLiveQuizJoinedDate = () => {
  const dateStr = localStorage.getItem('trivivia-liveJoinedDate');
  if (dateStr) {
    return new Date(dateStr);
  }
  return new Date(0);
};

export const setLiveQuizAnswersLs = (
  roundNum: number,
  savedAnswers: Record<string, AnswerState> | undefined
) => {
  if (savedAnswers) {
    localStorage.setItem(
      'trivivia-savedAnswers-' + roundNum,
      JSON.stringify(savedAnswers)
    );
  } else {
    localStorage.removeItem('trivivia-savedAnswers-' + roundNum);
  }
  (window as any).savedAnswers = savedAnswers;
};

export const getLiveQuizAnswersLs = (
  roundNum: number
): Record<string, AnswerState> | undefined => {
  try {
    return JSON.parse(
      localStorage.getItem('trivivia-savedAnswers-' + roundNum) as string
    );
  } catch (e) {
    return undefined;
  }
};

interface SettingsArgs {
  lightMode: boolean;
}

export const saveSettingsToLs = (settings: SettingsArgs) => {
  localStorage.setItem('trivivia-settings', JSON.stringify(settings));
};

export const getSettingsFromLs = (): SettingsArgs => {
  const defaultSettings = {
    lightMode: false,
  };
  try {
    return (
      JSON.parse(localStorage.getItem('trivivia-settings') as string) ||
      defaultSettings
    );
  } catch (e) {
    return defaultSettings;
  }
};

export const getQuestionAnswerString = (
  questionTemplate: QuestionTemplateResponse
) => {
  const numAnswers = getNumAnswers(questionTemplate.answerType);

  const qArr: string[] = [];
  for (let k = 0; k < numAnswers; k++) {
    const key = 'answer' + (k + 1);
    const answers = questionTemplate.answers[key];
    qArr.push(answers);
  }

  return qArr.join(ANSWER_DELIMITER);
};

export const isUrl = (str: string) => {
  return Boolean(
    str.match(/([\w+]+:\/\/)?([\w\d-]+\.)*[\w-]+[.:]\w+([/?=&#.]?[\w-]+)*\/?/)
  );
};

export const formatTextWithUrls = (text?: string) => {
  if (!text) {
    return '';
  }

  return text
    .replace(/\n/g, '\n<br>\n')
    .split(/[\s]/)
    .map((word, i) => {
      if (isUrl(word)) {
        return (
          <a key={i} href={word}>
            {word}{' '}
          </a>
        );
      } else if (word === '<br>') {
        return <br key={i} />;
      } else {
        return <span key={i}>{word} </span>;
      }
    });
};
