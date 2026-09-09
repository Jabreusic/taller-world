// Marcador de publicación: al cambiarlo, las instalaciones reciben un cache nuevo.
const CACHE_VERSION = 'tallerworld-v0.1.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/app-meta.js',
  './css/styles.css',
  './css/layout-shell.css',
  './css/app-shell.css',
  './css/mobile-shell.css',
  './css/modules/xp-hud.css',
  './css/modules/oficina-cards.css',
  './css/modules/barra-estado.css',
  './js/storage.js',
  './js/data/team-data.js',
  './js/data/narrative-data.js',
  './js/data/client-data.js',
  './js/data/economy-data.js',
  './js/data/custom-content.js',
  './js/data/turn-costs.js',
  './js/data/expansion-data.js',
  './js/state.js',
  './js/analytics/events.js',
  './js/analytics/player-profile.js',
  './js/analytics/narrative-director.js',
  './js/onboarding.js',
  './js/modules/clients-history.js',
  './js/modules/team-parts.js',
  './js/modules/progression.js',
  './js/screens/screen-taller.js',
  './js/screens/screen-oficina.js',
  './js/screens/screen-exterior.js',
  './js/screens/screen-mapa.js',
  './js/screens/screen-telefono.js',
  './js/screens/screen-configuracion.js',
  './js/screens/loader.js',
  './js/turns.js',
  './js/audio.js',
  './js/audio-sfx.js',
  './js/minigames/rhythm-dx.js',
  './js/ui.js',
  './js/clients.js',
  './js/team.js',
  './js/game.js',
  './js/pwa.js',
  './js/character-creator.js',
  './js/ui/toolbar/toolbar-casos.js',
  './js/ui/xp-hud.js',
  './audio/main/taller-world-theme.mp3.mp3',
  './audio/sfx/ui/assign.wav',
  './img/bg/taller/3.png',
  './img/bg/oficina/oficina.png',
  './img/bg/exterior/exterior.jpg',
  './img/boss/boss.png',
  './img/icon/icon-192.png',
  './img/icon/icon-512.png',
  './img/icon/icon-180.png',
  './img/icon/icon.png'
];

function shouldBypassRequest(req) {
  return req.cache === 'only-if-cached' && req.mode !== 'same-origin';
}

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(req, res.clone());
    }
    return res;
  } catch (_err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      return caches.match('./index.html');
    }
    throw _err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req)
    .then(async (res) => {
      if (res && res.status === 200) {
        const cache = await caches.open(cacheName);
        await cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || shouldBypassRequest(req)) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/service-worker.js')) {
    return;
  }

  const destination = req.destination || '';
  const isHtmlLike = req.mode === 'navigate' || destination === 'document';
  const isCodeAsset = destination === 'script' || destination === 'style' || destination === 'worker';
  const isMediaAsset = destination === 'image' || destination === 'font' || destination === 'audio' || destination === 'video';

  if (isHtmlLike) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  if (isCodeAsset) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  if (isMediaAsset) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  event.respondWith(networkFirst(req, RUNTIME_CACHE));
});

self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Taller World',
    body: 'Hay novedades en el taller.',
    icon: './img/icon/icon-192.png',
    badge: './img/icon/icon-192.png',
    data: { url: './' }
  };

  let payload = fallback;
  try {
    if (event && event.data) {
      const raw = event.data.json();
      payload = {
        ...fallback,
        ...(raw || {})
      };
    }
  } catch (_err) {
    payload = fallback;
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Taller World', payload));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url && client.url.indexOf(self.location.origin) === 0) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
