import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import DoubtModel from "../models/doubt.model";
import DoubtReplyModel from "../models/doubtReply.model";
import cloudinary from "cloudinary";
import { broadcastNotification } from "../socketServer";
import { solveWithAI } from "../utils/ai";

// Create doubt
export const createDoubt = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, subject, topic, batchId, images } = req.body;
      const user = req.user;

      const attachments = [];
      if (images && images.length > 0) {
        for (const img of images) {
          const myCloud = await cloudinary.v2.uploader.upload(img, {
            folder: "doubts",
          });
          attachments.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }
      }

      const doubt = await DoubtModel.create({
        userId: user?._id,
        userName: user?.name,
        userAvatar: user?.avatar?.url,
        title,
        description,
        subject,
        topic,
        batchId,
        attachments,
      });

      res.status(201).json({
        success: true,
        doubt,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all doubts (with filters)
export const getDoubts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subject, status, batchId, userId } = req.query;
      const query: any = {};

      if (subject) query.subject = subject;
      if (status) query.status = status;
      if (batchId) query.batchId = batchId;
      if (userId) query.userId = userId;

      const doubts = await DoubtModel.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        doubts,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get single doubt with replies
export const getDoubtById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const doubt = await DoubtModel.findById(id);
      if (!doubt) {
        return next(new ErrorHandler("Doubt not found", 404));
      }

      const replies = await DoubtReplyModel.find({ doubtId: id }).sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        doubt,
        replies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add reply to doubt
export const addDoubtReply = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doubtId, content, images } = req.body;
      const user = req.user;

      const attachments = [];
      if (images && images.length > 0) {
        for (const img of images) {
          const myCloud = await cloudinary.v2.uploader.upload(img, {
            folder: "doubts",
          });
          attachments.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }
      }

      const reply = await DoubtReplyModel.create({
        doubtId,
        userId: user?._id,
        userName: user?.name,
        userAvatar: user?.avatar?.url,
        content,
        isTeacherReply: user?.role === "teacher" || user?.role === "admin",
        attachments,
      });

      // Update reply count in Doubt
      await DoubtModel.findByIdAndUpdate(doubtId, {
        $inc: { replyCount: 1 }
      });

      res.status(201).json({
        success: true,
        reply,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Resolve doubt
export const resolveDoubt = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const doubt = await DoubtModel.findByIdAndUpdate(id, { status: "resolved" }, { new: true });

      res.status(200).json({
        success: true,
        doubt,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Solve doubt with AI
export const solveDoubtAI = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { image, text } = req.body;
      if (!image) {
        return next(new ErrorHandler("Please provide an image", 400));
      }

      const solution = await solveWithAI(image, text);

      res.status(200).json({
        success: true,
        solution,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

