import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';
import edgeone from './adapters/edgeone.js';

/**
 * RemixIcon ships five font formats through its stylesheet (eot/woff2/woff/ttf/svg).
 * This site only ever uses the woff2 it preloads from /fonts and selects it with a
 * forced `remixicon-preboot` face, so the eot/ttf/woff/svg copies are emitted by the
 * bundler but never requested by a browser (the service worker already skips them).
 * Drop those four legacy formats from the build output; the woff2 is kept as a
 * fallback, so this changes no markup, style, or runtime behaviour — only the set
 * of files written to the deploy artifact.
 */
function stripLegacyRemixiconFormats(): Plugin {
  return {
    name: 'strip-legacy-remixicon-formats',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/remixicon\.[^/]+\.(?:eot|ttf|woff|svg)$/.test(fileName)) {
          delete bundle[fileName];
        }
      }
    }
  };
}

// The default build targets Vercel exactly as before; `vite build --mode edgeone`
// selects the adapter EdgeOne Makers documents for SvelteKit (see edgeone.json and
// https://pages.edgeone.ai/document/framework-sveltekit).
export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: mode === 'edgeone' ? edgeone() : vercel({ runtime: 'nodejs24.x' })
    }),
    stripLegacyRemixiconFormats()
  ],
  build: {
    // Keep the CSS in its own cacheable chunk (already the default) and skip the
    // gzip size report so builds finish faster. Neither affects what ships.
    cssCodeSplit: true,
    reportCompressedSize: false
  },
  resolve: {
    alias: {
      '#lib': new URL('./src/lib', import.meta.url).pathname
    }
  }
}));
