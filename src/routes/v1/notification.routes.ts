import express from "express";
import {
  getNotifications,
  getUserNotifications,
  updateNotification,
  updatePushToken,
} from "../../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const notificationRouter = express.Router();

notificationRouter.get("/get-notifications", isAuthenticated, getUserNotifications);

notificationRouter.put(
  "/update-notification/:id",
  isAuthenticated,
  updateNotification
);

notificationRouter.put(
  "/update-push-token",
  isAuthenticated,
  updatePushToken
);

notificationRouter.get(
  "/get-all-notifications",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  getNotifications
);

export default notificationRouter;
