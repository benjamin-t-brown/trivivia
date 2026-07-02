import { expect, type Page } from '@playwright/test';
import { INTEGRATION_SEED } from './test-data';

export async function loginAsIntegrationAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(INTEGRATION_SEED.adminEmail);
  await page
    .locator('input[name="password"]')
    .fill(INTEGRATION_SEED.adminPassword);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/landing');
  await expect(page.getByText('Welcome')).toBeVisible();
}
