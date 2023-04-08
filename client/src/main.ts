import { init } from './routes';

async function main() {
  console.log('app loaded');
  init();
}

window.addEventListener('load', () => {
  main();
});
