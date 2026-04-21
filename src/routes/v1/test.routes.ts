import express from "express";
import { isAuthenticated, authorizeRoles } from "../../middlewares/auth.middleware";
import { uploadTest, getTestsByBatch, submitTestResult } from "../../controllers/test.controller";

const testRouter = express.Router();

testRouter.post("/upload-test", isAuthenticated, authorizeRoles("admin"), uploadTest);
testRouter.get("/get-tests/:batchId", isAuthenticated, getTestsByBatch);
testRouter.post("/submit-test", isAuthenticated, submitTestResult);

export default testRouter;
