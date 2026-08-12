"use strict";

const CACHE_VERSION = "j-live-pwa-v45";
const APP_SHELL = [
  "/calendar/",
  "/calendar/index.html",
  "/calendar/offline.html",
  "/calendar/styles.css?v=20260813day",
  "/calendar/site-config.js?v=20260808ea",
  "/calendar/site.js",
  "/calendar/analytics.js",
  "/calendar/favorites.js",
  "/calendar/attendance.js?v=20260813",
  "/calendar/alerts.js",
  "/calendar/email-alerts.js?v=20260811ret",
  "/calendar/app.js?v=20260813day",
  "/calendar/content.js",
  "/calendar/event.js",
  "/calendar/data/events.json",
  "/calendar/data/artist-aliases.json",
  "/calendar/data/updates.json",
  "/calendar/artists/index.html",
  "/calendar/fanclubs/index.html",
  "/calendar/fanclubs/fanclubs.js",
  "/calendar/updates.html",
  "/calendar/weekly/index.html",
  "/calendar/assets/brand/j-live-app-logo.png",
  "/calendar/about.html",
  "/calendar/contact.html",
  "/calendar/corrections.html",
  "/calendar/privacy.html",
  "/calendar/terms.html",
  "/calendar/guides/venues.html",
  "/calendar/guides/verification.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { payload = { body: event.data?.text() || "" }; }
  event.waitUntil(self.registration.showNotification(payload.title || "J-LIVE 예매 알림", {
    body: payload.body || "저장한 공연에 새로운 일정이 있습니다.",
    icon: "/calendar/assets/brand/j-live-app-logo.png",
    badge: "/calendar/assets/brand/j-live-app-logo.png",
    data: { url: payload.url || "/calendar/" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/calendar/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => "focus" in client);
    return existing ? existing.navigate(url).then(client => client.focus()) : clients.openWindow(url);
  }));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith("/calendar/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match("/calendar/offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
