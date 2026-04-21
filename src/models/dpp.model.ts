import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDPPQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of options
  explanation?: string;
}

export interface IDPP extends Document {
  batchId: string;
  subjectId: string;
  chapterId: string;
  title: string;
  questions: IDPPQuestion[];
  dueDate?: Date;
}

const dppQuestionSchema = new Schema<IDPPQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: String,
});

const dppSchema = new Schema<IDPP>(
  {
    batchId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    questions: [dppQuestionSchema],
    dueDate: Date,
  },
  { timestamps: true }
);

const DPPModel: Model<IDPP> = mongoose.model("DPP", dppSchema);

export default DPPModel;
