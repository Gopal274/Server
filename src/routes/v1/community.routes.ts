import express from "express";
import {
  createPost,
  getPosts,
  likePost,
  commentOnPost,
  voteOnPoll,
  bookmarkPost,
} from "../../controllers/community.controller";
import { isAuthenticated } from "../../middlewares/auth.middleware";

const communityRouter = express.Router();

communityRouter.post("/create-post", isAuthenticated, createPost);

communityRouter.get("/get-posts", isAuthenticated, getPosts);

communityRouter.put("/like-post", isAuthenticated, likePost);

communityRouter.post("/add-comment", isAuthenticated, commentOnPost);

communityRouter.put("/vote-poll", isAuthenticated, voteOnPoll);

communityRouter.put("/bookmark-post", isAuthenticated, bookmarkPost);

export default communityRouter;
