/**
 * Transform raw Prisma event data into the shape expected by the mobile app.
 * Converts array relations to _count, normalizes field names, and adds defaults.
 */
export function transformEventForMobile(
  event: any,
  opts: {
    isLiked?: boolean;
    isAttending?: boolean;
    isBookmarked?: boolean;
  } = {}
) {
  return {
    id: event.id,
    content: event.content,
    eventType: event.eventType,
    type: event.type ?? null,
    mediaUrl: event.mediaUrl ?? null,
    eventDate: event.eventDate ? new Date(event.eventDate).toISOString() : null,
    stateName: event.stateName,
    userId: event.userId,
    isPromoted: event.isPromoted ?? false,
    ticketPrice: event.ticketPrice ?? null,
    maxAttendees: event.maxAttendees ?? null,
    createdAt: new Date(event.createdAt).toISOString(),
    user: {
      id: event.user.id,
      name: event.user.name,
      image: event.user.image ?? null,
      isVerifiedOrg: event.user.isVerifiedOrg ?? false,
      isBot: event.user.isBot ?? false,
    },
    _count: {
      likes: Array.isArray(event.likes) ? event.likes.length : (event._count?.likes ?? 0),
      comments: Array.isArray(event.comments) ? event.comments.length : (event._count?.comments ?? 0),
      attendees: Array.isArray(event.attendees) ? event.attendees.length : (event._count?.attendees ?? 0),
    },
    isLiked: opts.isLiked ?? false,
    isAttending: opts.isAttending ?? false,
    isBookmarked: opts.isBookmarked ?? false,
  };
}
