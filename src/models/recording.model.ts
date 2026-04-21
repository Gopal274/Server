import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRecording extends Document {
  courseId: string;
  channelName: string;
  resourceId: string;
  sid: string;
  status: "started" | "stopped" | "uploaded";
  videoUrl?: string;
}

const recordingSchema = new Schema<IRecording>({
  courseId: {
    type: String,
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
    required: true,
  },
  sid: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["started", "stopped", "uploaded"],
    default: "started",
  },
  videoUrl: String,
}, { timestamps: true });

const RecordingModel: Model<IRecording> = mongoose.model("Recording", recordingSchema);

export default RecordingModel;
