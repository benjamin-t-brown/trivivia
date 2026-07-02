import { expect, type Page } from '@playwright/test';
import { INTEGRATION_SEED } from './test-data';

export async function selectQuizTemplate(page: Page, templateName: string) {
  await page.locator('#quizTemplateName').click();
  await page.locator('#quizTemplateName').fill(templateName);
  await page
    .locator('#quizTemplateName-suggestions')
    .getByText(templateName, { exact: true })
    .click();
}

export async function createLiveQuizFromTemplate(
  page: Page,
  options: { quizName: string; templateName?: string }
) {
  const templateName = options.templateName ?? INTEGRATION_SEED.quizTemplateName;

  await page.goto('/live-quiz-start');
  await selectQuizTemplate(page, templateName);
  await page.locator('input[name="name"]').fill(options.quizName);
  await page
    .locator('#edit-live-quiz-form')
    .getByRole('button', { name: 'Save' })
    .click();
  await page.waitForURL('**/live-quiz-admin/**');
}

export async function extractUserFriendlyId(page: Page): Promise<string> {
  // The ID appears in the page header and again in the quiz-info dialog markup.
  const idLocator = page
    .locator('span')
    .filter({ hasText: /^\([a-z0-9]{6}\)$/ })
    .first();
  await expect(idLocator).toBeVisible();
  const text = await idLocator.innerText();
  return text.slice(1, -1);
}

function getTeamRow(page: Page, teamName: string) {
  const teamNamePattern = new RegExp(`^\\d+\\. ${escapeRegExp(teamName)}$`);
  return page.getByText(teamNamePattern).locator('..').locator('..');
}

export async function refreshQuizAdmin(adminPage: Page) {
  const refreshResponse = adminPage.waitForResponse(
    response =>
      response.url().includes('/api/live-quiz-admin/quiz/') &&
      response.request().method() === 'GET' &&
      response.ok()
  );
  await adminPage.getByRole('button', { name: 'Refresh Submissions' }).click();
  await refreshResponse;
}

export async function waitForTeamSubmission(
  adminPage: Page,
  teamName: string
) {
  await refreshQuizAdmin(adminPage);
  const teamRow = getTeamRow(adminPage, teamName);
  await expect(teamRow.getByText('Submitted')).toBeVisible({ timeout: 15_000 });
}

export async function updateQuizScores(adminPage: Page) {
  const updateScoresResponse = adminPage.waitForResponse(
    response =>
      (response.url().includes('/live-quiz-admin/') &&
        response.url().includes('/scores')) ||
      response.url().includes('/update-scores')
  );
  await adminPage.getByRole('button', { name: 'Update Scores' }).click();
  await updateScoresResponse;
}

export async function expectTeamScore(
  adminPage: Page,
  teamName: string,
  expectedScore: number
) {
  await expect
    .poll(
      async () => {
        await refreshQuizAdmin(adminPage);
        const scoreText = await getTeamRow(adminPage, teamName)
          .getByText(/^Score: \d+$/)
          .innerText()
          .catch(() => '');
        const match = scoreText.match(/^Score: (\d+)$/);
        return match ? Number(match[1]) : null;
      },
      { timeout: 20_000 }
    )
    .toBe(expectedScore);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
