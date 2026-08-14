const APP_VERSION = "46";
const VERSION = `betreuung-pages-v${APP_VERSION}`;
const SHELL_CACHE = `${VERSION}-shell`;
const CACHE_PREFIX = "betreuung-pages-v";
const INDEX_URL = "./index.html";

const ESSENTIAL_SHELL = [
  "./index.html",
  "./app.css?v=46",
  "./app.js?v=46",
  "./manifest.webmanifest"
];

const OPTIONAL_SHELL = [
  "./favicon-v17.png",
  "./apple-touch-icon-v17.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon.svg",
  "./offline.html"
];

async function fetchFresh(url) {
  const response = await fetch(url, {cache: "reload", credentials: "same-origin"});
  if (!response.ok) throw new Error(`Precache failed: ${url} (${response.status})`);
  return response;
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  // Essential files are atomic: if one is missing, keep the old worker active.
  for (const url of ESSENTIAL_SHELL) {
    const response = await fetchFresh(url);
    await cache.put(url, response);
  }
  // Icons/offline page are useful but must not make an otherwise valid update fail.
  for (const url of OPTIONAL_SHELL) {
    try {
      const response = await fetchFresh(url);
      await cache.put(url, response);
    } catch (error) {
      console.warn("Optional PWA asset could not be cached", url, error);
    }
  }
}

async function needsOneTimeCacheRecovery(){
  const keys=await caches.keys();
  // v43-v45 could keep the installed Home-Screen PWA on an old cache-first shell
  // indefinitely on iOS. v46 activates itself once when migrating from those
  // versions. It still does NOT claim or reload the currently open client.
  return keys.some(key => /^betreuung-pages-v(?:43|44|45)-shell$/.test(key));
}

self.addEventListener("install", event => {
  event.waitUntil((async()=>{
    await precacheShell();
    if(await needsOneTimeCacheRecovery()) await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE) await caches.delete(key);
    }
    // Deliberately no clients.claim(): open clients switch only on a safe reload/restart.
  })());
});

self.addEventListener("message", event => {
  const data = event.data || {};
  if (data.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({version: APP_VERSION});
    return;
  }
  // Old versions used a generic SKIP_WAITING message. Ignore that message so the
  // first migration to v43/v44 is safe as well. Only an explicit user action may activate.
  if (data.type === "ACTIVATE_UPDATE" && data.userInitiated === true) {
    self.skipWaiting();
  }
});

async function cachedShellResponse() {
  const cache = await caches.open(SHELL_CACHE);
  return (await cache.match(INDEX_URL)) || (await cache.match("./"));
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      // Cache-first navigation keeps one coherent frontend version alive even when
      // GitHub Pages is temporarily unavailable.
      const shell = await cachedShellResponse();
      if (shell) return shell;
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(INDEX_URL, response.clone());
        }
        return response;
      } catch (_error) {
        return (await caches.match("./offline.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (_error) {
      return Response.error();
    }
  })());
});
