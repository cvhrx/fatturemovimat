
const CACHE='spese-cache-v28';
const ASSETS=['./','./index.html','./style.css?v=28','./app.js?v=28','./manifest.webmanifest?v=28','./icon-192.png','./icon-512.png','./movimat.png','./favicon.ico'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))) .then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
self.addEventListener('message',e=>{ if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting(); });
