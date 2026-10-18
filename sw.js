/* =============================================================================
 * Service worker — makes the app work offline.
 *
 * WHAT A SERVICE WORKER IS
 *   A script the browser runs in the background, separate from the page. It
 *   sits between the page and the network: every request the page makes
 *   passes through the "fetch" handler below, which can answer from a cache
 *   instead of the network. That is what lets the app open with no signal.
 *
 * LIFECYCLE
 *   install  -> runs once when the browser first sees this file (or a changed
 *               version of it). We download and cache the app shell here.
 *   activate -> runs when the new worker takes over. We delete old caches.
 *   fetch    -> runs for every request from then on.
 *
 * IMPORTANT
 *   The browser only re-installs when the BYTES of this file change. So after
 *   editing index.html, style.css or app.js, bump CACHE_VERSION below. That
 *   changes this file, triggers a fresh install, and the activate step throws
 *   away the old cache. Forget this and installed copies keep the old files.
 *
 * Service workers only run on https:// or localhost. Over plain http on a
 * phone this file is never registered, which is fine; the app just won't
 * work offline there.
 * ========================================================================== */

// Name of the cache. Bump the number whenever any file in APP_SHELL changes.
const CACHE_VERSION = 'statblocks-v60';

// The files needed to draw the app with no network at all.
// './' is the folder itself, which servers map to index.html.
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './reference.js',
    './samples.js',
    './manifest.json',
    './icon.svg',
];

/* INSTALL: download every file in APP_SHELL into the cache.
 * event.waitUntil() tells the browser "don't consider me installed until this
 * promise finishes". If any file fails to download, the install fails and the
 * old worker (if any) keeps running. */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(APP_SHELL))
            // Normally a new worker waits until every tab is closed before
            // taking over. skipWaiting() makes it take over immediately.
            .then(() => self.skipWaiting())
    );
});

/* ACTIVATE: remove caches from previous versions so they don't pile up. */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
            ))
            // Start controlling already-open pages right away instead of
            // waiting for their next reload.
            .then(() => self.clients.claim())
    );
});

/* FETCH: decide how to answer each request.
 *
 * Strategy: "cache first, then network, and refresh the cache in the
 * background". Steps for each request:
 *   1. Look in the cache. If found, answer with that immediately (fast, offline-safe).
 *   2. Also start a network fetch. If it succeeds, store the fresh copy so the
 *      NEXT load gets the newer file.
 *   3. If nothing was cached, wait for the network. If the network fails too,
 *      fall back to whatever was cached (undefined here, so the request errors).
 *
 * Only same-origin GET requests are handled; anything else (other sites,
 * POSTs) is ignored and goes straight to the network as usual. */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        // A Response body can only be read once, so clone it:
                        // one copy goes to the cache, the original to the page.
                        const copy = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);   // offline: use the cached copy, if any

            return cached || network;
        })
    );
});
