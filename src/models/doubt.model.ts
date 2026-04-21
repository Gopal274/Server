import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDoubt extends Document {
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  batchId?: string;
  status: "open" | "resolved";
  attachments: {
    public_id: string;
    url: string;
  }[];
  replyCount: number;
}

const doubtSchema = new Schema<IDoubt>({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: String,
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: String,
  batchId: String,
  status: {
    type: String,
    enum: ["open", "resolved"],
    default: "open",
  },
  attachments: [
    {
      public_id: String,
      url: String,
    },
  ],
  replyCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const DoubtModel: Model<IDoubt> = mongoose.model("Doubt", doubtSchema);

export default DoubtModel;
