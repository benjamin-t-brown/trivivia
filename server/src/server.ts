import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import logger from './logger';
import { initDb } from './db';
import { configureApp } from './app';
import { setupIo } from './middlewares/ioSessionMemory';

const port = 3006;

const main = async () => {
  await initDb();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET'],
    },
  });

  configureApp(app, io);
  setupIo(io);

  server.listen(port, () => {
    logger.info(`App listening on http://localhost:${port}`);
  });
};

main();
