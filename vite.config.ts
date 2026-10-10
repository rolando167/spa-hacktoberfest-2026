import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Con `npm run dev` funciona solo el front (VITE_USE_MOCKS=true).
// Con `npm run dev:netlify` (netlify dev) se sirven también las funciones en /api.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
