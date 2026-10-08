import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-vercel';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter({ runtime: 'nodejs24.x' })
    })
  ],
  resolve: {
    alias: {
      '#lib': new URL('./src/lib', import.meta.url).pathname
    }
  }
});
