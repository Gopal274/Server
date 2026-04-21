import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import DPPModel from "../models/dpp.model";

// upload dpp --- only for teacher/admin
export const uploadDPP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const dpp = await DPPModel.create(data);

      res.status(201).json({
        success: true,
        dpp,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get dpps by batch
export const getDPPsByBatch = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { batchId } = req.params;
      const dpps = await DPPModel.find({ batchId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        dpps,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single dpp
export const getSingleDPP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dpp = await DPPModel.findById(id);

      if (!dpp) {
        return next(new ErrorHandler("DPP not found", 404));
      }

      res.status(200).json({
        success: true,
        dpp,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete dpp --- only for admin/teacher
export const deleteDPP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dpp = await DPPModel.findById(id);

      if (!dpp) {
        return next(new ErrorHandler("DPP not found", 404));
      }

      await dpp.deleteOne();

      res.status(200).json({
        success: true,
        message: "DPP deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
