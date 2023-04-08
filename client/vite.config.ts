import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import path from 'path';

function CustomHmr() {
  return {
    name: 'custom-hmr',
    enforce: 'post',
    // HMR
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.json')) {
        console.log('reloading json file...');

        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    },
  };
}

// @ts-ignore
export default defineConfig((...args) => {
  const rootPath = '../';

  const config = {
    plugins: [
      react(),
      tsconfigPaths({
        projects: [rootPath + 'tsconfig.vite.json'],
      }),
      CustomHmr(),
    ],
    root: '.',
    base: '/',
    publicDir: path.resolve(__dirname, '/../res/'),
    build: {
      outDir: rootPath + 'dist',
      assetsDir: 'release',
      cssCodeSplit: false,
    },
    server: {
      port: '3005',
      host: '0.0.0.0',
      // open: '/',
      proxy: {
        '^/api/.*': 'http://localhost:3006/',
        '^/res/.*': 'http://localhost:3006/',
      },
    },
  };
  return config;
});
