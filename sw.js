/* Meu PDV: guarda o app no aparelho para abrir sem internet. */
const PREFIX = 'meu-pdv-';
const CACHE = PREFIX + 'v4';
const CORE = ['./', 'index.html', 'jsQR.js', 'firebase-config.js', 'firebase-bundle.js', 'logo.png', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const okHost = url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!okHost) return;
  if (url.origin === self.location.origin && /firebase-config\.js$/.test(url.pathname)) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || new Response('window.FIREBASE_CONFIG = null;', { headers: { 'content-type': 'text/javascript' } }))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || (await cache.match('./'));
    return new Response('', { status: 504 });
  }));
});
