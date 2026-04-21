import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import BatchModel from "../models/batch.model";
import cloudinary from "cloudinary";

// upload batch
export const uploadBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "batches",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const batch = await BatchModel.create(data);

      res.status(201).json({
        success: true,
        batch,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit batch
export const editBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      const batchId = req.params.id;

      const batchData = await BatchModel.findById(batchId) as any;

      if (thumbnail && !thumbnail.startsWith("http")) {
        await cloudinary.v2.uploader.destroy(batchData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "batches",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail && thumbnail.startsWith("http")) {
        data.thumbnail = {
          public_id: batchData.thumbnail.public_id,
          url: batchData.thumbnail.url,
        };
      }

      const batch = await BatchModel.findByIdAndUpdate(
        batchId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        batch,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single batch --- without purchasing
export const getSingleBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = req.params.id;

      const batch = await BatchModel.findById(batchId);

      res.status(200).json({
        success: true,
        batch,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all batches --- without purchasing
export const getAllBatches = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await BatchModel.find().select("-subjects.courseId");

      res.status(200).json({
        success: true,
        batches,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all batches --- only for admin
export const getAllBatchesAdmin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await BatchModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        batches,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete batch --- only for admin
export const deleteBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const batch = await BatchModel.findById(id);

      if (!batch) {
        return next(new ErrorHandler("Batch not found", 404));
      }

      await batch.deleteOne();

      res.status(200).json({
        success: true,
        message: "Batch deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
