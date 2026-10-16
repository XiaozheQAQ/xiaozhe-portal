import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';
import edgeone from './adapters/edgeone.js';

// The default build targets Vercel exactly as before; `vite build --mode edgeone`
// selects the adapter EdgeOne Makers documents for SvelteKit (see edgeone.json and
// https://pages.edgeone.ai/document/framework-sveltekit).
export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: mode === 'edgeone' ? edgeone() : vercel({ runtime: 'nodejs24.x' })
    })
  ],
  resolve: {
    alias: {
      '#lib': new URL('./src/lib', import.meta.url).pathname
    }
  }
}));
