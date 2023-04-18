import {
  LiveQuizPublicResponse,
  LiveQuizPublicStateResponse,
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
} from 'shared/responses';

export const isWaitingForQuizToStart = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return quiz?.quizState === LiveQuizState.NOT_STARTED;
};

export const isWaitingForRoundToStart = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_WAITING &&
    quiz?.roundState === LiveRoundState.NOT_STARTED
  );
};

export const isWaitingForRoundToComplete = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_WAITING &&
    quiz?.roundState === LiveRoundState.COMPLETED
  );
};

export const isRoundInProgressAndVisible = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_IN_ROUND &&
    (quiz?.roundState === LiveRoundState.STARTED_ACCEPTING_ANSWERS ||
      quiz?.roundState === LiveRoundState.STARTED_NOT_ACCEPTING_ANSWERS)
  );
};

export const isRoundInProgressButNotVisible = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_WAITING &&
    (quiz?.roundState === LiveRoundState.STARTED_ACCEPTING_ANSWERS ||
      quiz?.roundState === LiveRoundState.STARTED_NOT_ACCEPTING_ANSWERS ||
      quiz?.roundState === LiveRoundState.COMPLETED)
  );
};

export const isRoundCompletedAndVisible = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_IN_ROUND &&
    quiz?.roundState === LiveRoundState.COMPLETED
  );
};

export const isShowingRoundQuestions = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_IN_ROUND &&
    (quiz?.roundState === LiveRoundState.STARTED_ACCEPTING_ANSWERS ||
      quiz?.roundState === LiveRoundState.STARTED_NOT_ACCEPTING_ANSWERS ||
      quiz?.roundState === LiveRoundState.COMPLETED)
  );
};

export const isShowingRoundAnswers = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_HIDDEN ||
    quiz?.quizState === LiveQuizState.SHOWING_ANSWERS_ANSWERS_VISIBLE
  );
};

export const isRoundLocked = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return quiz?.roundState === LiveRoundState.COMPLETED;
};

export const isRoundAcceptingSubmissions = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return quiz?.roundState === LiveRoundState.STARTED_ACCEPTING_ANSWERS;
};

export const isInRoundAndRoundIsCompleted = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return (
    quiz?.quizState === LiveQuizState.STARTED_IN_ROUND &&
    quiz?.roundState === LiveRoundState.COMPLETED
  );
};

export const isQuizCompleted = (liveQuiz?: LiveQuizResponse) => {
  return (
    (isWaitingForRoundToStart(liveQuiz) ||
      isRoundInProgressButNotVisible(liveQuiz)) &&
    (liveQuiz?.currentRoundNumber ?? 0) >=
      (liveQuiz?.quizTemplateJson?.rounds?.length ?? 0)
  );
};

export const isRoundCompleted = (
  quiz?: LiveQuizResponse | LiveQuizPublicResponse
) => {
  return quiz?.roundState === LiveRoundState.COMPLETED;
};

export const getCurrentRoundFromPublicQuizState = (
  quizState: LiveQuizPublicStateResponse
) => {
  return quizState.round;
};

export const getCurrentQuestionsFromPublicQuizState = (
  quizState: LiveQuizPublicStateResponse
) => {
  return quizState.round?.questions ?? [];
};
