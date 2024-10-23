import { test } from '@playwright/test';
import { saveHtml, takeScreenshot } from '../helpers/screenshot';
import { getRandomEmail } from '../helpers/test-data';

const OUTPUT_PREFIX = 'login';
const DEFAULT_PASSWORD = 'test12345';
const email = getRandomEmail();

test('can sign up a new account', async ({ page }) => {
  await page.goto('/login');

  await page.getByText('Go to Signup').click();

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.getByText('Go to Login').click();

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
  await page.locator('button[type="submit"]').click();

  console.log('created account', email, DEFAULT_PASSWORD);

  await page.waitForSelector('text=Welcome', { timeout: 5000 });
});

test('can change the password', async ({ page }) => {
  await page.goto('/login');

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('text=Welcome', { timeout: 5000 });

  await page.goto('/admin-settings');
  await page.locator('input[name="updatePw"]').fill(DEFAULT_PASSWORD + '!');

  await page.getByRole('button', { name: /Update Password/i }).click();
  await page.waitForSelector('text=Password saved successfully.', {
    timeout: 5000,
  });

  await page.locator('input[name="updatePw"]').fill(DEFAULT_PASSWORD);
  await page.getByRole('button', { name: /Update Password/i }).click();
  await page.waitForSelector('text=Password saved successfully.', {
    timeout: 5000,
  });
});

test('can log out', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('text=Welcome', { timeout: 5000 });

  await page.goto('/admin-settings');
  await page.getByRole('button', { name: /Logout/i }).click();
  await page.waitForSelector('text=Login to a Trivivia quiz admin account', {
    timeout: 5000,
  });

  await page.goto('/landing');
  await page.waitForSelector('text=Unauthorized', { timeout: 5000 });
});
