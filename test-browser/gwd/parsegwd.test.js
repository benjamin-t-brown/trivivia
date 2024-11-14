import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// import {
//   removeUnnecessaryWhitespace,
//   saveHtml,
//   saveText,
//   SCRATCH_DIR,
//   takeScreenshot,
// } from '../helpers/screenshot';
import { randomUUID } from 'crypto';
import { removeUnnecessaryWhitespace } from './helpers';

const SCRATCH_DIR = path.resolve(__dirname, '../../scratch');

// yarn test -c playwright.gwd.config.js parsegwd.test.js

const locateOptional = async (locator, method, arg) => {
  try {
    return await locator[method](arg, { timeout: 100 });
  } catch {}
  return null;
};

const removePercents = str => {
  return str.replace(/\d+%/g, '');
};

const removeEmptyParens = str => {
  return str.replace(/\(\)/g, '');
};

test('Parse', async ({ page }) => {
  const config = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, 'parsegwd.test.config.json'),
      'utf8'
    )
  );

  const prefix = config.prefix;
  const parseFile = path.resolve(
    __dirname,
    '../',
    'test-results-output',
    config.parseFile
  );

  await page.goto('file:' + parseFile);
  const roundQuestions = [];

  let roundName = removeUnnecessaryWhitespace(
    await page.getByTestId('round-header').locator('h4').textContent()
  ).replace(/\n/g, ' ');
  const roundMatch = roundName.match(/Round \d+:/);
  if (roundMatch) {
    roundName = roundName.slice(roundMatch.index + roundMatch[0].length).trim();
  }

  const roundDescription = removeUnnecessaryWhitespace(
    await page.getByTestId('round-header').locator('p').textContent()
  ).replace(/\n/g, ' ');

  const questionLoc = page.getByTestId('q');
  const numQuestions = await questionLoc.count();
  for (let i = 0; i < numQuestions; i++) {
    const question = questionLoc.nth(i);
    const questionImage = await locateOptional(
      question.locator('img'),
      'getAttribute',
      'src'
    );
    const numH4 = await question.locator('h4').count();
    const numAnswers = await question.locator('input').count();
    if (numH4 === 3) {
      const questionText = removeUnnecessaryWhitespace(
        await question.locator('h4').nth(1).textContent()
      ).replace(/\n/g, ' ');
      let answerText = removeEmptyParens(
        removePercents(
          removeUnnecessaryWhitespace(
            await question.locator('h4').nth(2).textContent()
          )
        ).trim()
      );

      const answerInd = answerText.indexOf('Answer:');
      if (answerInd > -1) {
        answerText = answerText.slice(answerInd + 'Answer:'.length).trim();
      }

      roundQuestions.push({
        id: randomUUID(),
        questionImage,
        questionText,
        answerText,
        numAnswers,
        isBonus: questionText.includes('Bonus:'),
      });
    } else {
      const questionText = removeUnnecessaryWhitespace(
        await question.locator('h4').nth(1).textContent()
      ).replace(/\n/g, ' ');
      let answerText = removePercents(
        removeUnnecessaryWhitespace(
          await question.locator('css=.panel-body').textContent()
        ).replace(/\n/g, ' ')
      );
      const correctAnswersInd = answerText.indexOf('Correct Answers');
      if (correctAnswersInd > -1) {
        answerText = answerText
          .slice(correctAnswersInd + 'Correct Answers'.length)
          .trim();
      }
      const hashInd = answerText.indexOf('#');
      if (hashInd > -1) {
        answerText = answerText.slice(0, hashInd).trim();
      }

      answerText = answerText.replace(/  /g, '|');

      roundQuestions.push({
        id: randomUUID(),
        questionImage,
        questionText,
        answerText,
        numAnswers,
      });
    }
  }

  const round = {
    id: randomUUID(),
    roundName,
    roundDescription,
    questions: roundQuestions,
  };

  fs.writeFileSync(
    path.resolve(SCRATCH_DIR, `${prefix}.round.json`),
    JSON.stringify(round, null, 2)
  );

  // await saveText(prefix, page);
});
