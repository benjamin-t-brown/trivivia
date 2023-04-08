import {
  AnswerState,
  LiveQuizResponse,
  LiveQuizState,
  LiveQuizTeamResponse,
  LiveRoundState,
  QuestionTemplateResponse,
  RoundTemplateResponse,
  getNumAnswers,
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
    case LiveRoundState.SHOWING_ANSWERS:
      return 'Showing Answers';
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

export const getRoundAnswersArrays = (
  roundTemplate: RoundTemplateResponse,
  team: LiveQuizTeamResponse
) => {
  const answersArr: string[] = [];
  const teamAnswersArr: string[] = [];
  const orderMattersArr: boolean[] = [];

  const submittedAnswers =
    team.liveQuizRoundAnswers.find(a => a.roundId === roundTemplate.id)
      ?.answers ?? {};

  for (let j = 0; j < roundTemplate.questionOrder.length; j++) {
    const questionId = roundTemplate.questionOrder[j];
    const questionTemplate = roundTemplate.questions?.find(
      q => q.id === questionId
    );
    if (!questionTemplate) {
      continue;
    }

    const numAnswers = getNumAnswers(questionTemplate.answerType);

    const qArr: string[] = [];
    const qTeamArr: string[] = [];
    for (let k = 0; k < numAnswers; k++) {
      const key = 'answer' + (k + 1);
      const answers = questionTemplate.answers[key];
      const teamAnswers = submittedAnswers[j]?.[key];
      qArr.push(answers);
      qTeamArr.push(teamAnswers);
    }
    answersArr.push(qArr.join(' | '));
    teamAnswersArr.push(qTeamArr.join(' | '));
    orderMattersArr.push(questionTemplate.orderMatters);
  }
  return { answersArr, teamAnswersArr, orderMattersArr };
};
