import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { loginAsIntegrationAdmin } from '../helpers/auth';
import {
  createLiveQuizFromTemplate,
  extractUserFriendlyId,
  expectTeamScore,
  updateQuizScores,
  waitForTeamSubmission,
} from '../helpers/live-quiz';

test.describe('live quiz', () => {
  test('team answers seeded quiz and receives the correct score', async ({
    browser,
  }) => {
    test.setTimeout(90_000);
    const adminContext = await browser.newContext();
    const teamContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const teamPage = await teamContext.newPage();

    const teamName = `Team ${faker.string.alphanumeric(6)}`;
    const liveQuizName = `Live Quiz ${faker.string.alphanumeric(8)}`;
    // 2 correct answers; joker auto-applies on the final round (2 × 2 = 4).
    const expectedScore = 4;

    try {
      await loginAsIntegrationAdmin(adminPage);
      await createLiveQuizFromTemplate(adminPage, { quizName: liveQuizName });
      const userFriendlyId = await extractUserFriendlyId(adminPage);

      await adminPage.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(
        adminPage.getByRole('button', { name: 'Go To Questions' })
      ).toBeVisible({ timeout: 15_000 });

      await teamPage.goto(`/join/${userFriendlyId}`);
      await teamPage.locator('input[name="teamName"]').fill(teamName);
      await teamPage.getByRole('button', { name: 'Join Quiz' }).click();
      await teamPage.waitForURL(`**/live/${userFriendlyId}`);

      await adminPage.getByRole('button', { name: 'Go To Questions' }).click();
      await expect(
        adminPage.getByRole('button', { name: 'Show All' })
      ).toBeVisible({ timeout: 15_000 });
      await adminPage.getByRole('button', { name: 'Show All' }).click();

      await expect(teamPage.getByText('What is 2 + 2?')).toBeVisible({
        timeout: 15_000,
      });
      const answers = teamPage.getByRole('textbox', { name: 'Answer' });
      await expect(answers).toHaveCount(2, {
        timeout: 15_000,
      });

      await answers.nth(0).fill('4');
      await answers.nth(1).fill('Paris');
      await teamPage.getByRole('button', { name: /Submit/ }).click();

      await waitForTeamSubmission(adminPage, teamName);

      await adminPage.getByRole('button', { name: 'Lock Submissions' }).click();
      await adminPage
        .getByRole('button', { name: 'Grade Answers' })
        .first()
        .click();
      await adminPage.waitForURL('**/grade');

      await adminPage.getByRole('button', { name: 'Autograde Round' }).click();
      await expect(
        adminPage.getByRole('button', { name: 'Autograde Round' })
      ).toBeVisible({ timeout: 15_000 });

      const submitGradesResponse = adminPage.waitForResponse(
        response =>
          response.url().includes('/live-quiz-admin/') &&
          response.url().includes('/grade') &&
          response.request().method() === 'PUT' &&
          response.ok()
      );
      await adminPage.getByRole('button', { name: 'Submit Grades' }).click();
      await submitGradesResponse;

      await adminPage.getByRole('button', { name: 'Go Back To Quiz' }).click();
      await adminPage.waitForURL(/\/live-quiz-admin\/[^/]+$/);

      await adminPage
        .getByRole('button', { name: /Stop Showing Questions/ })
        .click();
      await expect(
        adminPage.getByRole('button', { name: 'Go To Answers' })
      ).toBeVisible({ timeout: 15_000 });

      await adminPage.getByRole('button', { name: 'Go To Answers' }).click();
      await expect(
        adminPage.getByRole('button', { name: 'Update Scores' })
      ).toBeVisible({ timeout: 15_000 });

      await updateQuizScores(adminPage);
      await expectTeamScore(adminPage, teamName, expectedScore);
    } finally {
      await adminContext.close();
      await teamContext.close();
    }
  });
});
