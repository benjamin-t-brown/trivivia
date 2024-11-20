import { test } from '@playwright/test';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import path from 'path';

const TEST_RESULTS_OUTPUT = path.resolve(
  __dirname,
  '../',
  'test-results-output'
);

// This file goes to a gwd quiz and grabs the contents of the html, saving it into
// 'test-results-output' directory.

// npx playwright install
// npx
// npx playwright test test-browser/gwd/gwd.test.js --reporter=list

const { quizName, playerCode, url, roundFile } = JSON.parse(
  fs.readFileSync(__dirname + '/gwd.test.config.json', 'utf8')
);

// const playerCode = '008421';
// const url =
//   'https://b.play.geekswhodrink.com/livegame/098/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff';
// const roundFile = '2024-11-15-TEST'

// const url =
//   'https://a.play.geekswhodrink.com/livegame/097/play/?access=' + randomUUID();
// const roundFile = 'ATEST1';
// const playerCode = '008421';

let ctr = 0;
async function takeScreenshot(prefix, page) {
  await page.screenshot({
    path: `${TEST_RESULTS_OUTPUT}/${prefix}${ctr++}.png`,
  });
}

test('GWD Join Quiz', async ({ page }) => {
  const prefix = roundFile;

  if (!url) {
    await page.goto('https://play.geekswhodrink.com/');
    await takeScreenshot(prefix, page);
    await page.locator('#playerCode').fill(playerCode);
    await takeScreenshot(prefix, page);
    await Promise.all([
      page.waitForResponse(resp => {
        return (
          resp.url().includes('api.gorisio.com/clients') &&
          resp.status() === 200
        );
      }),
      page.locator('[type=submit]').click({
        timeout: 10000,
      }),
    ]);
  } else {
    await page.goto(url);
  }

  await takeScreenshot(prefix, page);

  await page.evaluate(() => {
    window.onbeforeunload = function () {
      return 'Are you sure you want to leave?';
    };
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  await takeScreenshot(prefix, page);

  await page.evaluate(() => {
    const element = document.querySelector('.modal-backdrop');
    if (element) {
      element.classList.remove('modal-backdrop');
    }
  });

  await takeScreenshot(prefix, page);

  await page.evaluate(() => {
    var xpath = "//button[text()='Just Watch']";
    /** @type {any} */
    var button = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    button.click();
  });

  // this stopped working
  // await page.getByText('Just Watch').click();

  await new Promise(resolve => setTimeout(resolve, 500));

  await takeScreenshot(prefix, page);

  const html = await page.content();
  const outputFilePath = `${TEST_RESULTS_OUTPUT}/${prefix}.html`;
  console.log('write to', outputFilePath);
  fs.writeFileSync(outputFilePath, html);
});
