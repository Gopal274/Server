import type { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import type { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../config/redis";
import "dotenv/config";
import { emailQueue } from "../jobs/queue";
import OTPModel from "../models/otp.model";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, referralCode } = req.body;

      const isEmailExist = await userModel.findOne({
        email,
      });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user: any = {
        name,
        email,
        password,
        referralCode
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };

      await emailQueue.add("registration-email", {
        email: user.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });

      res.status(200).json({
        success: true,
        message:
          "Registration successful, please check your email to activate your account",
        activationToken: activationToken.token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      const decoded: any = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      );
      
      if (decoded.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      
      const { name, email, password, referralCode } = decoded.user;
      
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      if (referralCode) {
        const referrer = await userModel.findOne({ referralCode });
        if (referrer) {
          user.referredBy = referrer._id as string;
          await user.save();
          
          referrer.referralPoints += 100;
          await referrer.save();
        }
      }

      res.status(200).json({
        success: true,
        message: "Account activated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide email and password", 400));
      }
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Send OTP
export const sendOTP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return next(new ErrorHandler("Please enter phone number", 400));
      }

      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in DB
      await OTPModel.create({ phoneNumber, otp });

      // Simulate sending SMS
      console.log(`[SMS Simulation] OTP for ${phoneNumber} is: ${otp}`);

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Verify OTP & Login
export const verifyOTP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return next(new ErrorHandler("Please provide phone number and OTP", 400));
      }

      const otpData = await OTPModel.findOne({ phoneNumber, otp }).sort({ createdAt: -1 });

      if (!otpData) {
        return next(new ErrorHandler("Invalid or expired OTP", 400));
      }

      // Check if user exists
      let user = await userModel.findOne({ phoneNumber });

      if (!user) {
        // Create a basic student user if not exists
        // PW clone often allows seamless registration via OTP
        user = await userModel.create({
          phoneNumber,
          name: `User ${phoneNumber.slice(-4)}`,
          email: `${phoneNumber}@temp.com`, // Placeholder email
          isVerified: true,
          password: Math.random().toString(36).slice(-8), // Dummy password
        });
      }

      // Delete the used OTP
      await OTPModel.deleteOne({ _id: otpData._id });

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

