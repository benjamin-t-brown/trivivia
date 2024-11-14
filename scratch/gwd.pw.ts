import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { AnswerState } from 'shared/responses';

// npx tsx scratch/gwd.pw.ts

const execAsync = async (command: string): Promise<void> => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve();
    });
  });
};

const mkdirp = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const saveConfigForTest = (testName: string, config: any) => {
  const configPath = path.resolve(
    __dirname,
    `../test-browser/gwd/${testName}.config.json`
  );
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('wrote test config to', configPath);
};

const shimTest = async (roundNumber: number, prefix: string) => {
  const inputFile = fs
    .readFileSync(
      path.resolve(__dirname, `gwd.round${roundNumber}-answers.html`)
    )
    .toString();
  const outputFile = `${prefix}.html`;
  const outputPath = path.resolve(
    __dirname,
    '../',
    'test-browser',
    'test-results-output',
    outputFile
  );
  fs.writeFileSync(outputPath, inputFile);
  console.log(`Saved shim to ${outputPath}`);
};

interface ParsedRound {
  id: string;
  roundName: string;
  roundDescription: string;
  questions: ParsedQuestion[];
}

interface ParsedQuestion {
  id: string;
  questionImage: string | null;
  questionText: string;
  answerText: string;
  numAnswers: number;
  isBonus?: boolean;
}

interface Round {
  id: string;
  title: string;
  description: string;
  questionOrder: string[];
  notes: string;
  jokerDisabled: boolean;
  creationDate: Date;
  updatedOn: Date;
  deletionDate: null;
  quizTemplateId: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  answers: AnswerState;
  answerType: string;
  imageLink: string;
  orderMatters: boolean;
  isBonus: boolean;
  notes: string;
  creationDate: Date;
  updatedOn: Date;
  deletionDate: null;
  roundTemplateId: string;
}

const convertParsedOutputToTriviviaRound = (parsedRound: ParsedRound) => {
  // TODO get this to work with radios (it always assumes input)
  const convertParsedQuestionToTriviviaQuestion = (
    parsedQuestion: ParsedQuestion
  ): Question => {
    const obj = {
      id: parsedQuestion.id,
      text: parsedQuestion.questionText,
      answers: {},
      answerType: 'input' + parsedQuestion.numAnswers,
      imageLink: parsedQuestion.questionImage ?? '',
      orderMatters: false,
      isBonus: Boolean(parsedQuestion.isBonus),
      notes: '',
      creationDate: new Date(),
      updatedOn: new Date(),
      deletionDate: null,
      roundTemplateId: parsedRound.id,
    };
    const answerList = parsedQuestion.answerText.split('|');
    for (let i = 0; i < parsedQuestion.numAnswers; i++) {
      const answer = answerList[i];
      const answerKey = `answer${i + 1}`;
      obj.answers[answerKey] = answer;
    }
    return obj;
  };

  const questionOrder: string[] = [];
  const round: Round = {
    id: parsedRound.id,
    title: parsedRound.roundName,
    description: parsedRound.roundDescription,
    questionOrder,
    notes: '',
    jokerDisabled: false,
    creationDate: new Date(),
    updatedOn: new Date(),
    deletionDate: null,
    quizTemplateId: '11111111-2222-3333-4444-123412341234',
    questions: parsedRound.questions.map(q => {
      const ret = convertParsedQuestionToTriviviaQuestion(q);
      questionOrder.push(ret.id);
      return ret;
    }),
  };
  return round;
};

// parsegwd.test.config.json
const main = async () => {
  await execAsync('echo "Begin quiz capture!"');

  const roundNumber = 6;
  const quizName = 'Quiz 2024-10-22';

  // saveConfigForTest('gwd.test', {
  //   playerCode: '12345',
  //   prefix: 'gwdRound' + roundNumber,
  // });
  // await execAsync(
  //   `yarn --cwd ${path.resolve(
  //     __dirname,
  //     `../test-browser`
  //   )} test -c playwright.gwd.config.js gwd.test.js`
  // );
  shimTest(roundNumber, 'gwdRound' + roundNumber);

  // const roundNumber = config.roundNumber;
  // const prefix = 'parse' + roundNumber;
  // const parseFile = path.resolve(
  //   __dirname,
  //   '../',
  //   'test-results-output',
  //   `gwd.round${roundNumber}-answers.html`
  // );

  saveConfigForTest('parsegwd.test', {
    roundNumber,
    prefix: 'gwdRound' + roundNumber + '.parsed',
    parseFile: 'gwdRound' + roundNumber + '.html',
  });
  await execAsync(
    `yarn --cwd ${path.resolve(
      __dirname,
      `../test-browser`
    )} test -c playwright.gwd.config.js parsegwd.test.js`
  );

  const parseFilePath = path.resolve(
    __dirname,
    '../',
    'test-browser',
    'test-results-output',
    'gwdRound' + roundNumber + '.parsed.round.json'
  );

  const parsedRound = JSON.parse(fs.readFileSync(parseFilePath).toString());
  mkdirp(path.resolve(__dirname, 'gwd-rounds'));

  const roundPath = path.resolve(
    __dirname,
    'gwd-rounds',
    `${quizName}-${roundNumber}-${parsedRound.roundName
      .replace(/\s/g, '_')
      .replace(/:/g, '_')}.json`
  );
  fs.writeFileSync(
    roundPath,
    JSON.stringify(convertParsedOutputToTriviviaRound(parsedRound), null, 2)
  );
  console.log('Exportable round outputted to', roundPath);
};
main();

export default {};
