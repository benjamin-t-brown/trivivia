import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import env from './env';
import logger from './logger';

class Db {
  sequelize: Sequelize;
  constructor() {
    logger.debug('Connecting to db...');
    const sequelize = new Sequelize('database', env.db.user, env.db.pw, {
      host: '0.0.0.0',
      dialect: 'sqlite',
      storage: 'database.sqlite',
      logging: false,
    });
    sequelize.addModels([path.resolve(__dirname, 'models')]);
    this.sequelize = sequelize;
  }
  async init() {
    // await this.sequelize.sync({ alter: true, force: true });
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
