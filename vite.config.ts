import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      watch: {
        ignored: [
          '**/*.db',
          '**/*.db-journal',
          '**/*.db-wal',
          '**/*.db-shm',
          '**/prisma/**',
          '**/data/**',
          '**/dev.db*',
          '**/*.sqlite*',
          '**/*.json',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  };
});
