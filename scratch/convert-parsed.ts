import * as fs from 'fs';
import {
  AnswerBoxType,
  AnswerState,
  QuestionTemplateResponse,
  RoundTemplateResponse,
} from '../shared/responses';
import * as path from 'path';

// npx tsx convert-parsed.ts

interface ParsedQuestion {
  id: string;
  questionImage: string | null;
  questionText: string;
  answerText?: string;
  numAnswers: number;
  isBonus: boolean;
  choices?: string[];
  correctChoiceInd?: number;
}

interface ParsedRound {
  id: string;
  roundName: string;
  roundDescription: string;
  questions: ParsedQuestion[];
}

const removeParsedFile = false;
const configPath = path.resolve(
  __dirname,
  '../test-browser/gwd/gwd.test.config.json'
);
const { roundFile } = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const prefix = roundFile;
const fileName = `${prefix}.round.json`;
const filePath = path.resolve(__dirname, fileName);

const parsedRound: ParsedRound = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const convertParsedQuestionToUploadable = (
  q: ParsedQuestion,
  roundId: string
): QuestionTemplateResponse => {
  const answers: Record<string, string> = {};
  let answerType = 'input1';
  let orderMatters = false;
  if (q.choices?.length) {
    answerType = 'radio' + q.choices?.length;
    for (let i = 0; i < q.choices.length; i++) {
      answers['radio' + (i + 1)] = q.choices[i];
    }
    orderMatters = true;
    answers['answer1'] = q.choices[q.correctChoiceInd ?? 0];
  } else {
    const answerTextSplit = q.answerText?.split('|') ?? [];
    for (let i = 0; i < q.numAnswers; i++) {
      answers['answer' + (i + 1)] = answerTextSplit[i]?.trim();
    }
    answerType = 'input' + q.numAnswers;
  }

  const retQ: QuestionTemplateResponse = {
    id: q.id,
    creationDate: new Date().toISOString(),
    roundTemplateId: roundId,
    notes: '',
    text: q.questionText,
    answerType: answerType as AnswerBoxType,
    answers: answers as AnswerState,
    orderMatters,
    isBonus: q.isBonus,
    imageLink: q.questionImage ?? undefined,
  };

  return retQ;
};

const createUploadableRound = (r: ParsedRound): RoundTemplateResponse => {
  const retR: RoundTemplateResponse = {
    quizTemplateName: '',
    id: r.id,
    title: r.roundName,
    description: r.roundDescription,
    questionOrder: r.questions.map(q => q.id),
    notes: '',
    jokerDisabled: false,
    creationDate: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    questions: r.questions.map(q => convertParsedQuestionToUploadable(q, r.id)),
    quizTemplateId: '',
  };

  return retR;
};

const uploadableRound = createUploadableRound(parsedRound);

const outputPath =
  __dirname +
  '/gwd-rounds/' +
  roundFile +
  '-' +
  uploadableRound.title +
  '.json';
fs.writeFileSync(outputPath, JSON.stringify(uploadableRound, null, 2));
console.log('wrote file', outputPath);

if (removeParsedFile) {
  fs.unlinkSync(filePath);
  console.log('removed parsed file', filePath);
}
