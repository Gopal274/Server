import type { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import { acquireResourceId, startRecording, stopRecording } from "../utils/agoraRecording";
import RecordingModel from "../models/recording.model";
import { generateAgoraToken } from "../config/agora";

// start recording
export const startLiveRecording = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelName, courseId } = req.body;
      const uid = "recording_bot_01"; // Consistent UID for recording bots

      // 1. Acquire Resource ID
      const resourceId = await acquireResourceId(channelName, uid);

      // 2. Generate Recording Token
      const token = generateAgoraToken(channelName, "publisher", uid);

      // 3. Start Recording
      const sid = await startRecording(resourceId, channelName, uid, token);

      // 4. Save to DB
      const recording = await RecordingModel.create({
        courseId,
        channelName,
        resourceId,
        sid,
        status: "started",
      });

      res.status(200).json({
        success: true,
        recording,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// stop recording
export const stopLiveRecording = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recordingId } = req.body;
      const recording = await RecordingModel.findById(recordingId);

      if (!recording) {
        return next(new ErrorHandler("Recording not found", 404));
      }

      const uid = "recording_bot_01";
      
      // Stop Recording in Agora
      await stopRecording(recording.resourceId, recording.sid, recording.channelName, uid);

      recording.status = "stopped";
      await recording.save();

      res.status(200).json({
        success: true,
        message: "Recording stopped successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all recordings --- for teacher/admin
export const getAllRecordings = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recordings = await RecordingModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        recordings,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get recordings for course
export const getRecordingsByCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const recordings = await RecordingModel.find({ courseId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        recordings,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
