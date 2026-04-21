import express from "express";
import {
  uploadResource,
  getResourcesByLesson,
  getResourcesByCourse,
  deleteResource,
} from "../../controllers/resource.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const resourceRouter = express.Router();

resourceRouter.post(
  "/upload-resource",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  uploadResource
);

resourceRouter.get(
  "/get-lesson-resources/:lessonId",
  isAuthenticated,
  getResourcesByLesson
);

resourceRouter.get(
  "/get-course-resources/:courseId",
  isAuthenticated,
  getResourcesByCourse
);

resourceRouter.delete(
  "/delete-resource/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  deleteResource
);

export default resourceRouter;
