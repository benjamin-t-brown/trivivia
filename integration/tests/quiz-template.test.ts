import { test, expect } from '@playwright/test';
import { loginAsIntegrationAdmin } from '../helpers/auth';
import {
  getUniqueQuizName,
  getUniqueRoundTitle,
} from '../helpers/test-data';

test.describe('quiz templates', () => {
  test('creates a quiz, round, and question with one input and one answer', async ({
    page,
  }) => {
    const quizName = getUniqueQuizName();
    const roundTitle = getUniqueRoundTitle();
    const questionText = 'What is the capital of France?';
    const answerText = 'Paris';

    await loginAsIntegrationAdmin(page);

    await page.goto('/quiz-templates');
    await page.getByRole('button', { name: 'New Quiz Template' }).click();
    await page.waitForURL('**/quiz-template-new');
    await page.locator('input[name="name"]').fill(quizName);
    await page.locator('#edit-quiz-form').getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/quiz-templates');

    await page.getByRole('button', { name: new RegExp(quizName) }).click();
    await page.waitForURL('**/round-templates');

    await page.getByRole('button', { name: 'New Round Template' }).click();
    await page.waitForURL('**/round-template-new');
    await page.locator('input[name="title"]').fill(roundTitle);
    await page.locator('#edit-round-form').getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/round-templates');

    await page.getByRole('button', { name: new RegExp(roundTitle) }).click();
    await page.waitForURL('**/question-templates');

    await page.getByRole('button', { name: 'New Question Template' }).click();
    await page.waitForURL('**/question-template-new');
    await page.locator('textarea[name="text"]').fill(questionText);
    await page.locator('select[name="answerType"]').selectOption('input_N_N');
    await page.locator('select[name="numAnswers"]').selectOption('1');
    await page.locator('select[name="numCorrectAnswers"]').selectOption('1');
    await page.getByLabel('Answer', { exact: true }).first().fill(answerText);
    await page
      .locator('#edit-question-form')
      .getByRole('button', { name: 'Save' })
      .click();
    await page.waitForURL('**/question-templates');

    await expect(page.getByText(questionText)).toBeVisible();
    await expect(page.getByText(roundTitle)).toBeVisible();
  });
});
