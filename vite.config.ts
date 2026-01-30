import 'dotenv/config';
import { defineConfig } from 'vite';

const PORT = process.env.PORT || 3000;

export default defineConfig({
  root: 'client',
  server: {
    proxy: {
      '/socket.io': {
        target: `http://localhost:${PORT}`,
        ws: true,
        changeOrigin: true,
      },
      '/admin-api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
      '/assets': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
      '/shared': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/client',
    rollupOptions: {
      input: {
        main: 'client/index.html',
        admin: 'client/admin.html',
      },
    },
  },
});
