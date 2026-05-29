// 版本號改變 → 自動清除所有舊快取
const CACHE_NAME = 'pyw-v3';
const BASE = '/peiniwan/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'girl-order-system.html',
  BASE + 'chat.html',
  BASE + 'rating.html',
  BASE + 'sos.html',
  BASE + 'payment.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

// 安裝：強制立刻接管，不等舊 SW 結束
self.addEventListener('install', event => {
  console.log('[SW v3] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // 立刻取代舊 SW
});

// 啟動：清除所有舊版快取
self.addEventListener('activate', event => {
  console.log('[SW v3] Activating, clearing old caches...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW v3] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim()) // 立刻接管所有分頁
  );
});

// Fetch：Network First（優先抓最新版，失敗才用快取）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // HTML 檔案永遠抓最新版，不用快取
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他資源（圖片等）用 Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
