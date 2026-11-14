/* لمّة — يخلّي اللعبة تفتح من غير نت، ويجيب آخر نسخة لما النت يبقى موجود، ويستقبل الإشعارات */
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({"apiKey": "AIzaSyAvNndToSDPfGr7cGkD8zMZGWEm103k8JE", "authDomain": "lamma-game-5e684.firebaseapp.com", "projectId": "lamma-game-5e684", "storageBucket": "lamma-game-5e684.firebasestorage.app", "messagingSenderId": "509367066975", "appId": "1:509367066975:web:25f2152cbe92f83de956ea"});
  firebase.messaging();
} catch (e) { /* من غير نت أول مرة: الإشعارات تشتغل المرة الجاية */ }
const VERSION = 'lamma-v5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => keep('./index.html', r)).catch(() => caches.match('./index.html')));
    return;
  }
  // ملفات فايربيز اتخزّنت من أول مرة، فاللي بعدها بتفتح من غير تحميل
  const cacheable = url.origin === location.origin || url.hostname === 'fonts.googleapis.com'
    || url.hostname === 'fonts.gstatic.com' || (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0);
  if (cacheable) {
    e.respondWith(caches.match(req).then(hit => {
      if (hit && url.hostname === 'www.gstatic.com') return hit;   // نسخة مثبّتة، مفيش داعي نسأل الشبكة
      const net = fetch(req).then(r => keep(req, r)).catch(() => hit);
      return hit || net;
    }));
  }
});
