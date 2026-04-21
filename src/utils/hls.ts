import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary";

/**
 * Transcodes a raw video to HLS (adaptive bitrate) format.
 * This function is intended to be run in a background job.
 */
export const transcodeToHls = async (inputPath: string, outputDir: string, publicId: string) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFileName = `${publicId}.m3u8`;
    const outputPath = path.join(outputDir, outputFileName);

    ffmpeg(inputPath)
      .outputOptions([
        "-profile:v main",
        "-vf scale=-2:720",
        "-c:a aac",
        "-ar 48000",
        "-b:a 128k",
        "-keyint_min 48",
        "-g 48",
        "-hls_time 10",
        "-hls_list_size 0",
        "-hls_segment_filename",
        path.join(outputDir, `${publicId}_%03d.ts`),
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("error", (err) => {
        console.error("An error occurred: " + err.message);
        reject(err);
      })
      .on("end", async () => {
        console.log("Transcoding finished!");
        resolve(outputPath);
      })
      .run();
  });
};

/**
 * Uploads an HLS directory (manifest + segments) to a storage provider.
 * For production, consider using a cloud storage like AWS S3.
 * With Cloudinary, you can upload the segments and manifest,
 * but Cloudinary usually handles HLS automatically if requested.
 * This is a placeholder for custom cloud storage upload logic.
 */
export const uploadHlsToCloud = async (hlsDir: string) => {
    console.log(`[STORAGE] Uploading HLS files from ${hlsDir} to cloud...`);
    // Logic to upload .m3u8 and .ts files to S3/Cloudinary/etc.
    // Return the final .m3u8 URL
    return "https://cdn.example.com/videos/hls/manifest.m3u8";
};
