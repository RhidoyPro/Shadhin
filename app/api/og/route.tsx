import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const WIDTH = 2400;
const HEIGHT = 1260;

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
            fontSize: 96,
            fontWeight: 700,
          }}
        >
          Shadhin.io
        </div>
      ),
      { width: WIDTH, height: HEIGHT }
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
            fontSize: 72,
          }}
        >
          Post not found
        </div>
      ),
      { width: WIDTH, height: HEIGHT }
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
          padding: 120,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: author + logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 80,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: "#2D9F4F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 56,
                fontWeight: 700,
                marginRight: 40,
              }}
            >
              {event.user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: "#EDEDED",
                  fontSize: 56,
                  fontWeight: 700,
                }}
              >
                {event.user.name}
              </div>
              <div style={{ color: "#888888", fontSize: 40 }}>{date}</div>
            </div>
          </div>
          <div
            style={{
              color: "#2D9F4F",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1,
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
            fontSize: 64,
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
            gap: 64,
            marginTop: 80,
            paddingTop: 48,
            borderTop: "2px solid #333333",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", color: "#888888", fontSize: 44 }}
          >
            <span style={{ marginRight: 16 }}>&#x2764;</span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </div>
          <div
            style={{ display: "flex", alignItems: "center", color: "#888888", fontSize: 44 }}
          >
            <span style={{ marginRight: 16 }}>&#x1F4AC;</span>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
