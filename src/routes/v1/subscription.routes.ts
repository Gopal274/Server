import express from "express";
import {
  createPlan,
  getActivePlans,
  getUserSubscription,
  purchaseSubscription,
} from "../../controllers/subscription.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const subscriptionRouter = express.Router();

subscriptionRouter.post(
  "/create-plan",
  isAuthenticated,
  authorizeRoles("admin"),
  createPlan
);

subscriptionRouter.get("/get-active-plans", getActivePlans);

subscriptionRouter.post(
  "/purchase-subscription",
  isAuthenticated,
  purchaseSubscription
);

subscriptionRouter.get(
  "/get-user-subscription",
  isAuthenticated,
  getUserSubscription
);

export default subscriptionRouter;
