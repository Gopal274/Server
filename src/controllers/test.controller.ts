import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import TestModel from "../models/test.model";
import QuizResultModel from "../models/quizResult.model";
import userModel from "../models/user.model";

// upload test --- admin only
export const uploadTest = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const test = await TestModel.create(data);

      res.status(201).json({
        success: true,
        test,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get tests by batch
export const getTestsByBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { batchId } = req.params;
      const tests = await TestModel.find({ batchId, active: true }).sort({ scheduledDate: 1 });

      res.status(200).json({
        success: true,
        tests,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// submit test results
export const submitTestResult = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { testId, answers, timeTaken } = req.body;
      const userId = req.user?._id;

      const test = await TestModel.findById(testId);
      if (!test) {
        return next(new ErrorHandler("Test not found", 404));
      }

      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let skippedQuestions = 0;
      let totalMarks = 0;

      const processedAnswers = answers.map((ans: any, index: number) => {
        const question = test.questions[index];
        const isCorrect = ans.selectedOption === question.correctAnswer;
        
        if (ans.selectedOption === -1) {
            skippedQuestions++;
        } else if (isCorrect) {
          correctAnswers++;
          totalMarks += question.marks || 4;
        } else {
          incorrectAnswers++;
          totalMarks -= 1; // Negative marking
        }

        return {
          questionIndex: index,
          selectedOption: ans.selectedOption,
          isCorrect,
          timeTaken: ans.timeTaken,
        };
      });

      const accuracy = (correctAnswers / test.questions.length) * 100;

      const quizResult = await QuizResultModel.create({
        userId,
        courseId: test.batchId, // Using courseId field for batchId in quizResult model for compatibility
        lessonId: testId,
        totalQuestions: test.questions.length,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        timeTaken,
        accuracy,
        answers: processedAnswers,
      });

      // Update User XP
      const user = await userModel.findById(userId);
      if (user) {
        user.xp += correctAnswers * 10;
        await user.save();
      }

      res.status(200).json({
        success: true,
        quizResult,
        totalMarks,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
