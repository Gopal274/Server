import mongoose, { Document, Model, Schema } from "mongoose";

interface IResource extends Document {
  title: string;
  description: string;
  file: {
    public_id: string;
    url: string;
  };
  lessonId: string;
  courseId: string;
  type: "pdf" | "image" | "document";
}

const resourceSchema = new Schema<IResource>({
  title: {
    type: String,
    required: true,
  },
  description: String,
  file: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  lessonId: {
    type: String,
    required: true,
    index: true,
  },
  courseId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["pdf", "image", "document"],
    default: "pdf",
  },
}, { timestamps: true });

const ResourceModel: Model<IResource> = mongoose.model("Resource", resourceSchema);

export default ResourceModel;
