import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import ErrorHandler from "./utils/ErrorHandler";
import authRouter from "./routes/v1/auth.routes";
import userRouter from "./routes/v1/user.routes";
import courseRouter from "./routes/v1/course.routes";
import paymentRouter from "./routes/v1/payment.routes";
import notificationRouter from "./routes/v1/notification.routes";
import analyticsRouter from "./routes/v1/analytics.routes";
import layoutRouter from "./routes/v1/layout.routes";
import batchRouter from "./routes/v1/batch.routes";
import teacherRouter from "./routes/v1/teacher.routes";
import subscriptionRouter from "./routes/v1/subscription.routes";
import doubtRouter from "./routes/v1/doubt.routes";
import resourceRouter from "./routes/v1/resource.routes";
import communityRouter from "./routes/v1/community.routes";
import parentRouter from "./routes/v1/parent.routes";
import dppRouter from "./routes/v1/dpp.routes";
import testRouter from "./routes/v1/test.routes";
import demoRouter from "./routes/v1/demo.routes";
import recordingRouter from "./routes/v1/recording.routes";
import "dotenv/config";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
// @ts-ignore
import xss from "xss-clean";
import morgan from "morgan";
import { logger } from "./utils/logger";
import compression from "compression";

export const app = express();

app.use(compression());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Morgan for HTTP request logging
app.use(morgan("dev", {
    stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Update CORS to allow requests from mobile app
app.use(
  cors({
    origin:
      process.env.ORIGIN === "*"
        ? "*"
        : [
            "http://localhost:3000",
            "http://localhost:19006",
            "http://localhost:19000",
            "http://localhost:8081",
            "http://localhost:5173",
          ],
    credentials: true,
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/layout", layoutRouter);
app.use("/api/v1/batch", batchRouter);
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/doubt", doubtRouter);
app.use("/api/v1/resource", resourceRouter);
app.use("/api/v1/community", communityRouter);
app.use("/api/v1/parent", parentRouter);
app.use("/api/v1/dpp", dppRouter);
app.use("/api/v1/test", testRouter);
app.use("/api/v1/demo", demoRouter);
app.use("/api/v1/recording", recordingRouter);

app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "api is working fine",
  });
});

// unknown route
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ErrorHandler(`Can't find this route ${req.originalUrl}`, 404));
});

// global error handler
app.use(ErrorMiddleware);
