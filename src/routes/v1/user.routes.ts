import express from "express";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserInfo,
  updateUserInfo,
  updatePassword,
  getUserDevices,
  revokeDevice,
  followUser,
  unfollowUser,
  updateStreak,
  getLeaderboard,
} from "../../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const userRouter = express.Router();

userRouter.get("/me", isAuthenticated, getUserInfo);

userRouter.get("/get-leaderboard", isAuthenticated, getLeaderboard);

userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);

userRouter.put("/update-user-password", isAuthenticated, updatePassword);

userRouter.put("/follow-user", isAuthenticated, followUser);

userRouter.put("/unfollow-user", isAuthenticated, unfollowUser);

userRouter.put("/update-streak", isAuthenticated, updateStreak);

userRouter.get(
  "/get-user-devices/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserDevices
);

userRouter.delete(
  "/revoke-device/:deviceId",
  isAuthenticated,
  authorizeRoles("admin"),
  revokeDevice
);

userRouter.get(
  "/get-users",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);

userRouter.put(
  "/update-user",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);

userRouter.delete(
  "/delete-user/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUser
);

export default userRouter;
