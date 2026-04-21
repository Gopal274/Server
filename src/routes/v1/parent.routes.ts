import express from "express";
import {
  linkStudent,
  getLinkedStudents,
  getStudentProgress,
} from "../../controllers/parent.controller";
import { isAuthenticated, authorizeRoles } from "../../middlewares/auth.middleware";

const parentRouter = express.Router();

parentRouter.post(
  "/link-student",
  isAuthenticated,
  authorizeRoles("parent"),
  linkStudent
);

parentRouter.get(
  "/get-students",
  isAuthenticated,
  authorizeRoles("parent"),
  getLinkedStudents
);

parentRouter.get(
  "/student-progress/:studentId",
  isAuthenticated,
  authorizeRoles("parent"),
  getStudentProgress
);

export default parentRouter;
