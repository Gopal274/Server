import type { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import { redis } from "../config/redis";
import "dotenv/config";
import DeviceModel from "../models/device.model";

// get user info
export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users --- only for admin
export const getAllUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user role --- only for admin
export const updateUserRole = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const user = await userModel.findOneAndUpdate(
        { email },
        { role },
        { new: true }
      );

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete user --- only for admin
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      await user.deleteOne();

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user info
interface IUpdateUserInfo {
  name?: string;
}

export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update password
interface IUpdatePassword {
  oldPassword?: string;
  newPassword?: string;
}

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter old and new password", 400));
      }

      const user = await userModel.findById(req.user?._id).select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid user", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }

      user.password = newPassword;

      await user.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get user devices
export const getUserDevices = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // Student ID
      const devices = await DeviceModel.find({ userId: id });

      res.status(200).json({
        success: true,
        devices,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// revoke device
export const revokeDevice = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.params;
      await DeviceModel.deleteOne({ _id: deviceId });

      res.status(200).json({
        success: true,
        message: "Device revoked successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// follow user
export const followUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { followId } = req.body;
      const userId = req.user?._id as string;

      if (userId === followId) {
        return next(new ErrorHandler("You cannot follow yourself", 400));
      }

      const user = await userModel.findById(userId);
      const followUser = await userModel.findById(followId);

      if (!user || !followUser) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (user.following.includes(followId)) {
        return next(new ErrorHandler("You are already following this user", 400));
      }

      user.following.push(followId);
      user.followingCount += 1;

      followUser.followers.push(userId);
      followUser.followersCount += 1;

      await user.save();
      await followUser.save();

      res.status(200).json({
        success: true,
        message: "User followed successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// unfollow user
export const unfollowUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { followId } = req.body;
      const userId = req.user?._id as string;

      const user = await userModel.findById(userId);
      const followUser = await userModel.findById(followId);

      if (!user || !followUser) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.following.includes(followId)) {
        return next(new ErrorHandler("You are not following this user", 400));
      }

      user.following = user.following.filter(id => id !== followId);
      user.followingCount -= 1;

      followUser.followers = followUser.followers.filter(id => id !== userId);
      followUser.followersCount -= 1;

      await user.save();
      await followUser.save();

      res.status(200).json({
        success: true,
        message: "User unfollowed successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update streak
export const updateStreak = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      const user = await userModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastDate = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
      if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
      }

      if (lastDate && lastDate.getTime() === today.getTime()) {
        // Already updated today
        return res.status(200).json({
          success: true,
          streak: user.streak,
        });
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate && lastDate.getTime() === yesterday.getTime()) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }

      user.lastStudyDate = today;
      user.xp += 10; // Award 10 XP for daily study

      // Check for level up
      const nextLevelXp = user.level * 100;
      if (user.xp >= nextLevelXp) {
        user.level += 1;
      }

      await user.save();

      res.status(200).json({
        success: true,
        streak: user.streak,
        xp: user.xp,
        level: user.level,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get leaderboard data
export const getLeaderboard = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For now, we'll implement the "All Time" leaderboard based on total XP
      // In a more complex app, you'd track XP in a separate collection with dates for weekly/monthly
      const topUsers = await userModel.find()
        .select("name avatar xp level role")
        .sort({ xp: -1 })
        .limit(20)
        .lean();

      // Find current user's rank
      const allUsersSorted = await userModel.find().select("_id").sort({ xp: -1 });
      const currentUserId = req.user?._id;
      const currentUserRank = allUsersSorted.findIndex(u => u._id.toString() === currentUserId?.toString()) + 1;

      res.status(200).json({
        success: true,
        leaderboard: topUsers.map((u, i) => ({
          rank: i + 1,
          ...u
        })),
        currentUser: {
          rank: currentUserRank,
          xp: req.user?.xp,
          name: req.user?.name,
          avatar: req.user?.avatar
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
