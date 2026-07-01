import { test, expect } from '@playwright/test';
import {
  DEFAULT_TEST_PASSWORD,
  getRandomEmail,
  INTEGRATION_SEED,
} from '../helpers/test-data';

test.describe('auth', () => {
  test('logs in with seed account', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill(INTEGRATION_SEED.adminEmail);
    await page
      .locator('input[name="password"]')
      .fill(INTEGRATION_SEED.adminPassword);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/landing');
    await expect(page.getByText('Welcome')).toBeVisible();
    await expect(page.getByText(INTEGRATION_SEED.adminEmail)).toBeVisible();
  });

  test('signs up a new account', async ({ page }) => {
    const email = getRandomEmail();

    await page.goto('/signup');

    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(DEFAULT_TEST_PASSWORD);
    await page.getByRole('button', { name: 'Signup' }).click();

    await page.waitForURL('**/account-created');
    await expect(
      page.getByText('Your account has been created.')
    ).toBeVisible();
  });

  test('shows error for invalid login', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill(INTEGRATION_SEED.adminEmail);
    await page.locator('input[name="password"]').fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Unauthorized.')).toBeVisible();
  });
});
