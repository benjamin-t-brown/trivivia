import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { removeUnnecessaryWhitespace } from './helpers';

const SCRATCH_DIR = path.resolve(__dirname, '../../scratch');

// This file loads a round html file from 'test-results-output' and parses it into a round json file
// placing it in the scratch directory.

// npx playwright test test-browser/gwd/parsegwd.test.js --config=playwright.config.js

const { quizName, playerCode, url, roundFile } = JSON.parse(
  fs.readFileSync(__dirname + '/gwd.test.config.json', 'utf8')
);
// const roundFile = 'QUIZ-2024-11-15-TEST-round6';

const locateOptional = async (locator, method, arg) => {
  try {
    return await locator[method](arg, { timeout: 100 });
  } catch {}
  return null;
};

const removePercents = str => {
  return str.replace(/\d+%/g, '_');
};

const removeEmptyParens = str => {
  return str.replace(/\(\)/g, '');
};

const randomizeOrderOfArray = arr => {
  return arr.sort(() => Math.random() - 0.5);
};

test('Parse', async ({ page }) => {
  const prefix = roundFile;
  const parseFile = path.resolve(
    __dirname,
    '../',
    'test-results-output',
    roundFile + '.html'
  );

  console.log('loading file', parseFile);
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
    const numAnswerText = await question
      .locator('.tw-flex.tw-flex-row .tw-text-correct-answertext')
      .count();
    const numAnswers = await question.locator('input').count();
    if (numH4 === 3) {
      const questionText = removeUnnecessaryWhitespace(
        await question.locator('h4').nth(1).textContent()
      ).replace(/\n/g, ' ');
      let answerText = removeEmptyParens(
        removePercents(
          removeEmptyParens(
            removeUnnecessaryWhitespace(
              await question.locator('h4').nth(2).textContent()
            )
          ).trim()
        ).replace(/_/g, '')
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
    } else if (numAnswerText > 0) {
      // multiple choice

      const questionText = removeUnnecessaryWhitespace(
        await question.getByTestId('text').textContent()
      ).replace(/\n/g, ' ');
      const correctAnswer = removeUnnecessaryWhitespace(
        await question
          .locator('.tw-flex.tw-flex-row .tw-text-correct-answertext')
          .innerText()
      );
      const incorrectAnswers = [];
      for (const s of await question
        .locator('.tw-text-incorrect-answertext')
        .all()) {
        incorrectAnswers.push(removeUnnecessaryWhitespace(await s.innerText()));
      }

      const randArr = randomizeOrderOfArray([
        correctAnswer,
        ...incorrectAnswers,
      ]);
      const correctInd = randArr.indexOf(correctAnswer);

      roundQuestions.push({
        id: randomUUID(),
        questionImage,
        questionText,
        choices: randArr,
        correctChoiceInd: correctInd,
        numAnswers,
      });
    } else {
      // multiple inputs

      const questionText = removeUnnecessaryWhitespace(
        await question.locator('h4').nth(1).textContent()
      ).replace(/\n/g, ' ');
      let answerText = removeUnnecessaryWhitespace(
        await question.locator('css=.panel-body').textContent()
      ).replace(/\n/g, ' ');

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

      answerText = removePercents(answerText).replace(/_/g, '|').trim();
      if (answerText[answerText.length - 1] === '|') {
        answerText = answerText.slice(0, -1);
      }
      answerText = answerText.split('|').map(s => s.trim()).join('|');

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

  const p = path.resolve(SCRATCH_DIR, `${prefix}.round.json`);
  console.log('write to', p);
  fs.writeFileSync(p, JSON.stringify(round, null, 2));
});
