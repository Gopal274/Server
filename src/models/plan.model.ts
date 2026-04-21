import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  durationInMonths: number;
  features: string[];
  tier: "free" | "basic" | "pro";
  isActive: boolean;
}

const planSchema = new Schema<IPlan>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  durationInMonths: {
    type: Number,
    required: true,
  },
  features: [String],
  tier: {
    type: String,
    enum: ["free", "basic", "pro"],
    default: "free",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const PlanModel: Model<IPlan> = mongoose.model("Plan", planSchema);

export default PlanModel;
