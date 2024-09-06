import { fetchAsync } from 'actions';
import { removeFromCache } from 'cache';
import { FormError } from 'components/FormErrorText';
import { EditQuizValues } from 'routes/EditQuizTemplate';
import { EditRoundValues } from 'routes/EditRoundTemplate';
import {
  QuestionTemplateResponse,
  QuizTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';

export const fetchImportRoundTemplate = async (
  roundTemplate: Partial<RoundTemplateResponse & EditRoundValues>,
  quizTemplateId: string
) => {
  // TODO validate input
  const result = await fetchAsync<RoundTemplateResponse>(
    'post',
    '/api/template/round',
    {
      isNew: true,
      title: roundTemplate.title,
      description: roundTemplate.description,
      notes: roundTemplate.notes,
      jokerDisabled: roundTemplate.jokerDisabled,
      quizTemplateId,
    }
  );
  const importedRoundTemplate = roundTemplate as RoundTemplateResponse;
  const questions = importedRoundTemplate.questions ?? [];
  for (const questionId of importedRoundTemplate.questionOrder ?? []) {
    const question: Partial<QuestionTemplateResponse> | undefined =
      questions.find(q => q.id === questionId);
    if (question) {
      delete question.id;
      delete question.roundTemplateId;
      const questionResult = await fetchAsync<RoundTemplateResponse>(
        'post',
        '/api/template/question',
        {
          ...question,
          answers: JSON.stringify(question.answers),
          roundTemplateId: result.data.id,
        }
      );
      if (questionResult.error) {
        throw {
          message: questionResult.message,
          values: {},
        } as FormError;
      }
      removeFromCache(
        'get',
        `/api/template/question/${questionResult.data.id}`
      );
    }
  }
  removeFromCache('get', `/api/template/round/${result.data.id}`);
  removeFromCache('get', `/api/template/quiz/${quizTemplateId}`);
  removeFromCache('get', `/api/template/all/round/${quizTemplateId}`);
  return result;
};

export const fetchImportQuizTemplate = async (
  quizTemplate: Partial<QuizTemplateResponse & EditQuizValues>
) => {
  // TODO validate input
  delete quizTemplate.id;
  const result = await fetchAsync<QuizTemplateResponse>(
    'post',
    '/api/template/quiz',
    {
      isNew: true,
      name: quizTemplate.name,
      numRounds: quizTemplate.numRounds,
      notes: quizTemplate.notes,
    }
  );
  const importedQuizTemplate = quizTemplate as QuizTemplateResponse;
  const rounds = importedQuizTemplate.rounds ?? [];
  for (const roundId of importedQuizTemplate.roundOrder) {
    const round: RoundTemplateResponse | undefined = rounds.find(
      r => r.id === roundId
    );
    if (!round) {
      continue;
    }
    const roundResult = await fetchImportRoundTemplate(round, result.data.id);
    removeFromCache('get', `/api/template/round/${roundResult.data.id}`);
  }
  removeFromCache('get', `/api/template/quiz/${result.data.id}`);
  removeFromCache('get', `/api/template/all/round/${result.data.id}`);
  removeFromCache('get', '/api/template/all/quiz');
  return result;
};
