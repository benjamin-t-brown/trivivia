import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRATCH = path.resolve(__dirname, '../', 'test-results-output');
const PLAYER_CODE = '008421';

// npx playwright install
// npx playwright test test-browser/gwd.test.js --reporter=list

let ctr = 0;
async function takeScreenshot(prefix, page) {
  await page.screenshot({ path: `${SCRATCH}/${prefix}${ctr++}.png` });
}

test('GWD Join Quiz', async ({ page }) => {
  await page.goto('https://play.geekswhodrink.com/');
  const prefix = 'gwd-join';
  await takeScreenshot(prefix, page);
  await page.locator('#playerCode').fill(PLAYER_CODE);
  await takeScreenshot(prefix, page);
  await Promise.all([
    page.waitForResponse(resp => {
      return (
        resp.url().includes('api.gorisio.com/clients') && resp.status() === 200
      );
    }),
    page.locator('[type=submit]').click(),
  ],);
  await takeScreenshot(prefix, page);

  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.getByText('Just Watch').click();

  // await new Promise(resolve => setTimeout(resolve, 1000));

  await takeScreenshot(prefix, page);

  const html = await page.content();
  fs.writeFileSync(`${SCRATCH}/${prefix}.html`, html);
});
