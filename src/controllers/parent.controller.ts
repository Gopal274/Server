import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import ParentLinkModel from "../models/parentLink.model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";

// Link student by email
export const linkStudent = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentEmail } = req.body;
      const parentId = req.user?._id;

      const student = await userModel.findOne({ email: studentEmail, role: "student" });
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      const link = await ParentLinkModel.create({
        parentId,
        studentId: student._id,
        status: "approved", // In a real app, you might want student approval
      });

      res.status(201).json({
        success: true,
        link,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all linked students
export const getLinkedStudents = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parentId = req.user?._id;
      const links = await ParentLinkModel.find({ parentId });
      
      const studentIds = links.map(l => l.studentId);
      const students = await userModel.find({ _id: { $in: studentIds } }).select("name email avatar courses");

      res.status(200).json({
        success: true,
        students,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get detailed progress for a student
export const getStudentProgress = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const parentId = req.user?._id;

      // Verify link
      const link = await ParentLinkModel.findOne({ parentId, studentId });
      if (!link) {
        return next(new ErrorHandler("Not authorized to view this student", 403));
      }

      const student = await userModel.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // Calculate progress for each course
      const progressReport = await Promise.all(
        student.courses.map(async (c: any) => {
          const course = await CourseModel.findById(c.courseId);
          const totalLessons = course?.courseData.length || 0;
          const completedLessons = c.progress.length;
          const completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          return {
            courseId: c.courseId,
            courseName: course?.name,
            completionPercentage,
            quizScores: c.quizScores,
          };
        })
      );

      res.status(200).json({
        success: true,
        report: progressReport,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
