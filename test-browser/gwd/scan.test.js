// https://b.play.geekswhodrink.com/livegame/098/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff

import { test } from '@playwright/test';
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
// npx playwright test test-browser/gwd/scan.test.js --reporter=list

const { quizName, playerCode, url, roundFile } = JSON.parse(
  fs.readFileSync(__dirname + '/gwd.test.config.json', 'utf8')
);

// const playerCode = '008421';
// const url =
//   'https://b.play.geekswhodrink.com/livegame/098/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff';
// const roundFile = '2024-11-15-TEST'

let ctr = 0;
async function takeScreenshot(prefix, page) {
  await page.screenshot({
    path: `${TEST_RESULTS_OUTPUT}/${prefix}${ctr++}.png`,
  });
}

async function writeContentToFile(prefix, page) {
  const content = await page.content();
  fs.writeFileSync(`${TEST_RESULTS_OUTPUT}/${prefix}.html`, content);
}

const padLeft = (str, num) => {
  return '0'.repeat(num - str.length) + str;
};

test('GWD SCAN Quiz', async ({ page }) => {
  test.setTimeout(950_000);
  const prefix = 'scan';

  for (let i = 1; i < 200; i++) {
    const num = padLeft(String(i), 3);
    const url = `https://a.play.geekswhodrink.com/livegame/${num}/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff`;
    await page.goto(url);
    await page.screenshot({
      path: `${TEST_RESULTS_OUTPUT}/${prefix + '_' + num}.png`,
    });
    const title = await page.title();
    console.log('Title:', await page.title());
    if (title.includes('GWD Trivia')) {
      // console.log('CHECK URL', url);
      console.log(' - FOUND POTENTIAL!', url);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
