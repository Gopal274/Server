import { transcodeToHls } from "../../utils/hls";
import CourseModel from "../../models/course.model";
import path from "path";
import fs from "fs";

export const videoTranscodeProcessor = async (job: any) => {
  const { videoUrl, courseId, contentId, publicId } = job.data;
  console.log(`Processing video transcoding job for: ${publicId}`);

  const tempOutputDir = path.join(process.cwd(), "temp/hls", publicId);
  
  try {
    // 1. Transcode video to HLS
    // In a real app, videoUrl would be a local path or downloaded from cloud
    const hlsManifestPath = await transcodeToHls(videoUrl, tempOutputDir, publicId);
    
    // 2. Upload HLS segments to Cloud Storage (placeholder)
    // For now, we'll assume the files stay local or use a mock URL
    const finalHlsUrl = `https://cdn.example.com/videos/hls/${publicId}.m3u8`;

    // 3. Update the Course/Lesson in DB
    const course = await CourseModel.findById(courseId);
    if (course) {
      const lesson = course.courseData.find((d: any) => d._id.toString() === contentId);
      if (lesson) {
        lesson.videoUrl = finalHlsUrl;
        lesson.videoPlayer = "hls";
        await course.save();
        console.log(`Updated lesson ${contentId} with HLS URL: ${finalHlsUrl}`);
      }
    }

    // 4. Cleanup temp directory
    // fs.rmSync(tempOutputDir, { recursive: true, force: true });

    console.log(`Video transcoding completed for: ${publicId}`);
  } catch (error) {
    console.error(`Failed to transcode video for: ${publicId}`, error);
    throw error;
  }
};
