import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
  courseId?: string;
  batchId?: string;
  userId: string;
  payment_info: object;
  payment_type?: string;
}

const orderSchema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
    },
    batchId: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
      // required: true,
    },
    payment_type: {
        type: String,
        default: "razorpay"
    }
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;
