import { db } from "@/lib/db";

export const getAdminStats = async () => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [
    users,
    usersToday,
    usersThisWeek,
    suspendedUsers,
    botUsers,
    events,
    eventsToday,
    eventsThisWeek,
    reports,
    reportsToday,
    reportsThisWeek,
    pendingVerifications,
    pendingVerificationsWithNoEmailSent,
    likes,
    likesToday,
    likesThisWeek,
    comments,
    commentsToday,
    commentsThisWeek,
    attendees,
    totalMessages,
    messagesToday,
    messagesThisWeek,
    districtUsers,
    districtEvents,
    recentUsers,
    recentEvents,
    recentReports,
  ] = await Promise.all([
    // Users
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: startOfToday } } }),
    db.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    db.user.count({ where: { isSuspended: true } }),
    db.user.count({ where: { isBot: true } }),
    // Events
    db.event.count(),
    db.event.count({ where: { createdAt: { gte: startOfToday } } }),
    db.event.count({ where: { createdAt: { gte: startOfWeek } } }),
    // Reports
    db.report.count(),
    db.report.count({ where: { createdAt: { gte: startOfToday } } }),
    db.report.count({ where: { createdAt: { gte: startOfWeek } } }),
    // Verifications
    db.verificationToken.count(),
    db.verificationToken.count({ where: { isEmailSent: false } }),
    // Likes
    db.like.count(),
    db.like.count({ where: { createdAt: { gte: startOfToday } } }),
    db.like.count({ where: { createdAt: { gte: startOfWeek } } }),
    // Comments
    db.comment.count(),
    db.comment.count({ where: { createdAt: { gte: startOfToday } } }),
    db.comment.count({ where: { createdAt: { gte: startOfWeek } } }),
    // Attendees
    db.eventAttendee.count(),
    // Messages
    db.message.count(),
    db.message.count({ where: { createdAt: { gte: startOfToday } } }),
    db.message.count({ where: { createdAt: { gte: startOfWeek } } }),
    // District breakdown
    db.user.groupBy({
      by: ["stateName"],
      _count: true,
      where: { stateName: { not: null } },
    }),
    db.event.groupBy({
      by: ["stateName"],
      _count: true,
    }),
    // Recent activity
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        stateName: true,
        createdAt: true,
        isBot: true,
      },
    }),
    db.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        content: true,
        stateName: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    db.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return {
    users: { total: users, today: usersToday, thisWeek: usersThisWeek },
    suspended: suspendedUsers,
    bots: botUsers,
    realUsers: users - botUsers,
    events: { total: events, today: eventsToday, thisWeek: eventsThisWeek },
    reports: { total: reports, today: reportsToday, thisWeek: reportsThisWeek },
    pendingVerifications,
    pendingVerificationsWithNoEmailSent,
    likes: { total: likes, today: likesToday, thisWeek: likesThisWeek },
    comments: {
      total: comments,
      today: commentsToday,
      thisWeek: commentsThisWeek,
    },
    attendees,
    messages: {
      total: totalMessages,
      today: messagesToday,
      thisWeek: messagesThisWeek,
    },
    districts: {
      users: districtUsers,
      events: districtEvents,
    },
    recentActivity: {
      users: recentUsers,
      events: recentEvents,
      reports: recentReports,
    },
  };
};
