// Trade Desk service worker (home-screen web app). The app shell is served from the cache and refreshed in the
// background (the page itself is fetched fresh when online); the news cache and the morning brief are fetched fresh and fall back to the last copy offline.
// tools/publish-pages.py stamps VERSION with the source commit, so every publish refreshes the cache.
const VERSION='td-acc8f67';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(url.origin!==location.origin||e.request.method!=='GET')return;
 if(/\.json$/.test(url.pathname)){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(m=>m||new Response('',{status:504}))));
  return;}
 // The app page itself: newest copy from the network when online (so an update shows on the very next open),
 // the saved copy when offline or the network is slower than 4 seconds.
 if(e.request.mode==='navigate'||/\/(index\.html)?$/.test(url.pathname)){
  e.respondWith((async()=>{const cache=await caches.open(VERSION);
   const net=fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok)cache.put(e.request,r.clone());return r;});
   const timer=new Promise(res=>setTimeout(()=>res(null),4000));
   try{const r=await Promise.race([net,timer]);if(r)return r;}catch{}
   return (await cache.match(e.request))||(await cache.match('./index.html'))||net;})());
  return;}
 e.respondWith(caches.match(e.request).then(cached=>{
  const fresh=fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(()=>cached);
  return cached||fresh;}));
});
