/* This Indian Life — service worker.
   Bespoke, dependency-free (no Workbox) to match the site's minimal-deps,
   strict-CSP, self-hosted ethos. Everything it touches is same-origin.

   Strategy:
     • navigations (HTML) → network-first (fresh), fall back to cache, then /offline/
     • /_astro/* and /fonts/*  → cache-first  (content-addressed, immutable)
     • js / images / data      → stale-while-revalidate (instant, refresh in bg)
   Updates wait for the page to say SKIP_WAITING (see pwa.js) so we can show a
   "new version — refresh" toast instead of swapping under the user's feet. */

const VERSION = 'til-v1';
const SHELL = `shell-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_URL = '/offline/';

/* A tiny app-shell precached on install so the app opens even on a cold,
   offline launch. Per-URL adds (not addAll) so one 404 can't fail the install. */
const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/pwa.js',
  '/chart-kit.js',
  '/article-actions.js',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/dm-sans-300.woff2',
  '/fonts/dm-sans-400.woff2',
  '/fonts/cormorant-garamond-400.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  /* No skipWaiting() here — let the page drive the update (toast). */
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ---- strategies ---------------------------------------------------------- */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request);
  if (resp && resp.ok) cache.put(request, resp.clone());
  return resp;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((resp) => {
      if (resp && resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstNavigation(event) {
  const cache = await caches.open(PAGES);
  try {
    const preload = await event.preloadResponse;
    const resp = preload || (await fetch(event.request));
    if (resp && resp.ok) cache.put(event.request, resp.clone());
    return resp;
  } catch (err) {
    const cached = await cache.match(event.request);
    return (
      cached ||
      (await caches.match(OFFLINE_URL)) ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    );
  }
}

/* ---- router -------------------------------------------------------------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // only same-origin

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (/\.(?:js|css|png|jpe?g|webp|gif|svg|ico|json|csv)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
