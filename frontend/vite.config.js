import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Force relative paths for Electron file:// URLs
  server: {
    port: 3000,
    open: true,
  },
});
