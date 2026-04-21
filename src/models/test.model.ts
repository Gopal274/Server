import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks?: number;
}

export interface ITest extends Document {
  batchId: string;
  type: "RBT" | "AITS";
  title: string;
  questions: ITestQuestion[];
  durationMinutes: number;
  scheduledDate: Date;
  active: boolean;
}

const testQuestionSchema = new Schema<ITestQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: String,
  marks: { type: Number, default: 4 },
});

const testSchema = new Schema<ITest>(
  {
    batchId: { type: String, required: true, index: true },
    type: { type: String, enum: ["RBT", "AITS"], required: true },
    title: { type: String, required: true },
    questions: [testQuestionSchema],
    durationMinutes: { type: Number, required: true },
    scheduledDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TestModel: Model<ITest> = mongoose.model("Test", testSchema);

export default TestModel;
