import mongoose, { Document, Model, Schema } from "mongoose";

interface ISubject extends Document {
  title: string;
  teacherId: string; // User ID with role 'teacher'
  courseId: string;  // Link to a Course
}

interface IPlanDetail {
  id: "batch" | "infinity" | "pro";
  label: string;
  price: number;
  oldPrice: number;
  discount: string;
  popular?: boolean;
  features: string[];
}

interface IFaq {
  q: string;
  a: string;
}

interface IDemoVideo {
  title: string;
  subtitle: string;
  teacherName: string;
  teacherImage: string;
  videoUrl: string;
  duration: string;
  date: string;
}

interface IScheduleItem {
  label: string;
  icon: string;
  color: string;
  time?: string;
  day?: string;
}

interface IChapter {
  subjectId: string;
  name: string;
  progress: number;
}

export interface IBatch extends Document {
  name: string;
  description: string;
  category: string;
  language: string;
  examTarget: string;
  startDate: Date;
  price: number; 
  originalPrice: number;
  discount: string;
  duration: string; 
  subjects: ISubject[];
  purchased: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  whatsappGroupLink?: string;
  plans: IPlanDetail[];
  includes: string[];
  faqs: IFaq[];
  demoVideos: IDemoVideo[];
  schedule: IScheduleItem[];
  chapters: IChapter[];
  orientationVideo?: {
    url: string;
    thumbnail: string;
    description: string;
  };
  otherDetails?: {
    images: {
      public_id: string;
      url: string;
    }[];
    bannerText?: string;
  };
  validity: string;
  modeOfLectures: string;
  scheduleDescription: string;
  examGuidance: string;
}

const subjectSchema = new Schema<ISubject>({
  title: {
    type: String,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
});

const planDetailSchema = new Schema<IPlanDetail>({
  id: { type: String, enum: ["batch", "infinity", "pro"], required: true },
  label: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number, required: true },
  discount: { type: String, required: true },
  popular: { type: Boolean, default: false },
  features: [String],
});

const faqSchema = new Schema<IFaq>({
  q: { type: String, required: true },
  a: { type: String, required: true },
});

const demoVideoSchema = new Schema<IDemoVideo>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  teacherName: { type: String, required: true },
  teacherImage: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: String, required: true },
  date: { type: String, required: true },
});

const scheduleItemSchema = new Schema<IScheduleItem>({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  time: String,
  day: String,
});

const chapterSchema = new Schema<IChapter>({
  subjectId: { type: String, required: true },
  name: { type: String, required: true },
  progress: { type: Number, default: 0 },
});

const batchSchema = new Schema<IBatch>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: "Hinglish",
  },
  examTarget: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  discount: {
    type: String,
  },
  duration: {
    type: String,
    required: true,
  },
  subjects: [subjectSchema],
  purchased: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    public_id: String,
    url: String,
  },
  whatsappGroupLink: {
    type: String,
  },
  plans: [planDetailSchema],
  includes: [String],
  faqs: [faqSchema],
  demoVideos: [demoVideoSchema],
  schedule: [scheduleItemSchema],
  chapters: [chapterSchema],
  orientationVideo: {
    url: String,
    thumbnail: String,
    description: String,
  },
  otherDetails: {
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    bannerText: String,
  },
  validity: String,
  modeOfLectures: String,
  scheduleDescription: String,
  examGuidance: String,
}, { timestamps: true });

const BatchModel: Model<IBatch> = mongoose.model("Batch", batchSchema);

export default BatchModel;
