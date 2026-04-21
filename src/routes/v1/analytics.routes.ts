import express from "express";
import {
  getCoursesAnalytics,
  getOrdersAnalytics,
  getUsersAnalytics,
  getOverviewStats,
} from "../../controllers/analytics.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const analyticsRouter = express.Router();

analyticsRouter.get(
  "/get-overview-stats",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  getOverviewStats
);

analyticsRouter.get(
  "/get-users-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUsersAnalytics
);

analyticsRouter.get(
  "/get-courses-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCoursesAnalytics
);

analyticsRouter.get(
  "/get-orders-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getOrdersAnalytics
);

export default analyticsRouter;
