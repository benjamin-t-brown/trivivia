import express from 'express';
import http from 'http';
import path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs';

const port = 8772;

type POST_COMMANDS = 'START_SCAN' | 'PING_SCAN' | 'SAVE_ROUND' | 'PING_SAVE';

const execAsync = async (
  command: string,
  stdOutArr: string[],
  stdErrArr: string[]
) => {
  return new Promise<void>(resolve => {
    console.log(command);

    const cmd = exec(command);

    cmd.stdout?.on('data', function (data) {
      stdOutArr.push(data.toString());
      console.log('stdout', data);
    });
    cmd.stderr?.on('data', function (data) {
      stdErrArr.push(data.toString());
      console.log('stderr', data);
    });
    cmd.on('exit', function (code) {
      resolve();
    });
  });
};

const STATE = {
  scanning: false,
  scanOutput: [] as string[],
  scanResults: [] as string[],
  saving: false,
  saveOutput: [] as string[],
  saveResults: [] as string[],
};

const TEST_RESULTS_OUTPUT = path.resolve(
  __dirname,
  '../../../test-browser',
  'test-results-output'
);
const SCAN_RESULTS_OUTPUT = `${TEST_RESULTS_OUTPUT}/active-quiz-urls.json`;

const startScan = async (state: typeof STATE) => {
  console.log('starting scan');
  state.scanning = true;
  state.scanOutput = [];

  console.log('Attempting to start scanning');
  const pathToTld = path.resolve(__dirname, '../../../');
  await execAsync(
    `cd ${pathToTld} && npx playwright test test-browser/gwd/scan.test.js --config=playwright.config.js`,
    state.scanOutput,
    state.scanOutput
  );

  state.scanning = false;
  state.scanResults = JSON.parse(
    fs.readFileSync(SCAN_RESULTS_OUTPUT, 'utf8').toString()
  );
};

const startSave = async (
  state: typeof STATE,
  args: { quizName: string; roundNumber: number; quizUrl: string }
) => {
  console.log('starting save');
  state.saving = true;
  state.saveOutput = [];
  const pathToScratch = path.resolve(__dirname, '../../');

  await execAsync(
    `cd ${pathToScratch} && npx tsx grab-round-e2e.ts ${args.quizName} ${args.roundNumber} ${args.quizUrl}`,
    state.saveOutput,
    state.saveOutput
  );

  state.saving = false;
  state.saveResults = ['done'];
};

const main = async () => {
  const app = express();
  const router = express.Router();
  const server = http.createServer(app);
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/', router);

  router.post('/api/action', async (req, res) => {
    switch (req.body.action) {
      case 'START_SCAN': {
        if (STATE.scanning) {
          res.send(
            JSON.stringify({ status: 'SCANNING', scanOutput: STATE.scanOutput })
          );
          return;
        }
        startScan(STATE);
        res.send(JSON.stringify({ status: 'STARTED' }));
        break;
      }
      case 'PING_SCAN': {
        if (STATE.scanning) {
          res.send(
            JSON.stringify({ status: 'SCANNING', scanOutput: STATE.scanOutput })
          );
          return;
        }
        if (STATE.scanResults?.length) {
          res.send(
            JSON.stringify({
              status: 'SCAN_COMPLETE',
              scanOutput: STATE.scanOutput,
              scanResults: STATE.scanResults,
            })
          );
          return;
        }
        res.send(JSON.stringify({ status: 'NOT_STARTED' }));
        break;
      }
      case 'SAVE_ROUND': {
        if (STATE.saving) {
          res.send(
            JSON.stringify({ status: 'SAVING', saveOutput: STATE.saveOutput })
          );
          return;
        }
        startSave(STATE, req.body.payload);
        res.send(JSON.stringify({ status: 'STARTED' }));
        break;
      }
      case 'PING_SAVE': {
        if (STATE.saving) {
          res.send(
            JSON.stringify({ status: 'SAVING', saveOutput: STATE.saveOutput })
          );
          return;
        }
        if (STATE.saveResults?.length) {
          res.send(
            JSON.stringify({
              status: 'SAVE_COMPLETE',
              saveOutput: STATE.saveOutput,
              saveResults: STATE.saveResults,
            })
          );
          return;
        }
        res.send(JSON.stringify({ status: 'NOT_STARTED' }));
        break;
      }
    }
  });

  router.use('/index.mjs', (req, res) => {
    res.header('Content-Type', 'application/javascript');
    res.sendFile(path.resolve(__dirname, './index.mjs'));
  });
  router.use('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, './index.html'));
  });

  server.listen(port, () => {
    console.info(`App listening on http://localhost:${port}`);
  });
};
main();
