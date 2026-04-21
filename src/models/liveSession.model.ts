import mongoose, { Document, Model, Schema } from "mongoose";

interface IPollOption {
  option: string;
  votes: number;
}

interface IPoll {
  _id?: string;
  question: string;
  options: IPollOption[];
  active: boolean;
}

interface IQuestion {
    _id?: string;
    userId: string;
    userName: string;
    question: string;
    isAnswered: boolean;
    createdAt: Date;
}

export interface ILiveSession extends Document {
  title: string;
  description: string;
  batchId: string;
  subjectId: string;
  teacherId: string;
  status: "scheduled" | "live" | "ended";
  startTime: Date;
  endTime?: Date;
  agoraChannel: string;
  agoraToken?: string;
  polls: IPoll[];
  questions: IQuestion[];
}

const pollOptionSchema = new Schema<IPollOption>({
  option: String,
  votes: { type: Number, default: 0 },
});

const questionSchema = new Schema<IQuestion>({
    userId: String,
    userName: String,
    question: String,
    isAnswered: { type: Boolean, default: false },
}, { timestamps: true });

const pollSchema = new Schema<IPoll>({
  question: String,
  options: [pollOptionSchema],
  active: { type: Boolean, default: true },
});

const liveSessionSchema = new Schema<ILiveSession>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  batchId: { type: String, required: true },
  subjectId: { type: String, required: true },
  teacherId: { type: String, required: true },
  status: {
    type: String,
    enum: ["scheduled", "live", "ended"],
    default: "scheduled",
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  agoraChannel: { type: String, required: true },
  agoraToken: String,
  polls: [pollSchema],
  questions: [questionSchema],
}, { timestamps: true });

const LiveSessionModel: Model<ILiveSession> = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSessionModel;
