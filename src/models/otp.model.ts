import mongoose, { Document, Model, Schema } from "mongoose";

interface IOTP extends Document {
  phoneNumber: string;
  otp: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  phoneNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 300 }, // 5 minutes TTL
  },
});

const OTPModel: Model<IOTP> = mongoose.model("OTP", otpSchema);

export default OTPModel;
