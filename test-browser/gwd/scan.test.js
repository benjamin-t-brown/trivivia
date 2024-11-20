// https://b.play.geekswhodrink.com/livegame/098/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff

import { test } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';

const TEST_RESULTS_OUTPUT = path.resolve(
  __dirname,
  '../',
  'test-results-output'
);

// This file progressively scans gwd nodes for a quiz, then tries to detect if it is
// joinable.  If it finds one, it exits.

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
  const prefix = 'SCAN_QUIZZES';

  const activeQuizUrls = [];

  for (let i = 0; i < 25; i++) {
    const num = padLeft(String(i), 3);
    const url = `https://a.play.geekswhodrink.com/livegame/${num}/play/?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff`;
    await page.goto(url);
    const title = await page.title();
    console.log('Title:', await page.title());
    if (title.includes('GWD Trivia')) {
      console.log(' - FOUND POTENTIAL!', url);

      await new Promise(resolve => setTimeout(resolve, 3000));

      await takeScreenshot(prefix, page);

      const modalBackdropRemoved = await page.evaluate(() => {
        const element = document.querySelector('.modal-backdrop');
        if (element) {
          element.classList.remove('modal-backdrop');
          console.log('join found!');
          return true;
        } else {
          console.log('join not found :(');
          return false;
        }
      });
      await takeScreenshot(prefix, page);

      console.log('modalBackdropRemoved', modalBackdropRemoved);
      if (modalBackdropRemoved) {
        const buttonFound = await page.evaluate(() => {
          var xpath = "//button[text()='Just Watch']";
          /** @type {any} */
          var button = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          )?.singleNodeValue;
          if (button) {
            button.click();
            return true;
          }
          return false;
        });
        if (buttonFound) {
          console.log('Clicked join!');
          await takeScreenshot(prefix, page);
          activeQuizUrls.push(url);
          i += 16;
        } else {
          console.log('Could not click watch button');
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('Active Quiz URLs:', activeQuizUrls.join('\n'));
  console.log('OUTPUT:', `${TEST_RESULTS_OUTPUT}/active-quiz-urls.json`);

  fs.writeFileSync(
    `${TEST_RESULTS_OUTPUT}/active-quiz-urls.json`,
    JSON.stringify(activeQuizUrls, null, 2)
  );
});
