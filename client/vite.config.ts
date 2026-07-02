import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { buildSrcAliases } from './build-aliases';

function customHmr(): Plugin {
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

const srcDir = path.resolve(__dirname, 'src');
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig(({ command }) => {
  const isProd = command !== 'serve';

  return {
    plugins: [react(), customHmr()],
    resolve: {
      alias: buildSrcAliases(srcDir),
    },
    root: '.',
    base: '/',
    publicDir: path.resolve(repoRoot, 'res'),
    build: {
      outDir: path.join(repoRoot, 'dist'),
      assetsDir: 'release',
      cssCodeSplit: false,
      ...(isProd
        ? {
            rolldownOptions: {
              output: {
                minify: {
                  compress: {
                    dropConsole: true,
                    dropDebugger: true,
                  },
                },
              },
            },
          }
        : {}),
    },
    server: {
      port: 3005,
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
});
