import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// `--mode mvp` builds the MVP scope (one board, data in to audit) into dist/mvp, served at /mvp/
// beside the full demo. Same source; the scope is set here, not in an .env file.
export default defineConfig(({ mode }) => {
  if (mode === 'mvp') process.env.VITE_ORBIT_SCOPE = 'mvp';
  return {
  base: mode === 'mvp' ? '/mvp/' : '/',
  publicDir: mode === 'mvp' ? false : 'public',
  build: mode === 'mvp' ? { outDir: 'dist/mvp', emptyOutDir: true } : {},
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
  };
});
