import path from 'path';
import fs from 'fs';

export const SCRATCH_DIR = path.resolve(
  __dirname,
  '../',
  'test-results-output'
);

let ctr = 0;
export async function takeScreenshot(prefix = 'test', page) {
  await page.screenshot({ path: `${SCRATCH_DIR}/${prefix}${ctr++}.png` });
}

export async function saveHtml(prefix = 'test', page) {
  const html = await page.content();
  fs.writeFileSync(`${SCRATCH_DIR}/${prefix}.html`, html);
}

export function removeUnnecessaryWhitespace(text) {
  return text
    .split('\n')
    .map(n => n.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export async function saveText(prefix = 'test', page) {
  const text = await page.textContent('body');
  fs.writeFileSync(
    `${SCRATCH_DIR}/${prefix}.txt`,
    removeUnnecessaryWhitespace(text)
  );
}
