import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import BatchModel from "../models/batch.model";
import DPPModel from "../models/dpp.model";
import TestModel from "../models/test.model";
import LiveSessionModel from "../models/liveSession.model";
import mongoose from "mongoose";

export const seedDemoData = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Create a Teacher
      const teacher = await userModel.findOneAndUpdate(
        { email: "teacher@lms.com" },
        {
          name: "MR Sir",
          email: "teacher@lms.com",
          password: "password123",
          role: "teacher",
          isVerified: true,
          avatar: { public_id: "demo", url: "https://picsum.photos/seed/teacher/200" }
        },
        { upsert: true, new: true }
      );

      // 2. Create a Course
      const course = await CourseModel.create({
        name: "NEET Physics Mastery",
        description: "Complete Physics for NEET 2027",
        price: 5000,
        tags: "NEET, Physics",
        level: "Beginner",
        demoUrl: "https://www.youtube.com/watch?v=demo",
        thumbnail: { public_id: "demo", url: "https://picsum.photos/seed/physics/400/200" },
        benefits: [{ title: "Daily Live Classes" }, { title: "Doubt Solving" }],
        prerequisites: [{ title: "Basic 10th Math" }],
        isPublished: true
      });

      // 3. Create a Batch
      const batch = await BatchModel.create({
        name: "Lakshya NEET 2027",
        description: "Full year intensive program for NEET 2027",
        price: 4999,
        duration: "12 months",
        subjects: [{
          title: "Physics",
          teacherId: teacher._id.toString(),
          courseId: course._id.toString()
        }],
        thumbnail: { public_id: "demo", url: "https://picsum.photos/seed/batch/400/200" },
        plans: [
          { id: "batch", label: "Basic Batch", price: 4999, oldPrice: 6000, discount: "17% OFF", features: ["Live Classes", "DPPs"] }
        ],
        includes: ["Live Lectures", "DPPs Discussion", "Regular Tests"],
        validity: "Till NEET 2027",
        modeOfLectures: "Live Online",
        scheduleDescription: "2 Classes per day",
        examGuidance: "Available",
        chapters: [
          { subjectId: "Physics", name: "Ray Optics", progress: 40 },
          { subjectId: "Physics", name: "Electrostatics", progress: 0 }
        ]
      });

      // 3.5 Add batch to user if userId provided
      const { userId } = req.query;
      if (userId) {
        await userModel.findByIdAndUpdate(userId, {
          $addToSet: { batches: batch._id.toString() }
        });
      }

      // 4. Create demo DPPs
      await DPPModel.create([
        {
          batchId: batch._id,
          subjectId: "Physics",
          chapterId: "Ray Optics",
          title: "Ray Optics: DPP 01",
          questions: [
            {
              question: "A convex lens of focal length 20 cm is placed in contact with a concave lens of focal length 40 cm. The power of the combination is:",
              options: ["+2.5 D", "-2.5 D", "+5 D", "-5 D"],
              correctAnswer: 0,
              explanation: "P = 1/f1 + 1/f2 = 1/0.2 + 1/-0.4 = 5 - 2.5 = 2.5 D"
            }
          ]
        }
      ]);

      // 5. Create demo Tests
      await TestModel.create({
        batchId: batch._id,
        type: "RBT",
        title: "RBT - 01 (Optics & GOC)",
        questions: [
          {
            question: "Speed of light in vacuum is:",
            options: ["3x10^8 m/s", "2x10^8 m/s", "1x10^8 m/s", "4x10^8 m/s"],
            correctAnswer: 0,
            marks: 4
          }
        ],
        durationMinutes: 60,
        scheduledDate: new Date(),
        active: true
      });

      // 6. Create a Live Session
      await LiveSessionModel.create({
        title: "Ray Optics: Lecture 05",
        description: "Lenses and Power of Combination",
        batchId: batch._id,
        subjectId: "Physics",
        teacherId: teacher._id,
        status: "live",
        startTime: new Date(),
        agoraChannel: "demo_channel",
        polls: [
          {
            question: "Is the focal length of a plane mirror infinite?",
            options: [{ option: "Yes", votes: 0 }, { option: "No", votes: 0 }],
            active: true
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: "Demo data seeded successfully",
        batchId: batch._id,
        teacherEmail: teacher.email
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);
