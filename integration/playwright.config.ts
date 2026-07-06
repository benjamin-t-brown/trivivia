import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');
const useDocker = process.env.INTEGRATION_DOCKER === 'true';
const skipWebServer = process.env.INTEGRATION_SKIP_WEBSERVER === 'true';
const integrationPort =
  process.env.INTEGRATION_PORT || (useDocker ? '3006' : '3005');
const baseURL =
  process.env.INTEGRATION_BASE_URL || `http://127.0.0.1:${integrationPort}`;
const integrationImage =
  process.env.INTEGRATION_IMAGE || 'revirtualis/trivivia:latest';

const localWebServer = {
  command: 'yarn start',
  cwd: repoRoot,
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
  timeout: 120_000,
  env: {
    ...process.env,
    INTEGRATION_TEST: 'true',
  },
};

const dockerWebServer = {
  command:
    process.env.INTEGRATION_DOCKER_COMMAND ||
    `docker run --rm -p ${integrationPort}:3006 -e INTEGRATION_TEST=true -e NODE_ENV=production ${integrationImage}`,
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
  timeout: 180_000,
};

const webServerConfig = skipWebServer
  ? undefined
  : useDocker
    ? dockerWebServer
    : localWebServer;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: webServerConfig,
});
