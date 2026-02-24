import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import env from './env';
import logger from './logger';
import { Account } from './models/Account';
import { LiveQuiz } from './models/LiveQuiz';
import { LiveQuizRoundAnswers } from './models/LiveQuizRoundAnswers';
import { LiveQuizTeam } from './models/LiveQuizTeam';
import { QuestionTemplate } from './models/QuestionTemplate';
import { QuizTemplate } from './models/QuizTemplate';
import { RoundTemplate } from './models/RoundTemplate';

const models = [
  Account,
  LiveQuiz,
  LiveQuizRoundAnswers,
  LiveQuizTeam,
  QuestionTemplate,
  QuizTemplate,
  RoundTemplate,
];

const dbLocation =
  process.env.VITEST === 'true'
    ? ':memory:'
    : path.resolve(__dirname, '../../db/prod.sqlite');

class Db {
  sequelize: Sequelize;
  constructor() {
    logger.debug('Connecting to db...', dbLocation);
    const sequelize = new Sequelize('database', env.db.user, env.db.pw, {
      host: '0.0.0.0',
      dialect: 'sqlite',
      storage: dbLocation,
      logging: false,
    });
    sequelize.addModels(models);
    this.sequelize = sequelize;
  }
  async init() {
    if (process.env.VITEST === 'true') {
      await this.sequelize.sync();
    }
  }
}

let db: Db | null = null;

export const initDb = async () => {
  db = new Db();
  await db.init();
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database is not connected!');
  }
  return db;
};
