import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MessagePayload } from "firebase/messaging";
import {
  getFirebaseMessaging,
  getFirebaseVapidKey,
  unregisterFirebaseMessaging,
} from "../../../firebase/firebaseMessaging";
import { useAuth } from "../../../context";
import { registerPushToken } from "../api";

export const NOTIFICATIONS_RECEIVED_EVENT = "notifications:received";

type PushNotificationsStatus =
  | "denied"
  | "enabled"
  | "error"
  | "idle"
  | "requesting"
  | "unsupported";

function canUsePushNotifications(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

const FIREBASE_MESSAGING_SERVICE_WORKER_URL =
  "/firebase-messaging-sw.js?v=2";

async function getMessagingRegistration() {
  return navigator.serviceWorker.register(FIREBASE_MESSAGING_SERVICE_WORKER_URL, {
    scope: "/",
  });
}

function showForegroundNotification(payload: MessagePayload) {
  if (Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(
    payload.data?.web_notification_title ??
      payload.notification?.title ??
      "New notification",
    {
      body:
        payload.data?.web_notification_body ?? payload.notification?.body,
      icon: "/notification-logo.png",
      image: "/notification-logo.png",
    },
  );

  notification.onclick = () => {
    window.focus();
    window.location.assign("/notifications");
    notification.close();
  };
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<PushNotificationsStatus>(() => {
    if (!canUsePushNotifications()) {
      return "unsupported";
    }

    return Notification.permission === "denied" ? "denied" : "idle";
  });
  const wasAuthenticated = useRef(isAuthenticated);

  const synchronizePushRegistration = useCallback(
    async () => {
      if (!isAuthenticated || !canUsePushNotifications()) {
        setStatus("unsupported");

        return;
      }

      const shouldRequestPermission = Notification.permission === "default";
      setStatus(shouldRequestPermission ? "requesting" : "idle");

      const permission = shouldRequestPermission
        ? await Notification.requestPermission()
        : Notification.permission;

      if (permission === "denied") {
        setStatus("denied");

        return;
      }

      if (permission !== "granted") {
        setStatus("idle");

        return;
      }

      try {
        const [messaging, vapidKey, serviceWorkerRegistration] = await Promise.all([
          getFirebaseMessaging(),
          Promise.resolve(getFirebaseVapidKey()),
          getMessagingRegistration(),
        ]);

        if (!messaging || !vapidKey) {
          setStatus("unsupported");

          return;
        }

        const { getToken } = await import("firebase/messaging");
        const token = await getToken(messaging, {
          serviceWorkerRegistration,
          vapidKey,
        });

        if (!token) {
          setStatus("error");

          return;
        }

        await registerPushToken(token);
        setStatus("enabled");
      } catch {
        setStatus("error");
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      void unregisterFirebaseMessaging().catch(() => undefined);
    }

    wasAuthenticated.current = isAuthenticated;

    if (!isAuthenticated) {
      setStatus(canUsePushNotifications() ? "idle" : "unsupported");

      return;
    }

    void synchronizePushRegistration();
  }, [isAuthenticated, synchronizePushRegistration]);

  useEffect(() => {
    if (!isAuthenticated || status !== "enabled") {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    void getFirebaseMessaging().then((messaging) => {
      if (!messaging || !isActive) {
        return;
      }

      void import("firebase/messaging").then(({ onMessage }) => {
        if (!isActive) {
          return;
        }

        unsubscribe = onMessage(messaging, (payload) => {
          window.dispatchEvent(new Event(NOTIFICATIONS_RECEIVED_EVENT));
          showForegroundNotification(payload);
        });
      });
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [isAuthenticated, status]);

  return children;
}
