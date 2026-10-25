// Trade Desk service worker (home-screen web app). The app shell is served from the cache and refreshed in the
// background; the news cache and the morning brief are fetched fresh and fall back to the last copy offline.
// tools/publish-pages.py stamps VERSION with the source commit, so every publish refreshes the cache.
const VERSION='td-0e4fef8';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(url.origin!==location.origin||e.request.method!=='GET')return;
 if(/\.json$/.test(url.pathname)){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(m=>m||new Response('',{status:504}))));
  return;}
 e.respondWith(caches.match(e.request).then(cached=>{
  const fresh=fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(()=>cached);
  return cached||fresh;}));
});
