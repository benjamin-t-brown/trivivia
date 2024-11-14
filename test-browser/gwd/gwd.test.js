import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { saveHtml, takeScreenshot } from '../helpers/screenshot';

// yarn test -c playwright.gwd.config.js gwd.test.js

test('GWD Quiz', async ({ page }) => {
  const config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'gwd.test.config.json'), 'utf8')
  );

  const PLAYER_CODE = config.playerCode;
  const prefix = config.prefix;

  await page.goto('https://play.geekswhodrink.com/');
  await page.locator('#playerCode').fill(PLAYER_CODE);
  await Promise.all([
    page.waitForResponse(resp => {
      if (resp.status() !== 200) {
        throw new Error('Failed to join quiz');
      }

      return (
        resp.url().includes('api.gorisio.com/clients') && resp.status() === 200
      );
    }),
    page.locator('[type=submit]').click(),
  ]);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.getByText('Just Watch').click();
  await takeScreenshot(prefix, page);
  await saveHtml(prefix, page);
});
