import express from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
  sendOTP,
  verifyOTP,
  } from "../../controllers/auth.controller";
  import { isAuthenticated } from "../../middlewares/auth.middleware";

  const authRouter = express.Router();

  authRouter.post("/register", registrationUser);
  authRouter.post("/activate-user", activateUser);
  authRouter.post("/login", loginUser);
  authRouter.post("/send-otp", sendOTP);
  authRouter.post("/verify-otp", verifyOTP);
  authRouter.get("/logout", isAuthenticated, logoutUser);

export default authRouter;
