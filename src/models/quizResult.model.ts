import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuizResult extends Document {
  userId: string;
  courseId: string;
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeTaken: number; // in seconds
  accuracy: number;
  answers: {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    timeTaken: number;
  }[];
}

const quizResultSchema = new Schema<IQuizResult>({
  userId: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  lessonId: {
    type: String,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  incorrectAnswers: {
    type: Number,
    required: true,
  },
  skippedQuestions: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
      timeTaken: Number,
    },
  ],
}, { timestamps: true });

const QuizResultModel: Model<IQuizResult> = mongoose.model("QuizResult", quizResultSchema);

export default QuizResultModel;
