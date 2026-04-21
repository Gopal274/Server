import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";

// Check if user has any active subscription
export const isSubscribed = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler("Please login to access this resource", 400));
    }

    const expiryDate = user.subscription?.expiryDate;
    const planTier = user.subscription?.planTier;

    if (!planTier || planTier === "free") {
        // Free users might have limited access, handled in specific controllers
        return next();
    }

    if (expiryDate && new Date(expiryDate) < new Date()) {
      return next(new ErrorHandler("Your subscription has expired. Please renew to continue.", 403));
    }

    next();
  }
);

// Authorize based on plan tier
export const authorizeTier = (requiredTier: "basic" | "pro") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = req.user?.subscription?.planTier || "free";

    const tiers = {
      free: 0,
      basic: 1,
      pro: 2,
    };

    if (tiers[userTier] < tiers[requiredTier]) {
      return next(
        new ErrorHandler(
          `This content requires a ${requiredTier} subscription or higher.`,
          403
        )
      );
    }

    next();
  };
};
