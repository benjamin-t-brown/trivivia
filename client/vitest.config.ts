import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

import GithubActionsReporter from 'vitest-github-actions-reporter';
import { buildSrcAliases } from './build-aliases';

const srcDir = path.resolve(__dirname, 'src');

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: buildSrcAliases(srcDir),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['test/setup.ts'],
    reporters: process.env.GITHUB_ACTIONS
      ? new GithubActionsReporter()
      : 'default',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      exclude: ['test/*', 'res/*'],
    },
  },
  directory: 'test',
  root: '.',
});
