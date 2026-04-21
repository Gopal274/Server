import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import DeviceModel from "../models/device.model";

export const checkDeviceLimit = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const deviceId = req.headers["x-device-id"] as string;
    const platform = req.headers["x-platform"] as string || "unknown";
    const model = req.headers["x-device-model"] as string || "unknown";

    if (!userId) return next();

    // If no device ID provided in header, skip but log (production should require it)
    if (!deviceId) {
        console.warn(`User ${userId} accessing without device ID header`);
        return next();
    }

    // Find if this device is already registered for this user
    const existingDevice = await DeviceModel.findOne({ userId, deviceId });

    if (existingDevice) {
      // Update last login
      existingDevice.lastLogin = new Date();
      await existingDevice.save();
      return next();
    }

    // Check count of devices for this user
    const deviceCount = await DeviceModel.countDocuments({ userId });

    if (deviceCount >= 2) {
      return next(
        new ErrorHandler(
          "Device limit reached. Please logout from another device first.",
          403
        )
      );
    }

    // Register new device
    await DeviceModel.create({
      userId,
      deviceId,
      platform,
      model,
    });

    next();
  }
);
