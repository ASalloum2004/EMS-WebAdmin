import { getApp, getApps, initializeApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

function hasFirebaseConfiguration(): boolean {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function getFirebaseVapidKey(): string | null {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  return typeof vapidKey === "string" && vapidKey.trim() ? vapidKey : null;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const { getMessaging, isSupported } = await import("firebase/messaging");

  if (!hasFirebaseConfiguration() || !(await isSupported())) {
    return null;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return getMessaging(app);
}

export async function unregisterFirebaseMessaging(): Promise<void> {
  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    return;
  }

  const { deleteToken } = await import("firebase/messaging");

  await deleteToken(messaging);
}
