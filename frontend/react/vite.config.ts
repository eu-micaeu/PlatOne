import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const allowedHosts = ['localhost', '127.0.0.1', 'platone.xyz'];

  if (env.APP_BASE_URL) {
    try {
      const appBaseHost = new URL(env.APP_BASE_URL).hostname;
      if (appBaseHost && !allowedHosts.includes(appBaseHost)) {
        allowedHosts.push(appBaseHost);
      }
    } catch {
      // Ignore invalid APP_BASE_URL here; runtime validation happens in server.ts
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts,
    },
  };
});
