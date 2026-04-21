import express from "express";
import {
  deleteBatch,
  editBatch,
  getAllBatches,
  getAllBatchesAdmin,
  getSingleBatch,
  uploadBatch,
} from "../../controllers/batch.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const batchRouter = express.Router();

batchRouter.post(
  "/create-batch",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadBatch
);

batchRouter.put(
  "/edit-batch/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editBatch
);

batchRouter.get("/get-batch/:id", getSingleBatch);

batchRouter.get("/get-batches", getAllBatches);

batchRouter.get(
  "/get-all-batches",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllBatchesAdmin
);

batchRouter.delete(
  "/delete-batch/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteBatch
);

export default batchRouter;
