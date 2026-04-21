import { Worker } from "bullmq";
import { notificationProcessor } from "../processors/notification.processor";
import "dotenv/config";
import { redis } from "../../config/redis";

export const notificationWorker = new Worker("notificationQueue", notificationProcessor, {
  connection: redis,
});

notificationWorker.on("completed", (job) => {
  console.log(`Notification Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.log(`Notification Job ${job?.id} failed: ${err.message}`);
});

console.log("Notification Worker started");
