import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api calls are forwarded to the Express backend.
export default defineConfig({
  plugins: [
    react({
      babel: {
        configFile: false,
        babelrc: false,
      },
    }),
  ],
  css: { postcss: {} },
  server: { host: true, port: 5173, proxy: { '/api': 'http://127.0.0.1:5001' } },
});
