import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
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
import http from 'http';
import { Server } from 'socket.io';
import { ioSession, setupIo } from './middlewares/ioSessionMemory';
import compression from 'compression';
import { initStaticQuizController } from './controllers/staticQuizController';

const port = 3006;

const main = async () => {
  await initDb();

  const app = express();
  const router = express.Router();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET'],
    },
  });

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  app.use(cors());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    (req as any).io = io;
    next();
  });
  app.use(
    cookieSession({
      name: 'trivivia-session',
      secret: env.cookieSecret,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }) as any
  );
  app.use(
    withLogging({
      logLevel: env.logLevel,
    })
  );
  app.use('/res', express.static(path.resolve(__dirname, '../../res')));
  app.use('/index.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/dist/index.html'));
  });
  app.use('/release/:fileName', (req, res) => {
    res.sendFile(
      path.resolve(
        __dirname,
        '../../client/dist/release/' + req.params.fileName
      )
    );
  });
  app.use(ioSession);
  app.use(authSession);

  app.use('/', router);
  initAccountControllers(router);
  initTemplateControllers(router);
  initLiveQuizAdminControllers(router);
  initLiveQuizControllers(router);
  initStaticQuizController(router);

  router.use('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/dist/index.html'));
  });

  setupIo(io);

  server.listen(port, () => {
    logger.info(`Example app listening on http://localhost:${port}`);
  });
};

main();
