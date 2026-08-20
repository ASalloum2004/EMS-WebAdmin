/* global firebase, importScripts */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const notificationsUrl = new URL("/notifications", self.location.origin).href;
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));

      if (existingClient) {
        return existingClient.focus().then(() => existingClient.navigate(notificationsUrl));
      }

      return self.clients.openWindow(notificationsUrl);
    }),
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAmI_Q5mPnvAymRKJ-nwkRTatr8OBj1ymY",
  appId: "1:500422373452:web:4b366eb342cf8734a5c4e9",
  authDomain: "ems-mobile-192a0.firebaseapp.com",
  messagingSenderId: "500422373452",
  projectId: "ems-mobile-192a0",
  storageBucket: "ems-mobile-192a0.firebasestorage.app",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.data?.web_notification_title ??
    payload.notification?.title ??
    "New notification";
  const body =
    payload.data?.web_notification_body ?? payload.notification?.body;

  return self.registration.showNotification(title, {
    badge: "/notification-logo.png",
    body,
    data: payload.data,
    icon: "/notification-logo.png",
    image: "/notification-logo.png",
  });
});
