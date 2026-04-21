import type { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import CommunityPostModel from "../models/CommunityPost.model";
import cloudinary from "cloudinary";

// Create community post
export const createPost = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, images, type, poll, groupId } = req.body;
      const user = req.user;

      const postImages = [];
      if (images && images.length > 0) {
        for (const img of images) {
          const myCloud = await cloudinary.v2.uploader.upload(img, {
            folder: "community",
          });
          postImages.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }
      }

      const postData: any = {
        userId: user?._id,
        userName: user?.name,
        userAvatar: user?.avatar?.url,
        content,
        type: type || "feed",
        images: postImages,
        groupId,
        isVerifiedUser: user?.role === "admin" || user?.role === "teacher",
      };

      if (type === "poll" && poll) {
        postData.poll = {
          question: poll.question,
          options: poll.options.map((opt: string) => ({ label: opt, votes: [] })),
          expiryDate: poll.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        };
      }

      const post = await CommunityPostModel.create(postData);

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all posts
export const getPosts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, groupId } = req.query;
      const query: any = {};
      if (type) query.type = type;
      if (groupId) query.groupId = groupId;

      const posts = await CommunityPostModel.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        posts,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Like/Unlike post
export const likePost = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.body;
      const userId = req.user?._id;

      const post = await CommunityPostModel.findById(postId);
      if (!post) {
        return next(new ErrorHandler("Post not found", 404));
      }

      const isLiked = post.likes.includes(userId as string);

      if (isLiked) {
        post.likes = post.likes.filter((id) => id !== (userId as string));
      } else {
        post.likes.push(userId as string);
      }

      await post.save();

      res.status(200).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Comment on post
export const commentOnPost = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, text } = req.body;
      const user = req.user;

      const post = await CommunityPostModel.findById(postId);
      if (!post) {
        return next(new ErrorHandler("Post not found", 404));
      }

      const comment = {
        userId: user?._id as string,
        userName: user?.name as string,
        userAvatar: user?.avatar?.url,
        text,
        createdAt: new Date(),
      };

      post.comments.push(comment);
      await post.save();

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Vote on poll
export const voteOnPoll = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, optionIndex } = req.body;
      const userId = req.user?._id as string;

      const post = await CommunityPostModel.findById(postId);
      if (!post || !post.poll) {
        return next(new ErrorHandler("Poll not found", 404));
      }

      // Check if user already voted
      const hasVoted = post.poll.options.some(opt => opt.votes.includes(userId));
      if (hasVoted) {
        return next(new ErrorHandler("You have already voted on this poll", 400));
      }

      if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
        return next(new ErrorHandler("Invalid option index", 400));
      }

      post.poll.options[optionIndex].votes.push(userId);
      post.poll.totalVotes += 1;

      await post.save();

      res.status(200).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Bookmark post
export const bookmarkPost = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.body;
      const userId = req.user?._id as string;

      const post = await CommunityPostModel.findById(postId);
      if (!post) {
        return next(new ErrorHandler("Post not found", 404));
      }

      const isBookmarked = post.bookmarks.includes(userId);

      if (isBookmarked) {
        post.bookmarks = post.bookmarks.filter(id => id !== userId);
      } else {
        post.bookmarks.push(userId);
      }

      await post.save();

      res.status(200).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
