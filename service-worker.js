// v4 — 完全停用快取，每次都抓最新
const CACHE_NAME = 'pyw-v4';

self.addEventListener('install', event => {
  console.log('[SW v4] Install');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW v4] Activate — clearing ALL caches');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 完全不用快取，每次都從網路抓
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() =>
      new Response('離線中，請連接網路', { status: 503 })
    )
  );
});
