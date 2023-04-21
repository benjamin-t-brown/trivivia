import { getSettingsFromLs } from 'utils';
import { init } from './routes';
import { getColors } from 'style';

async function main() {
  console.log('app loaded');
  const settings = getSettingsFromLs();
  if (settings.lightMode) {
    document.body.style.color = getColors().TEXT_DEFAULT;
  }

  init();
}

window.addEventListener('load', () => {
  main();
});
