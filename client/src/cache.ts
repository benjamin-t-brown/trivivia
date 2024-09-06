import { FetchResponse } from 'actions';
import {
  AccountResponse,
  LiveQuizResponse,
  QuestionTemplateResponse,
  QuizTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';

const cache: Record<string, FetchResponse<any>> = ((window as any).cache = {});

export const getCacheKey = (method: string, url: string) => {
  return `${method}:${url}`;
};

export const updateCache = (
  method: string,
  url: string,
  result?: FetchResponse<any>
) => {
  const key = getCacheKey(method, url);
  if (result) {
    cache[key] = result;
  } else {
    delete cache[key];
  }
};

export const removeFromCache = (method: string, url: string) => {
  console.log('REMOVE FROM CACHE', method, url);
  delete cache[getCacheKey(method, url)];
};

export function getFromCache<T>(
  method: string,
  url: string
): FetchResponse<T> | undefined {
  const key = getCacheKey(method, url);
  return cache[key];
  // return undefined;
}

export const updateCacheAccount = (account: FetchResponse<AccountResponse>) => {
  updateCache('get', '/api/account', account);
};

export const updateCacheQuizTemplate = (
  quizTemplateId: string,
  quizTemplate?: FetchResponse<QuizTemplateResponse>
) => {
  removeFromCache('get', '/api/template/all/quiz');
  updateCache('get', '/api/template/quiz/' + quizTemplateId, quizTemplate);
};

export const updateCacheRoundTemplate = (
  quizTemplateId: string,
  roundTemplateId: string,
  roundTemplate?: FetchResponse<RoundTemplateResponse>
) => {
  removeFromCache('get', '/api/template/all/round/' + quizTemplateId);
  removeFromCache('get', '/api/template/quiz/' + quizTemplateId);
  updateCache('get', '/api/template/round/' + roundTemplateId, roundTemplate);
};

export const updateCacheQuestionTemplate = (
  roundTemplateId: string,
  questionTemplateId: string,
  questionTemplate?: FetchResponse<QuestionTemplateResponse>
) => {
  removeFromCache('get', '/api/template/all/question/' + roundTemplateId);
  removeFromCache('get', '/api/template/round/' + roundTemplateId);
  updateCache(
    'get',
    '/api/template/question/' + questionTemplateId,
    questionTemplate
  );
};

export const updateCacheLiveQuizAdmin = (
  liveQuizId: string,
  liveQuiz?: FetchResponse<LiveQuizResponse>
) => {
  removeFromCache('get', '/api/live-quiz-admin/all');
  updateCache('get', '/api/live-quiz-admin/quiz/' + liveQuizId, liveQuiz);
};

export const updateCacheLiveQuiz = (liveQuizUserFriendlyId: string) => {
  removeFromCache('get', '/api/live/' + liveQuizUserFriendlyId);
  removeFromCache('get', '/api/live/' + liveQuizUserFriendlyId + '/meta');
};
