import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    // Remote bindings need a Cloudflare login, so a fresh clone must run without them. The AI
    // draft then falls back to the plain form. `npm run dev:ai` turns the real model on.
    cloudflare({ remoteBindings: process.env.AI_REMOTE === '1' }),
  ],
});
