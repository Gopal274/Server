import express from "express";
import { isAuthenticated, authorizeRoles } from "../../middlewares/auth.middleware";
import { getAllRecordings, getRecordingsByCourse, startLiveRecording, stopLiveRecording } from "../../controllers/recording.controller";

const recordingRouter = express.Router();

recordingRouter.post("/start", isAuthenticated, authorizeRoles("admin", "teacher"), startLiveRecording);
recordingRouter.post("/stop", isAuthenticated, authorizeRoles("admin", "teacher"), stopLiveRecording);
recordingRouter.get("/all", isAuthenticated, authorizeRoles("admin", "teacher"), getAllRecordings);
recordingRouter.get("/course/:courseId", isAuthenticated, getRecordingsByCourse);

export default recordingRouter;
