import express from "express";
import {
  addAnswer,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  getAllCourses,
  getAllCoursesAdmin,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
  updateCourseProgress,
  submitQuizScore,
  addLesson,
  deleteLesson,
  getQuizResult,
  generateLessonSummary,
} from "../../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  uploadCourse
);

courseRouter.put(
  "/add-lesson",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  addLesson
);

courseRouter.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

courseRouter.put("/add-question", isAuthenticated, addQuestion);

courseRouter.put("/add-answer", isAuthenticated, addAnswer);

courseRouter.put("/add-review/:id", isAuthenticated, addReview);

courseRouter.put("/update-progress", isAuthenticated, updateCourseProgress);

courseRouter.put("/submit-quiz", isAuthenticated, submitQuizScore);

courseRouter.get("/get-quiz-result/:courseId/:lessonId", isAuthenticated, getQuizResult);

courseRouter.post(
  "/generate-summary",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  generateLessonSummary
);

courseRouter.put(
  "/add-reply",
  isAuthenticated,
  authorizeRoles("admin"),
  addReplyToReview
);

courseRouter.get(
  "/get-all-courses",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  getAllCoursesAdmin
);

courseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  deleteCourse
);

courseRouter.put(
  "/delete-lesson",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  deleteLesson
);

export default courseRouter;
