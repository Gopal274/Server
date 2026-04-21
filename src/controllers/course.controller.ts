import QuizResultModel from "../models/quizResult.model";
import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "../config/cloudinary";
import CourseModel from "../models/course.model";
import userModel from "../models/user.model";
import { redis } from "../config/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import sendMail from "../utils/sendMail";
import { transformToHls } from "../utils/video";
import { generateVideoSummary } from "../utils/ai";

import NotificationModel from "../models/notification.model";

import { broadcastNotification } from "../socketServer";
import { videoTranscodeQueue } from "../jobs/queue";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// upload course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const course = await CourseModel.create(data);

      const notifData = {
          title: "New Course Available",
          message: `New course "${course.name}" is now available. Check it out!`,
      };
      
      broadcastNotification(notifData);

      // Notify all users about new course
      const users = await userModel.find();
      const notificationPromises = users.map(user => 
        NotificationModel.create({
            ...notifData,
            userId: user._id,
        })
      );
      await Promise.all(notificationPromises);

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      const courseId = req.params.id;
      const courseData = await CourseModel.findById(courseId) as any;

      if (thumbnail && !thumbnail.startsWith("http")) {
        await cloudinary.uploader.destroy(courseData.thumbnail.public_id);
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail && thumbnail.startsWith("http")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail?.public_id,
          url: courseData?.thumbnail?.url,
        };
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course --- without purchasing
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses --- without purchasing
export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content --- only for valid user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const userTier = req.user?.subscription?.planTier || "free";

      const courseExists = userCourseList?.find(
        (course: any) => course.courseId.toString() === courseId
      );

      const hasSubscriberAccess = userTier === "basic" || userTier === "pro";

      if (!courseExists && !hasSubscriberAccess) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData.map((item: any) => {
        return {
          ...item.toObject(),
          videoUrl: transformToHls(item.videoUrl),
        };
      });

      const user = await userModel.findById(req.user?._id);
      const userCourse = user?.courses.find((item: any) => item.courseId === courseId);

      res.status(200).json({
        success: true,
        content,
        progress: userCourse?.progress || [],
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this question to our course content
      courseContent.questions.push(newQuestion);

      // save the updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add this answer to our course content
      question.questionReplies.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        // create a notification (optional)
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;

      const courseId = req.params.id;

      // check if courseId already exists in userCourseList based on _id
      const courseExists = userCourseList?.some(
        (course: any) => course.courseId.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course.reviews.length; // one example we have 2 reviews one is 5 another one is 4 so avg = 9 / 2 = 4.5
      }

      await course?.save();

      const notification = {
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      };

      // create notification

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAddReviewReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewReplyData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course?.reviews.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses --- only for admin
export const getAllCoursesAdmin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete course --- only for admin
export const deleteCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      await course.deleteOne();

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add lesson to course
export const addLesson = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, videoUrl, videoSection, links, suggestion, quiz, courseId } = req.body;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const newLesson: any = {
        title,
        description,
        videoUrl,
        videoSection,
        links,
        suggestion,
        quiz: quiz || [],
      };

      course.courseData.push(newLesson);

      await course.save();

      // Trigger background transcoding if videoUrl is provided
      if (videoUrl) {
        const addedLesson = course.courseData[course.courseData.length - 1];
        await videoTranscodeQueue.add("video-transcode", {
          videoUrl,
          courseId: course._id,
          contentId: addedLesson._id,
          publicId: `vid_${addedLesson._id}`,
        });
        console.log(`[QUEUE] Added transcoding job for lesson: ${addedLesson._id}`);
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete lesson from course
export const deleteLesson = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lessonId } = req.body;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      course.courseData = course.courseData.filter(
        (item: any) => item._id.toString() !== lessonId
      );

      await course.save();

      res.status(200).json({
        success: true,
        message: "Lesson deleted successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateCourseProgress = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, contentId, timestamp }: IUpdateProgressData = req.body;
      const user = await userModel.findById(req.user?._id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const course = user.courses.find((item: any) => item.courseId === courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found in user list", 404));
      }

      if (!course.progress) {
        course.progress = [];
      }

      const existingProgress = course.progress.find(
        (item: any) => item.contentId === contentId
      );

      if (existingProgress) {
        existingProgress.timestamp = timestamp;
      } else {
        course.progress.push({ contentId, timestamp });
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "Progress updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IUpdateProgressData {
  courseId: string;
  contentId: string;
  timestamp: number;
}

interface ISubmitQuizData {
  courseId: string;
  contentId: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  totalTime: number;
}

export const submitQuizScore = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, contentId, score, total, correct, incorrect, skipped, totalTime, answers }: any = req.body;
      const user = await userModel.findById(req.user?._id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const course = user.courses.find((item: any) => item.courseId === courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found in user list", 404));
      }

      // 1. Update basic stats in User model for quick access
      if (!course.quizScores) {
        course.quizScores = [];
      }

      const existingScore = (course.quizScores as any[]).find(
        (item: any) => item.contentId === contentId
      );

      const quizData = { contentId, score, total, correct, incorrect, skipped, totalTime };

      if (existingScore) {
        Object.assign(existingScore, quizData);
      } else {
        course.quizScores.push(quizData);
      }

      await user.save();

      // 2. Create detailed QuizResult document for analytics
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      
      await QuizResultModel.create({
          userId: user._id,
          courseId,
          lessonId: contentId,
          totalQuestions: total,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          skippedQuestions: skipped,
          timeTaken: totalTime,
          accuracy,
          answers: answers || []
      });

      res.status(200).json({
        success: true,
        message: "Quiz score submitted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get quiz result for analytics
export const getQuizResult = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.user?._id;

      const result = await QuizResultModel.findOne({ userId, courseId, lessonId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        result,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const generateLessonSummary = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lessonId, transcript } = req.body;

      if (!transcript) {
        return next(new ErrorHandler("Please provide a transcript", 400));
      }

      const summary = await generateVideoSummary(transcript);

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const lesson = course.courseData.find((item: any) => item._id.toString() === lessonId);
      if (!lesson) {
        return next(new ErrorHandler("Lesson not found", 404));
      }

      lesson.aiSummary = summary || "";
      await course.save();

      res.status(200).json({
        success: true,
        summary,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

