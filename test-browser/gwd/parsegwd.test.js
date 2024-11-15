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
// npx playwright test test-browser/gwd/parsegwd.test.js --config=playwright.config.js

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

const randomizeOrderOfArray = arr => {
  return arr.sort(() => Math.random() - 0.5);
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
    } else if (numH4 === 2) {
      console.log('NUMH4', numH4);
      // tw-text-correct-answer
      // tw-text-incorrect-answertext
      // ocument.querySelector('h4[data-testid="text"]').textContent
      let questionText = removeUnnecessaryWhitespace(
        await question.getByTestId('text').textContent()
      ).replace(/\n/g, ' ');

      // let answerText = '';

      // for (let i = 0; i < 16; i++) {
      //   const nth = question.getByTestId('answer-state').locator('..').nth(i)
      //   let t = '';
      //   try {
      //     t = await nth.innerText({
      //       timeout: 100,
      //     });
      //   } catch (e) {}
      //   if (!t) {
      //     continue;
      //   }
      //   answerText = ' ' + i + '. ' + removeUnnecessaryWhitespace(t);
      // }
      // const questionSelector = 'h4.nocopy[data-testid="text"] span';
      // const questionText = await page.textContent(questionSelector);

      // console.log('q text content', await question.textContent());
      const correctAnswer = removeUnnecessaryWhitespace(
        await question
          .locator('.tw-flex.tw-flex-row .tw-text-correct-answertext')
          .innerText()
      );
      let incorrectAnswers = [];
      for (const s of await question
        .locator('.tw-text-incorrect-answertext')
        .all()) {
        incorrectAnswers.push(removeUnnecessaryWhitespace(await s.innerText()));
      }

      // const answersText = [correctAnswer, incorrectAnswers];

      // const answersText = await Promise.all(
      //   answerSelectors.map(selector =>
      //     question.locator(selector).all().then(async els =>

      //     }
      //   )
      // );

      // const answerContainerSelector = '.tw-grid-rows-1fr';
      // const answerSelector = `${answerContainerSelector} .tw-inline.nocopy`;
      // const answers = await question.$$eval(answerSelector, nodes =>
      //   nodes.map(node => node.textContent.trim())
      // );

      console.log('QUeSTION ETEx', questionText);
      // console.log('ANSWER TEXT', answersText);

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

  const p = path.resolve(SCRATCH_DIR, `${prefix}.round.json`);
  console.log('write to', p);
  fs.writeFileSync(p, JSON.stringify(round, null, 2));

  // await saveText(prefix, page);
});
