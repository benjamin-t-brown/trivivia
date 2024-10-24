import { defineConfig, devices } from '@playwright/test';

const CI_URL = 'http://127.0.0.1:3005/';
const LOCAL_URL = 'http://127.0.0.1:3005/';

export default defineConfig({
  testDir: 'gwd',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.CI ? CI_URL : LOCAL_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: '(cd ../ && yarn start)',
        url: CI_URL,
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
});
