import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import LiveSessionModel from "../models/liveSession.model";
import { generateAgoraToken } from "../config/agora";

import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";
import { sendNotification } from "../socketServer";

// Create/Schedule live session
export const createLiveSession = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, batchId, subjectId, startTime } = req.body;
      const teacherId = req.user?._id;

      // Unique channel name per session
      const agoraChannel = `live_${batchId}_${Date.now()}`;

      const session = await LiveSessionModel.create({
        title,
        description,
        batchId,
        subjectId,
        teacherId,
        startTime,
        agoraChannel,
      });

      res.status(201).json({
        success: true,
        session,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// Start session (Generate Agora Token for Teacher)
export const startLiveSession = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;
      const session = await LiveSessionModel.findById(sessionId);

      if (!session) {
        return next(new ErrorHandler("Session not found", 404));
      }

      // Generate token for teacher (Publisher)
      const token = generateAgoraToken(
          session.agoraChannel, 
          "publisher", 
          req.user?._id as string
      ); 

      session.status = "live";
      session.agoraToken = token;
      await session.save();

      // Notify students in the batch
      const students = await userModel.find({ batches: session.batchId });
      
      const notificationPromises = students.map(student => {
        const notifData = {
            userId: student._id,
            title: "Live Session Started",
            message: `Live class "${session.title}" has started. Join now!`,
        };
        sendNotification(student._id.toString(), notifData);
        return NotificationModel.create(notifData);
      });
      
      await Promise.all(notificationPromises);

      res.status(200).json({
        success: true,
        session,
        token, // Return for teacher to join
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get token for Student to join
export const getSessionToken = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId } = req.params;
        const session = await LiveSessionModel.findById(sessionId);
  
        if (!session) {
          return next(new ErrorHandler("Session not found", 404));
        }

        if (session.status !== "live") {
            return next(new ErrorHandler("Session is not live", 400));
        }
  
        // Generate token for student (Subscriber)
        const token = generateAgoraToken(
            session.agoraChannel, 
            "subscriber", 
            req.user?._id as string
        ); 
  
        res.status(200).json({
          success: true,
          token,
          channel: session.agoraChannel,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

// End session
export const endLiveSession = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;
      const session = await LiveSessionModel.findById(sessionId);

      if (!session) {
        return next(new ErrorHandler("Session not found", 404));
      }

      session.status = "ended";
      session.endTime = new Date();
      await session.save();

      res.status(200).json({
        success: true,
        message: "Live session ended",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get live sessions for a batch
export const getBatchLiveSessions = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { batchId } = req.params;
      const sessions = await LiveSessionModel.find({ batchId }).sort({ startTime: -1 });

      res.status(200).json({
        success: true,
        sessions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get single session by ID
export const getLiveSessionById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await LiveSessionModel.findById(sessionId);

      if (!session) {
        return next(new ErrorHandler("Session not found", 404));
      }

      res.status(200).json({
        success: true,
        session,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Create poll in live session
export const createPoll = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, question, options } = req.body;
      const session = await LiveSessionModel.findById(sessionId);

      if (!session) {
        return next(new ErrorHandler("Session not found", 404));
      }

      // Deactivate previous polls
      session.polls.forEach(p => p.active = false);

      const newPoll = {
        question,
        options: options.map((opt: string) => ({ option: opt, votes: 0 })),
        active: true
      };

      session.polls.push(newPoll as any);
      await session.save();

      res.status(201).json({
        success: true,
        poll: session.polls[session.polls.length - 1],
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Vote in poll
export const votePoll = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, pollId, optionIndex } = req.body;
      const session = await LiveSessionModel.findById(sessionId);

      if (!session) {
        return next(new ErrorHandler("Session not found", 404));
      }

      const poll = (session.polls as any).id(pollId);
      if (!poll || !poll.active) {
        return next(new ErrorHandler("Poll not found or inactive", 404));
      }

      if (poll.options[optionIndex]) {
        poll.options[optionIndex].votes += 1;
        await session.save();
      }

      res.status(200).json({
        success: true,
        poll,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// End poll
export const endPoll = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId, pollId } = req.body;
        const session = await LiveSessionModel.findById(sessionId);
  
        if (!session) {
          return next(new ErrorHandler("Session not found", 404));
        }
  
        const poll = (session.polls as any).id(pollId);
        if (!poll) {
          return next(new ErrorHandler("Poll not found", 404));
        }
  
        poll.active = false;
        await session.save();
  
        res.status(200).json({
          success: true,
          poll,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

// Save question from student
export const saveQuestion = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId, question, userName } = req.body;
        const session = await LiveSessionModel.findById(sessionId);
  
        if (!session) {
          return next(new ErrorHandler("Session not found", 404));
        }
  
        const newQuestion = {
          userId: req.user?._id,
          userName: userName || req.user?.name,
          question,
          isAnswered: false,
        };
  
        session.questions.push(newQuestion as any);
        await session.save();
  
        res.status(201).json({
          success: true,
          question: session.questions[session.questions.length - 1],
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

// Mark question as answered
export const markQuestionAsAnswered = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId, questionId } = req.body;
        const session = await LiveSessionModel.findById(sessionId);
  
        if (!session) {
          return next(new ErrorHandler("Session not found", 404));
        }
  
        const question = (session.questions as any).id(questionId);
        if (!question) {
          return next(new ErrorHandler("Question not found", 404));
        }
  
        question.isAnswered = true;
        await session.save();
  
        res.status(200).json({
          success: true,
          question,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

// Get all live sessions (public for home screen)
export const getAllLiveSessions = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await LiveSessionModel.find({ status: "live" }).sort({ startTime: -1 });

      res.status(200).json({
        success: true,
        sessions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
