import mongoose, { Document, Model, Schema } from "mongoose";

interface IDevice extends Document {
  userId: string;
  deviceId: string;
  platform: string;
  model: string;
  lastLogin: Date;
}

const deviceSchema = new Schema<IDevice>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  platform: String,
  model: String,
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Ensure deviceId is unique per user
deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const DeviceModel: Model<IDevice> = mongoose.model("Device", deviceSchema);

export default DeviceModel;
