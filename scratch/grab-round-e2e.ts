import { exec } from 'child_process';
import path from 'path';
import * as fs from 'fs';

const execAsync = async command => {
  return new Promise<void>(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      } else {
        console.log('EXEC OUTPUT: ', stdout, stderr);
        resolve();
      }
    });
  });
};

// npx tsx grab-round-e2e.ts <quizName> <roundNumber> <url>

const quizName = process.argv[2];
const roundNumber = Number(process.argv[3]);
const url = process.argv[4];
const playerCode = '';

// const quizName = 'ATEST1';
// const playerCode = '82841';
// const url =
//   'https://a.play.geekswhodrink.com/livegame/097/play/?access=?access=d7d0b993-937e-4e68-9b7f-b58ba3369aff';
// const url = 'file://C:/progs/trivivia/scratch/gwd.testround4.html';
// const roundNumber = 7;

const roundFile = quizName + '-round' + roundNumber;

console.log('ARGS?', quizName, roundNumber, url);

// process.exit(0);

const main = async () => {
  const pathToConfigFile = path.resolve(
    __dirname,
    '../test-browser/gwd/gwd.test.config.json'
  );
  console.log(
    'writing config file to',
    pathToConfigFile,
    JSON.stringify(
      {
        quizName,
        playerCode,
        url,
        roundFile,
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    pathToConfigFile,
    JSON.stringify({ quizName, playerCode, url, roundFile }, null, 2)
  );

  console.log('Attempting to scrape round: ' + roundFile + '.html');
  const pathToTld = path.resolve(__dirname, '../');
  await execAsync(
    `cd ${pathToTld} && npx playwright test test-browser/gwd/gwd.test.js --config=playwright.config.js`
  );

  console.log(
    'Attempting to parse scraped round: "' + roundFile + '.round.json"'
  );
  await execAsync(
    `cd ${pathToTld} && npx playwright test test-browser/gwd/parsegwd.test.js --config=playwright.config.js`
  );

  console.log('Converting parsed round into uploadable format');
  const pathToHere = path.resolve(__dirname);
  await execAsync(`cd ${pathToHere} && npx tsx convert-parsed.ts`);
};
main();
