import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import path from 'path';

function CustomHmr() {
  return {
    name: 'custom-hmr',
    enforce: 'post',
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

export default defineConfig((({ command }) => {
  const rootPath = '../';

  const isProd = command !== 'serve';

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
    esbuild: isProd
      ? {
          drop: ['console', 'debugger'],
        }
      : undefined,
    server: {
      port: '3005',
      host: '0.0.0.0',
      open: '/',
      proxy: {
        '^/api/.*': 'http://localhost:3006/',
        '^/res/.*': 'http://localhost:3006/',
        '^/socket.io/.*': 'http://localhost:3006/',
        '/ws': {
          target: 'ws://localhost:3006',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
  return config;
}) as any);
