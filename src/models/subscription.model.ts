import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  expiryDate: Date;
  status: "active" | "expired" | "cancelled";
  paymentInfo: object;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: true,
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
  paymentInfo: {
    type: Object,
  },
}, { timestamps: true });

const SubscriptionModel: Model<ISubscription> = mongoose.model("Subscription", subscriptionSchema);

export default SubscriptionModel;
