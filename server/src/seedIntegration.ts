import { INTEGRATION_SEED } from 'shared/integrationSeed';
import { AnswerBoxType } from 'shared/responses';
import logger from './logger';
import { AccountService } from './services/AccountService';
import { TemplateService } from './services/TemplateService';

export async function seedIntegration() {
  const accountService = new AccountService();
  const templateService = new TemplateService();

  let account = (
    await accountService.findByEmail(INTEGRATION_SEED.adminEmail)
  )[0];
  if (!account) {
    account = await accountService.signup(
      INTEGRATION_SEED.adminEmail,
      INTEGRATION_SEED.adminPassword
    );
    logger.info('Integration seed: created admin account');
  }

  const existingQuizzes = await templateService.findAllQuizTemplatesByAccountId(
    account.id
  );
  if (existingQuizzes.some(q => q.name === INTEGRATION_SEED.quizTemplateName)) {
    logger.info('Integration seed: quiz template already exists');
    return;
  }

  const quizTemplate = await templateService.createQuizTemplate(
    {
      name: INTEGRATION_SEED.quizTemplateName,
      notes: 'Seeded for integration tests',
      allowStaticRender: false,
    },
    { userId: account.id, session: {}, ioSessions: [] }
  );

  if (!quizTemplate) {
    throw new Error('Integration seed: failed to create quiz template');
  }

  const roundTemplate = await templateService.createRoundTemplate({
    quizTemplateId: quizTemplate.id,
    title: 'Round 1',
    description: 'Integration test round',
  });

  if (!roundTemplate) {
    throw new Error('Integration seed: failed to create round template');
  }

  await templateService.createQuestionTemplate({
    roundTemplateId: roundTemplate.id,
    text: 'What is 2 + 2?',
    answers: JSON.stringify({ answer1: '4' }),
    answerType: AnswerBoxType.INPUT1,
  });

  await templateService.createQuestionTemplate({
    roundTemplateId: roundTemplate.id,
    text: 'Name the capital of France.',
    answers: JSON.stringify({ answer1: 'Paris' }),
    answerType: AnswerBoxType.INPUT1,
  });

  logger.info('Integration seed: created quiz template with questions');
}
