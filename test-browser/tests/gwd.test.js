import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { saveHtml, SCRATCH_DIR, takeScreenshot } from '../helpers/screenshot';

const PLAYER_CODE = '008421';
const prefix = 'gwd';

// npx playwright install
// npx playwright test test-browser/gwd.test.js --reporter=list
// yarn test gwd

test.skip('GWD Quiz', async ({ page }) => {
  await page.goto('https://play.geekswhodrink.com/');
  
  await takeScreenshot(prefix, page);
  await page.locator('#playerCode').fill(PLAYER_CODE);
  await takeScreenshot(prefix, page);
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
  await takeScreenshot(prefix, page);

  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.getByText('Just Watch').click();

  // await new Promise(resolve => setTimeout(resolve, 1000));

  await takeScreenshot(prefix, page);

  await saveHtml(prefix, page);
});
