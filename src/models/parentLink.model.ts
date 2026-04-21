import mongoose, { Document, Model, Schema } from "mongoose";

export interface IParentLink extends Document {
  parentId: string;
  studentId: string;
  status: "pending" | "approved" | "rejected";
}

const parentLinkSchema = new Schema<IParentLink>({
  parentId: {
    type: String,
    required: true,
    index: true,
  },
  studentId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

// Ensure a student can only be linked to a specific parent once
parentLinkSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

const ParentLinkModel: Model<IParentLink> = mongoose.model("ParentLink", parentLinkSchema);

export default ParentLinkModel;
