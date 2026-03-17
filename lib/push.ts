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
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return; // Push not configured
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

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
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
    } catch (error: any) {
      // If subscription is expired/invalid, clean it up
      if (error.statusCode === 404 || error.statusCode === 410) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
};
