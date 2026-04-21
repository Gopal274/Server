import NotificationModel from "../models/notification.model";
import type { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";
import userModel from "../models/user.model";

// get all notifications --- only for admin
export const getNotifications = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get user notifications --- for students
export const getUserNotifications = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find({
        userId: req.user?._id,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update notification status
export const updateNotification = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      // Check if user is authorized to update this notification
      if (req.user?.role !== 'admin' && notification.userId.toString() !== req.user?._id.toString()) {
          return next(new ErrorHandler("Not authorized", 403));
      }

      notification.status = "read";

      await notification.save();

      res.status(201).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update push token
export const updatePushToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pushToken } = req.body;
      const userId = req.user?._id;

      await userModel.findByIdAndUpdate(userId, { pushToken });

      res.status(200).json({
        success: true,
        message: "Push token updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete notification --- only for admin
cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({
    status: "read",
    createdAt: { $lt: thirtyDaysAgo },
  });
  console.log("Deleted read notifications older than 30 days");
});
