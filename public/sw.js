const CACHE_NAME = "travel-alarm-v1";
const TRACKING_NOTIFICATION_TAG = "travel-alarm-tracking";

// Install - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/", "/favicon.ico", "/icon-192.png", "/icon-512.png"])
    )
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Handle messages from main thread
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  if (type === "SHOW_TRACKING_NOTIFICATION") {
    self.registration.showNotification("Travel Alarm - Tracking Active", {
      body: data.body || "Tracking your location...",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: TRACKING_NOTIFICATION_TAG,
      ongoing: true,
      requireInteraction: true,
      silent: true,
      data: { tripId: data.tripId },
    });
  }

  if (type === "UPDATE_TRACKING_NOTIFICATION") {
    self.registration.showNotification("Travel Alarm - Tracking Active", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: TRACKING_NOTIFICATION_TAG,
      ongoing: true,
      requireInteraction: true,
      silent: true,
      renotify: false,
      data: { tripId: data.tripId },
    });
  }

  if (type === "TRIGGER_ALARM_NOTIFICATION") {
    self.registration.showNotification("Travel Alarm", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "travel-alarm-alert-" + Date.now(),
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      data: { tripId: data.tripId },
    });
  }

  if (type === "CLEAR_TRACKING_NOTIFICATION") {
    self.registration.getNotifications({ tag: TRACKING_NOTIFICATION_TAG }).then(
      (notifications) => notifications.forEach((n) => n.close())
    );
  }
});

// Notification click - open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tripId = event.notification.data?.tripId;
  const url = tripId ? `/trip/${tripId}` : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/trip/") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
