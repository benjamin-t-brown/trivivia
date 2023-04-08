import express from 'express';
import cookieSession from 'cookie-session';
import { withLogging } from './middlewares/withLogging';
import { authSession } from './middlewares/authSession';
import env from './env';
import { initDb } from './db';
import path from 'path';
import logger from './logger';
import { initAccountControllers } from './controllers/accountController';
import { initTemplateControllers } from './controllers/templateController';
import { initLiveQuizAdminControllers } from './controllers/liveQuizAdminController';
import { initLiveQuizControllers } from './controllers/liveQuizController';

const port = 3006;

const main = async () => {
  await initDb();

  const app = express();
  const router = express.Router();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
  });
  app.use(
    cookieSession({
      name: 'tivivia-session',
      secret: env.cookieSecret,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    })
  );
  app.use(
    withLogging({
      logLevel: env.logLevel,
    })
  );
  app.use('/res', express.static(path.resolve(__dirname, '../../res')));
  app.use(authSession);

  app.use('/', router);
  initAccountControllers(router);
  initTemplateControllers(router);
  initLiveQuizAdminControllers(router);
  initLiveQuizControllers(router);

  app.listen(port, () => {
    logger.info(`Example app listening on http://localhost:${port}`);
  });
};

main();
