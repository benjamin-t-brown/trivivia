const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

function chromiumInstalled() {
  try {
    return fs.existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

if (chromiumInstalled()) {
  process.exit(0);
}

console.log('Playwright Chromium not found; installing...');

const playwrightCli = path.resolve(
  __dirname,
  '../node_modules/@playwright/test/cli.js'
);
const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium'], {
  stdio: 'inherit',
  cwd: __dirname,
});

process.exit(result.status ?? 1);
