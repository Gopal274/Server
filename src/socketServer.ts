import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { setupSocketAdapter } from "./config/socketAdapter";

let ioInstance: SocketIOServer;
const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: http.Server) => {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
    transports: ["websocket"], // Only allow websockets
    allowEIO3: true,
  });

  setupSocketAdapter(ioInstance);

  ioInstance.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Register user ID for targeted notifications
    socket.on("register", (userId: string) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Handle flying emojis/reactions
    socket.on("send_reaction", (data: { batchId: string, emoji: string }) => {
      ioInstance.to(data.batchId).emit("new_reaction", {
        emoji: data.emoji,
        id: Math.random().toString(36).substring(7), // Unique ID for animation
      });
    });

    // Join a batch/subject specific room for live classes
    socket.on("join_live", (data: { batchId: string }) => {
      socket.join(data.batchId);
      console.log(`User ${socket.id} joined live room: ${data.batchId}`);
    });

    // Handle real-time chat
    socket.on("send_message", (data: { batchId: string, message: string, user: any }) => {
      ioInstance.to(data.batchId).emit("new_message", {
        message: data.message,
        user: data.user,
        timestamp: new Date(),
      });
    });

    // Handle live polls
    socket.on("create_poll", (data: { batchId: string, poll: any }) => {
      ioInstance.to(data.batchId).emit("new_poll", data.poll);
    });

    socket.on("vote_poll", (data: { batchId: string, pollId: string, optionIndex: number }) => {
      // Broadcast vote update to everyone in the room
      ioInstance.to(data.batchId).emit("update_poll_votes", data);
    });

    // Live session start/end notifications
    socket.on("live_status", (data: { batchId: string, status: string, sessionInfo: any }) => {
      ioInstance.to(data.batchId).emit("live_status_changed", data);
    });

    // Questions/Suggestions during live
    socket.on("send_question", (data: { batchId: string, question: string, user: any }) => {
      ioInstance.to(data.batchId).emit("new_question", data);
    });

    socket.on("disconnect", () => {
      // Find and remove the user from userSockets map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log("A user disconnected");
    });
  });
};

export const sendNotification = (userId: string, notification: any) => {
    const socketId = userSockets.get(userId);
    if (socketId && ioInstance) {
        ioInstance.to(socketId).emit("new_notification", notification);
    }
};

export const broadcastNotification = (notification: any) => {
    if (ioInstance) {
        ioInstance.emit("new_notification", notification);
    }
};
