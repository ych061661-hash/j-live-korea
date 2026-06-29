"use strict";

const CACHE_VERSION = "j-live-pwa-v2";
const APP_SHELL = [
  "/calendar/",
  "/calendar/index.html",
  "/calendar/offline.html",
  "/calendar/styles.css",
  "/calendar/site-config.js",
  "/calendar/site.js",
  "/calendar/app.js",
  "/calendar/content.js",
  "/calendar/event.js",
  "/calendar/data/events.json",
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
