// import fetch from 'node-fetch';
// const site = fetch('https://play.geekswhodrink.com/');

// const main = async () => {
//   fetch(site);
// };
// main();
import { test } from '@playwright/test';

test('Page Screenshot', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.screenshot({ path: `example.png` });
});
