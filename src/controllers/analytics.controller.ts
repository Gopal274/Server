import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";

// get users analytics --- only for admin
export const getUsersAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(userModel);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get courses analytics --- only for admin
export const getCoursesAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(CourseModel);

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get orders analytics --- only for admin
export const getOrdersAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData(OrderModel);

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get overview stats --- for admin and teacher
export const getOverviewStats = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usersCount = await userModel.countDocuments();
      const coursesCount = await CourseModel.countDocuments();
      const ordersCount = await OrderModel.countDocuments();
      
      const courses = await CourseModel.find();
      const lessonsCount = courses.reduce((acc, curr) => acc + (curr.courseData?.length || 0), 0);

      // In a real app, these would be queried from respective models
      // For now, providing structured data that the dashboard expects
      const stats = {
        totalStudents: usersCount,
        totalCourses: coursesCount,
        totalOrders: ordersCount,
        totalVideos: lessonsCount,
        liveNow: 1, // Mock or query liveSessions model
        pendingDoubts: 5, // Mock or query doubts model
        dppsDueToday: 2, // Mock or query dpps model
        avgRating: 4.8,
        totalDpps: 47,
        earningsMTD: 460000000, // 4.6Cr in paise/cents
        rank: 2,
        todayClasses: [
          { time: "04:00 PM", topic: "Alternating Current Circuits", batchName: "JEE 2026", duration: 90, status: "live" },
          { time: "07:00 PM", topic: "LC Oscillations & RLC Circuit", batchName: "JEE 2025 A", duration: 90, status: "upcoming" },
        ],
        engagementData: [
          { d: "Mon", watch: 88, complete: 72 },
          { d: "Tue", watch: 91, complete: 68 },
          { d: "Wed", watch: 84, complete: 74 },
          { d: "Thu", watch: 93, complete: 79 },
          { d: "Fri", watch: 87, complete: 71 },
          { d: "Sat", watch: 96, complete: 83 },
          { d: "Sun", watch: 78, complete: 65 },
        ],
        topPerformers: [
          { name: "Arjun Mehta", score: 98.4, progress: 94 },
          { name: "Priya Kumari", score: 97.1, progress: 92 },
          { name: "Rahul Sharma", score: 96.8, progress: 89 },
        ]
      };

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
