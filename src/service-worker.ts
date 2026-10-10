/// <reference types="@sveltejs/kit" />
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

// The worker runs outside the window typings, so describe the slice of the
// service worker scope that this file actually uses.
type ExtendableEvent = Event & { waitUntil(promise: Promise<unknown>): void };
type FetchEventLike = ExtendableEvent & {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
};
type WorkerScope = {
  addEventListener(type: 'install' | 'activate', handler: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'fetch', handler: (event: FetchEventLike) => void): void;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
};

const worker = self as unknown as WorkerScope;

// One cache per deploy: a new build gets a new name and the old one is dropped.
const CACHE = `xiaozhe-${version}`;
/** Served from the cache, so a page opened offline is still a page. */
const OFFLINE_URL = '/offline';
/**
 * Hashed build output plus the small static shell. Pictures are left out: they
 * are fetched on demand and refreshed in the background, so the install stays
 * small no matter how much the blog grows.
 */
/* The bundler emits every RemixIcon format for the upstream @font-face rules,
   but the site serves the woff2 it preloads itself. Pulling the eot, ttf, woff
   and svg copies along would add megabytes to an install that must finish fast. */
const LEGACY_FONT = /\/_app\/immutable\/assets\/remixicon\.[^/]+\.(eot|ttf|woff|svg)$/;

const absolute = (path: string) => (path.startsWith('/') ? path : '/' + path);
const PRECACHE = [
  ...new Set([
    ...immutable.map((entry) => absolute(entry.path)),
    ...assets.map((entry) => absolute(entry.path)).filter((path) => !path.startsWith('/images/') && !LEGACY_FONT.test(path)),
    OFFLINE_URL
  ])
];
const RUNTIME_MEDIA = ['/images/', '/fonts/', '/icons/'];

worker.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Added one at a time, and each failure tolerated: a burst of parallel
      // requests can drop entries on a busy origin, and a single unreachable
      // entry must not sink the whole install either.
      for (const url of PRECACHE) {
        await cache.add(url).catch(() => undefined);
      }
      await worker.skipWaiting();
    })()
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await worker.clients.claim();
    })()
  );
});

async function fromCache(request: Request, fallback: string): Promise<Response> {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  return (await caches.match(fallback)) ?? Response.error();
}

worker.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Cross-origin requests and every API call stay on the live network.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    // Pages: the network wins while it answers, the cached shell when it does not.
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return fromCache(request, OFFLINE_URL);
        }
      })()
    );
    return;
  }

  if (PRECACHE.includes(url.pathname)) {
    // Build assets are content-hashed, so the cached copy is always the right
    // one. A miss - a deploy that landed before the worker updated - falls
    // through to the network rather than failing the request: handing a
    // stylesheet or a script an error response leaves a blank, unstyled page.
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        return cached ?? fetch(request);
      })()
    );
    return;
  }

  if (RUNTIME_MEDIA.some((prefix) => url.pathname.startsWith(prefix))) {
    // Media: answer from the cache, refresh it in the background.
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request, { ignoreSearch: true });
        const network = fetch(request)
          .then((response) => {
            if (response.ok) void cache.put(request, response.clone());
            return response;
          })
          .catch(() => undefined);
        return cached ?? (await network) ?? fetch(request);
      })()
    );
  }
});
