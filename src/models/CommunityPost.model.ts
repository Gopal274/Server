import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: "feed" | "poll" | "doubt" | "announcement";
  images: {
    public_id: string;
    url: string;
  }[];
  likes: string[]; // Array of User IDs
  bookmarks: string[]; // Array of User IDs
  comments: {
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: Date;
  }[];
  poll?: {
    question: string;
    options: {
      label: string;
      votes: string[]; // Array of User IDs who voted for this option
    }[];
    totalVotes: number;
    expiryDate: Date;
  };
  groupId?: string;
  isVerifiedUser: boolean;
}

const communityPostSchema = new Schema<ICommunityPost>({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: String,
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["feed", "poll", "doubt", "announcement"],
    default: "feed",
  },
  images: [
    {
      public_id: String,
      url: String,
    },
  ],
  likes: [
    {
      type: String,
    },
  ],
  bookmarks: [
    {
      type: String,
    },
  ],
  comments: [
    {
      userId: String,
      userName: String,
      userAvatar: String,
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  poll: {
    question: String,
    options: [
      {
        label: String,
        votes: [String],
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
    },
    expiryDate: Date,
  },
  groupId: String,
  isVerifiedUser: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const CommunityPostModel: Model<ICommunityPost> = mongoose.model("CommunityPost", communityPostSchema);

export default CommunityPostModel;
