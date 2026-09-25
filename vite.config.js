import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
  // Single source of truth for the version shown in the UI footer — bump it
  // only in package.json, nowhere else.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
