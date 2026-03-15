const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: ALLOWED_ORIGIN }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", connections: io.engine.clientsCount });
});

// Track which socket belongs to which userId for targeted notifications
const userSockets = new Map(); // userId -> Set of socketIds

io.on("connection", (socket) => {
  // ── Join a state room (called when user navigates to a state) ────────────
  socket.on("joinStateRoom", ({ stateName, name, image, userId }) => {
    // Leave any previous state rooms
    socket.rooms.forEach((room) => {
      if (room !== socket.id && room.startsWith("state:")) {
        socket.leave(room);
      }
    });

    const room = `state:${stateName}`;
    socket.join(room);

    // Track userId -> socketId mapping for notifications
    if (userId) {
      socket.data.userId = userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
    }
  });

  // ── Chat message in a state room ─────────────────────────────────────────
  socket.on("state:message", (message) => {
    // Find which state room this socket is in
    const stateRoom = [...socket.rooms].find((r) => r.startsWith("state:"));
    if (!stateRoom) return;

    // Broadcast to everyone in the room including sender
    io.to(stateRoom).emit("state:message", message);
  });

  // ── Targeted notification to a specific user ─────────────────────────────
  socket.on("notification", ({ message, recieverUserId, eventId }) => {
    const recipientSockets = userSockets.get(recieverUserId);
    if (!recipientSockets) return;

    const notification = {
      message,
      userId: recieverUserId,
      eventId,
      isRead: false,
      createdAt: new Date(),
    };

    recipientSockets.forEach((socketId) => {
      io.to(socketId).emit("notification", notification);
    });
  });

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
  console.log(`Accepting connections from: ${ALLOWED_ORIGIN}`);
});
