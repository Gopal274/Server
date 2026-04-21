import express from "express";
import { 
  createOrder, 
  newPayment, 
  paymentVerification, 
  sendRazorpayPublishableKey,
  sendStripePublishableKey,
  newPaymentStripe
} from "../../controllers/order.controller";
import { isAuthenticated } from "../../middlewares/auth.middleware";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

orderRouter.get("/razorpay-key", sendRazorpayPublishableKey);

orderRouter.get("/stripe-key", sendStripePublishableKey);

orderRouter.post("/payment", isAuthenticated, newPayment);

orderRouter.post("/payment-stripe", isAuthenticated, newPaymentStripe);

orderRouter.post("/payment-verification", isAuthenticated, paymentVerification);

export default orderRouter;
