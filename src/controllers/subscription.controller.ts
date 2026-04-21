import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import PlanModel from "../models/plan.model";
import SubscriptionModel from "../models/subscription.model";
import userModel from "../models/user.model";

// create plan --- only for admin
export const createPlan = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const plan = await PlanModel.create(data);

      res.status(201).json({
        success: true,
        plan,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all active plans
export const getActivePlans = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await PlanModel.find({ isActive: true });

      res.status(200).json({
        success: true,
        plans,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// purchase subscription
export const purchaseSubscription = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId, paymentInfo } = req.body;
      const userId = req.user?._id;

      const plan = await PlanModel.findById(planId);
      if (!plan) {
        return next(new ErrorHandler("Plan not found", 404));
      }

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + plan.durationInMonths);

      const subscription = await SubscriptionModel.create({
        userId,
        planId,
        startDate,
        expiryDate,
        paymentInfo,
        status: "active",
      });

      // Update user with subscription info (optional: you can also check via Subscription model)
      await userModel.findByIdAndUpdate(userId, {
        $set: { "subscription.planTier": plan.tier, "subscription.expiryDate": expiryDate }
      });

      res.status(201).json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get user subscription
export const getUserSubscription = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const subscription = await SubscriptionModel.findOne({ 
        userId, 
        status: "active",
        expiryDate: { $gt: new Date() } 
      }).populate("planId");

      res.status(200).json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
