import express from "express";
import {
  createLiveSession,
  createPoll,
  endLiveSession,
  endPoll,
  getAllLiveSessions,
  getBatchLiveSessions,
  getLiveSessionById,
  getSessionToken,
  markQuestionAsAnswered,
  saveQuestion,
  startLiveSession,
  votePoll,
} from "../../controllers/live.controller";
import {
  deleteResource,
  getResourcesByBatch,
  uploadResource,
} from "../../controllers/resource.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const teacherRouter = express.Router();

// Live Sessions
teacherRouter.post(
  "/create-live-session",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  createLiveSession
);

teacherRouter.post(
  "/start-live-session",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  startLiveSession
);

teacherRouter.post(
  "/end-live-session",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  endLiveSession
);

teacherRouter.get(
  "/get-live-sessions/:batchId",
  isAuthenticated,
  getBatchLiveSessions
);

teacherRouter.get(
  "/get-live-sessions-by-id/:sessionId",
  isAuthenticated,
  getLiveSessionById
);

teacherRouter.get(
  "/get-session-token/:sessionId",
  isAuthenticated,
  getSessionToken
);

teacherRouter.get(
  "/get-all-live-sessions",
  isAuthenticated,
  getAllLiveSessions
);

// Polls & Questions
teacherRouter.post(
  "/create-poll",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  createPoll
);

teacherRouter.post(
  "/end-poll",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  endPoll
);

teacherRouter.post(
  "/vote-poll",
  isAuthenticated,
  votePoll
);

teacherRouter.post(
  "/save-question",
  isAuthenticated,
  saveQuestion
);

teacherRouter.post(
  "/mark-question-answered",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  markQuestionAsAnswered
);

// Resources (DPP, Notes, Assignments)
teacherRouter.post(
  "/upload-resource",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  uploadResource
);

teacherRouter.get(
  "/get-resources/:batchId",
  isAuthenticated,
  getResourcesByBatch
);

teacherRouter.delete(
  "/delete-resource/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  deleteResource
);

export default teacherRouter;
