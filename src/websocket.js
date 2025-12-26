import { Server } from "socket.io";
import { supabase } from "./config/supabase.js";
import { config } from "./config/env.js";

/**
 * WebSocket Server Manager
 *
 * Features:
 * - Currently listening indicator
 * - Real-time like count updates
 * - Collaborative playlist updates
 * - User presence (online/offline)
 */

let io = null;

// Store for active users and their current state
const activeUsers = new Map(); // userId -> { socketId, currentTrack, status }
const roomUsers = new Map(); // roomId -> Set of userIds

/**
 * Initialize Socket.IO server
 */
export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        config.clientUrl,
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error("Invalid token"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const username = socket.user.user_metadata?.username || "User";

    console.log(`[WS] User connected: ${username} (${userId})`);

    // Store user connection
    activeUsers.set(userId, {
      socketId: socket.id,
      username,
      currentTrack: null,
      status: "online",
      connectedAt: new Date(),
    });

    // Broadcast user online status
    socket.broadcast.emit("user:online", {
      userId,
      username,
    });

    // Send current online users to the connected user
    socket.emit("users:online", getOnlineUsers());

    // ========================================
    // NOW PLAYING / CURRENTLY LISTENING
    // ========================================

    socket.on("track:playing", (data) => {
      const { trackId, title, artist } = data;

      // Update user's current track
      const userState = activeUsers.get(userId);
      if (userState) {
        userState.currentTrack = { trackId, title, artist };
        userState.status = "listening";
        activeUsers.set(userId, userState);
      }

      // Broadcast to all users
      io.emit("user:listening", {
        userId,
        username,
        track: { trackId, title, artist },
      });
    });

    socket.on("track:paused", () => {
      const userState = activeUsers.get(userId);
      if (userState) {
        userState.status = "online";
        activeUsers.set(userId, userState);
      }

      io.emit("user:paused", { userId });
    });

    // ========================================
    // REAL-TIME LIKES
    // ========================================

    socket.on("track:like", (data) => {
      const { trackId } = data;

      // Broadcast like to all users
      io.emit("track:liked", {
        trackId,
        userId,
        username,
      });
    });

    socket.on("track:unlike", (data) => {
      const { trackId } = data;

      io.emit("track:unliked", {
        trackId,
        userId,
      });
    });

    // ========================================
    // COLLABORATIVE PLAYLISTS
    // ========================================

    socket.on("playlist:join", (data) => {
      const { playlistId } = data;
      const roomId = `playlist:${playlistId}`;

      socket.join(roomId);

      // Track users in room
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(userId);

      // Notify others in the room
      socket.to(roomId).emit("playlist:user-joined", {
        userId,
        username,
        playlistId,
      });

      // Send current users in playlist to the joiner
      socket.emit("playlist:users", {
        playlistId,
        users: Array.from(roomUsers.get(roomId)),
      });
    });

    socket.on("playlist:leave", (data) => {
      const { playlistId } = data;
      const roomId = `playlist:${playlistId}`;

      socket.leave(roomId);

      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(userId);
      }

      socket.to(roomId).emit("playlist:user-left", {
        userId,
        playlistId,
      });
    });

    socket.on("playlist:track-added", (data) => {
      const { playlistId, track } = data;
      const roomId = `playlist:${playlistId}`;

      // Broadcast to all users in the playlist room
      socket.to(roomId).emit("playlist:track-added", {
        playlistId,
        track,
        addedBy: { userId, username },
      });
    });

    socket.on("playlist:track-removed", (data) => {
      const { playlistId, trackId } = data;
      const roomId = `playlist:${playlistId}`;

      socket.to(roomId).emit("playlist:track-removed", {
        playlistId,
        trackId,
        removedBy: { userId, username },
      });
    });

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on("disconnect", () => {
      console.log(`[WS] User disconnected: ${username}`);

      // Remove from active users
      activeUsers.delete(userId);

      // Remove from all rooms
      roomUsers.forEach((users, roomId) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(roomId).emit("playlist:user-left", { userId });
        }
      });

      // Broadcast offline status
      socket.broadcast.emit("user:offline", { userId });
    });
  });

  console.log("✅ WebSocket server initialized");
  return io;
};

/**
 * Get list of online users
 */
const getOnlineUsers = () => {
  const users = [];
  activeUsers.forEach((state, odId) => {
    users.push({
      odId,
      username: state.username,
      status: state.status,
      currentTrack: state.currentTrack,
    });
  });
  return users;
};

/**
 * Emit event to all connected clients
 */
export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  const userState = activeUsers.get(userId);
  if (userState && io) {
    io.to(userState.socketId).emit(event, data);
  }
};

/**
 * Emit event to a room
 */
export const emitToRoom = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

export { io, activeUsers };
