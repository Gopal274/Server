import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Server as SocketIOServer } from "socket.io";
import "dotenv/config";

import { redis } from "./redis";

const pubClient = redis;
const subClient = pubClient.duplicate();

subClient.on("connect", () => console.log("Redis (Sub) connected"));
subClient.on("error", (err) => console.error("Redis (Sub) Error:", err.message));

export const setupSocketAdapter = (io: SocketIOServer) => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.io Redis adapter setup successfully");
};
