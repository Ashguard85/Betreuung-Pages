const APP_VERSION = "61";
const VERSION = `betreuung-pages-v${APP_VERSION}`;
const SHELL_CACHE = `${VERSION}-shell`;
const CACHE_PREFIX = "betreuung-pages-v";
const INDEX_URL = "./index.html";

const ESSENTIAL_SHELL = [
  "./index.html",
  "./app.css?v=61",
  "./app.js?v=61",
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
  // v43-v46 could keep the installed Home-Screen PWA on an old cache-first shell
  // indefinitely on iOS. v46 activates itself once when migrating from those
  // versions. It still does NOT claim or reload the currently open client.
  return keys.some(key => /^betreuung-pages-v(?:43|44|45|46)-shell$/.test(key));
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
    // Only the real app entry point may fall back to index.html.
    // A direct navigation to service-worker.js, manifest.webmanifest, icons, etc.
    // must stay a normal network request instead of being rewritten to the app shell.
    const scopeUrl = new URL(self.registration.scope);
    const scopePath = scopeUrl.pathname.endsWith("/") ? scopeUrl.pathname : `${scopeUrl.pathname}/`;
    const relativePath = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : null;
    const isAppEntry = relativePath === "" || relativePath === "index.html";
    if (!isAppEntry) return;

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


const NOTIFICATION_ICON = new URL("./icon-192.png", self.registration.scope).href;

async function applyWorkerBadge(count){
  const n=Math.max(0,Number(count)||0);
  try{
    if(n>0 && navigator.setAppBadge) await navigator.setAppBadge(n);
    else if(n===0 && navigator.clearAppBadge) await navigator.clearAppBadge();
  }catch(_e){}
}

self.addEventListener("push", event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?event.data.json():{};}catch(_e){try{data={body:event.data?.text?.()||""};}catch(__e){data={};}}
    const count=Math.max(0,Number(data.unread_count)||0);
    await applyWorkerBadge(count);
    const tag=data.type==="test"?"betreuungsplan-test":"betreuungsplan-changes";
    await self.registration.showNotification(data.title||"Betreuungsplan",{
      body:data.body||"Der Betreuungsplan wurde geändert.",
      icon:NOTIFICATION_ICON,
      tag,
      renotify:true,
      data:{url:data.url||"?changes=1",type:data.type||"changes",unread_count:count}
    });
    for(const client of await self.clients.matchAll({type:"window",includeUncontrolled:true})){
      client.postMessage({type:"PUSH_CHANGES",unread_count:count});
    }
  })());
});

self.addEventListener("notificationclick", event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const target=new URL(event.notification.data?.url||"?changes=1",self.registration.scope).href;
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin===new URL(self.registration.scope).origin){
        client.postMessage({type:"OPEN_CHANGES"});
        if("focus" in client) return client.focus();
      }
    }
    if(self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
