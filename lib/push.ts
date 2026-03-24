import webpush from "web-push";
import { db } from "@/lib/db";

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:help@shadhin.io",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const sendPushToUser = async (userId: string, title: string, body: string, url?: string) => {
  // Fire both web-push and Expo push in parallel, non-blocking
  const webPushPromise = sendWebPush(userId, title, body, url);
  const expoPushPromise = sendExpoPush(userId, title, body, url);

  await Promise.allSettled([webPushPromise, expoPushPromise]);
};

async function sendWebPush(userId: string, title: string, body: string, url?: string) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });

  const payload = JSON.stringify({
    title,
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: url || "/" },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

async function sendExpoPush(userId: string, title: string, body: string, url?: string) {
  const tokens = await db.expoPushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data: { url: url || "/" },
    sound: "default" as const,
  }));

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (res.ok) {
      const data = await res.json();
      // Clean up invalid tokens
      if (Array.isArray(data.data)) {
        for (let i = 0; i < data.data.length; i++) {
          const ticket = data.data[i];
          if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
            await db.expoPushToken.delete({ where: { id: tokens[i].id } }).catch(() => {});
          }
        }
      }
    }
  } catch {
    // Expo push failed silently — non-critical
  }
}
