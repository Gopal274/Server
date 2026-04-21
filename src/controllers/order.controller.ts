import type { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel from "../models/order.model";
import type { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import BatchModel from "../models/batch.model";
import NotificationModel from "../models/notification.model";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { redis } from "../config/redis";
import Razorpay from "razorpay";
import crypto from "crypto";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27-ac",
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// create order
export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, batchId, payment_info, payment_type = "razorpay" } = req.body as any;

      const user = await userModel.findById(req.user?._id);

      if (courseId) {
        const courseExistInUser = user?.courses.some(
          (course: any) => course.courseId.toString() === courseId.toString()
        );

        if (courseExistInUser) {
          return next(
            new ErrorHandler("You have already purchased this course", 400)
          );
        }

        const course = await CourseModel.findById(courseId);

        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
          courseId: course._id,
          userId: user?._id,
          payment_info,
          payment_type,
        };

        const mailData = {
          order: {
            _id: course._id.toString().slice(0, 6),
            name: course.name,
            price: course.price,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        };

        user?.courses.push({ courseId: course?._id.toString() });
        course.purchased = (course.purchased || 0) + 1;
        await course.save();
        
        await finalizeOrder(user, data, mailData, course.name, res, next);

      } else if (batchId) {
        const batchExistInUser = user?.batches.some(
          (id: string) => id.toString() === batchId.toString()
        );

        if (batchExistInUser) {
          return next(
            new ErrorHandler("You have already joined this batch", 400)
          );
        }

        const batch = await BatchModel.findById(batchId);

        if (!batch) {
          return next(new ErrorHandler("Batch not found", 404));
        }

        const data: any = {
          batchId: batch._id,
          userId: user?._id,
          payment_info,
          payment_type,
        };

        const mailData = {
          order: {
            _id: batch._id.toString().slice(0, 6),
            name: batch.name,
            price: batch.price,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        };

        user?.batches.push(batch._id.toString());
        batch.purchased = (batch.purchased || 0) + 1;
        await batch.save();

        await finalizeOrder(user, data, mailData, batch.name, res, next);
      } else {
        return next(new ErrorHandler("Please provide Course ID or Batch ID", 400));
      }

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// finalize order logic
async function finalizeOrder(user: any, data: any, mailData: any, itemName: string, res: Response, next: NextFunction) {
    try {
        const html = await ejs.renderFile(
            path.join(__dirname, "../mails/order-confirmation.ejs"),
            { order: mailData }
        );

        try {
            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }

        await redis.set(user._id, JSON.stringify(user));
        await user?.save();

        await NotificationModel.create({
            userId: user?._id,
            title: "New Order",
            message: `You have joined/purchased ${itemName}`,
        });

        const order = await OrderModel.create(data);

        res.status(201).json({
            success: true,
            order,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
}

// send razorpay publishable key
export const sendRazorpayPublishableKey = catchAsyncError(
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      publishableKey: process.env.RAZORPAY_KEY_ID,
    });
  }
);

// send stripe publishable key
export const sendStripePublishableKey = catchAsyncError(
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }
);

// new payment
export const newPayment = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// stripe payment
export const newPaymentStripe = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        metadata: { company: "LMS" },
        automatic_payment_methods: { enabled: true },
      });

      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// payment verification
export const paymentVerification = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, batchId } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Payment is verified, now create the order record
        const user = await userModel.findById(req.user?._id);
        let itemName = "";
        let data: any = {
            userId: user?._id,
            payment_info: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
            payment_type: "razorpay",
        };
        let mailData: any = {};

        if (courseId) {
            const course = await CourseModel.findById(courseId);
            if (!course) return next(new ErrorHandler("Course not found", 404));
            
            itemName = course.name;
            data.courseId = course._id;
            
            mailData = {
                order: {
                    _id: course._id.toString().slice(0, 6),
                    name: course.name,
                    price: course.price,
                    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                },
            };

            user?.courses.push({ courseId: course?._id.toString() });
            course.purchased = (course.purchased || 0) + 1;
            await course.save();
        } else if (batchId) {
            const batch = await BatchModel.findById(batchId);
            if (!batch) return next(new ErrorHandler("Batch not found", 404));
            
            itemName = batch.name;
            data.batchId = batch._id;

            mailData = {
                order: {
                    _id: batch._id.toString().slice(0, 6),
                    name: batch.name,
                    price: batch.price,
                    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                },
            };

            user?.batches.push(batch._id.toString());
            batch.purchased = (batch.purchased || 0) + 1;
            await batch.save();
        }

        await finalizeOrder(user, data, mailData, itemName, res, next);
      } else {
        res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


