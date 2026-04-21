import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDoubtReply extends Document {
  doubtId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  isTeacherReply: boolean;
  attachments: {
    public_id: string;
    url: string;
  }[];
}

const doubtReplySchema = new Schema<IDoubtReply>({
  doubtId: {
    type: Schema.Types.ObjectId,
    ref: "Doubt",
    required: true,
  },
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
  isTeacherReply: {
    type: Boolean,
    default: false,
  },
  attachments: [
    {
      public_id: String,
      url: String,
    },
  ],
}, { timestamps: true });

const DoubtReplyModel: Model<IDoubtReply> = mongoose.model("DoubtReply", doubtReplySchema);

export default DoubtReplyModel;
