import { Worker } from "bullmq";
import { emailProcessor } from "../processors/email.processor";
import { videoTranscodeProcessor } from "../processors/videoTranscode.processor";
import "dotenv/config";
import { redis } from "../../config/redis";

export const emailWorker = new Worker("emailQueue", emailProcessor, {
  connection: redis,
});

export const videoTranscodeWorker = new Worker("videoTranscodeQueue", videoTranscodeProcessor, {
    connection: redis,
    concurrency: 1, // Only one video transcode at a time
});

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} (Email) completed successfully`);
});

videoTranscodeWorker.on("completed", (job) => {
    console.log(`Job ${job.id} (Video) completed successfully`);
});

videoTranscodeWorker.on("failed", (job, err) => {
    console.log(`Job ${job?.id} (Video) failed with error: ${err.message}`);
});

emailWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} (Email) failed with error: ${err.message}`);
});

console.log("Email & Video Workers started");
