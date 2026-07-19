/* 수지FC 라인업 생성기 - 서비스워커 (오프라인 지원) */
const CACHE = 'suji-fc-v52';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './xlsx.full.min.js',
  './firebase-app-compat.js', './firebase-auth-compat.js', './firebase-firestore-compat.js', './firebase-storage-compat.js', './firebase-config.js',
  './logo-mark.png', './profile-none.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 다른 도메인(예: Firebase/Firestore) 요청은 서비스워커가 건드리지 않음
  try { if (new URL(req.url).origin !== location.origin) return; } catch (_) { return; }

  // 페이지 요청: 네트워크 우선(최신 유지), 오프라인이면 캐시
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'reload' }).then(res => {   // 항상 최신 페이지 받기 (HTTP 캐시 우회)
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 그 외 자원: 캐시 우선, 없으면 네트워크(동일 출처는 런타임 캐싱)
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      try {
        if (new URL(req.url).origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
      } catch (_) {}
      return res;
    }).catch(() => hit))
  );
});
