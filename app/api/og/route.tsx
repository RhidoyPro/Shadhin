import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get("id");

  if (!eventId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0A",
            color: "#EDEDED",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Shadhin.io
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  let event;
  try {
    event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        content: true,
        type: true,
        mediaUrl: true,
        createdAt: true,
        user: { select: { name: true, image: true } },
        likes: { select: { id: true } },
        comments: { select: { id: true } },
      },
    });
  } catch {
    event = null;
  }

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0A",
            color: "#EDEDED",
            fontSize: 36,
          }}
        >
          Post not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const content =
    event.content.length > 280
      ? event.content.slice(0, 280) + "..."
      : event.content;
  const likeCount = event.likes.length;
  const commentCount = event.comments.length;
  const date = new Date(event.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0A",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: author + logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Avatar circle with initial */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#2D9F4F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 700,
                marginRight: 20,
              }}
            >
              {event.user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: "#EDEDED",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {event.user.name}
              </div>
              <div style={{ color: "#888888", fontSize: 20 }}>{date}</div>
            </div>
          </div>
          <div
            style={{
              color: "#2D9F4F",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            shadhin.io
          </div>
        </div>

        {/* Post content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            color: "#EDEDED",
            fontSize: 32,
            lineHeight: 1.5,
            overflow: "hidden",
          }}
        >
          {content}
        </div>

        {/* Footer: engagement stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid #333333",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", color: "#888888", fontSize: 22 }}
          >
            <span style={{ marginRight: 8 }}>&#x2764;</span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </div>
          <div
            style={{ display: "flex", alignItems: "center", color: "#888888", fontSize: 22 }}
          >
            <span style={{ marginRight: 8 }}>&#x1F4AC;</span>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
