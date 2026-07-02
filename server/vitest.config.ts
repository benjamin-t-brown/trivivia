import { defineConfig } from 'vitest/config';
import path from 'path';

import GithubActionsReporter from 'vitest-github-actions-reporter';
import { buildSrcAliases } from './build-aliases';

const srcDir = path.resolve(__dirname, 'src');

export default defineConfig({
  resolve: {
    alias: buildSrcAliases(srcDir),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['test/setup.ts'],
    env: { VITEST: 'true' },
    reporters: process.env.GITHUB_ACTIONS
      ? new GithubActionsReporter()
      : 'default',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      exclude: ['test/*'],
      thresholds: {
        statements: 45,
        branches: 30,
        functions: 45,
        lines: 45,
      },
    },
  },
  directory: 'test',
  root: '.',
});
