import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEventReminderEmail } from "@/lib/mail";
import { EventStatus } from "@prisma/client";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find events starting in ~24h (22-26h window) and ~2h (1-3h window)
  const windows = [
    {
      label: "24h",
      hoursUntil: 24,
      from: new Date(now.getTime() + 22 * 60 * 60 * 1000),
      to: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    },
    {
      label: "2h",
      hoursUntil: 2,
      from: new Date(now.getTime() + 1 * 60 * 60 * 1000),
      to: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    },
  ];

  let totalSent = 0;

  for (const window of windows) {
    const events = await db.event.findMany({
      where: {
        eventDate: {
          gte: window.from,
          lte: window.to,
        },
      },
      include: {
        user: { select: { name: true } },
        attendees: {
          where: { status: EventStatus.GOING },
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    for (const event of events) {
      for (const attendee of event.attendees) {
        if (!attendee.user.email) continue;

        try {
          await sendEventReminderEmail(attendee.user.email, {
            eventContent: event.content,
            eventDate: event.eventDate!.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
            stateName: event.stateName,
            eventId: event.id,
            creatorName: event.user.name || "Someone",
            hoursUntil: window.hoursUntil,
          });
          totalSent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${attendee.user.email}:`, error);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    remindersSent: totalSent,
    checkedAt: now.toISOString(),
  });
}
