import mongoose, { Document, Schema,Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
const emailRegexPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
    name: string;
    email: string;
    phoneNumber?: string;
    password: string;
    avatar: {
    public_id: string;
    url: string;
  },
  role: string;
  isVerified: boolean;
  courses: Array<{
    courseId: string;
    progress: Array<{
      contentId: string;
      timestamp: number;
    }>;
    quizScores: Array<{
      contentId: string;
      score: number;
      total: number;
      correct: number;
      incorrect: number;
      skipped: number;
      totalTime: number;
    }>;
  }>;
  batches: string[]; // Array of Batch IDs
  subscription?: {
    planTier: "free" | "basic" | "pro";
    expiryDate: Date;
  };
  pushToken?: string;
  referralCode: string;
  referredBy?: string;
  referralPoints: number;
  xp: number;
  level: number;
  streak: number;
  lastStudyDate?: Date;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  followersCount: number;
  followingCount: number;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;

}

const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
        },
    email:{
        type: String,
        required: [true, "Please enter your email"],
        validate:{
            validator: function(value: string) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email address"
          },
        unique: true
        },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true, // Allow multiple nulls if not provided
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false,
        },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        enum: ["admin", "teacher", "student", "parent"],
        default: "student"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses:[
        {
            courseId: String,
            progress: [
              {
                contentId: String,
                timestamp: Number,
              }
            ],
            quizScores: [
              {
                contentId: String,
                score: Number,
                total: Number,
                correct: Number,
                incorrect: Number,
                skipped: Number,
                totalTime: Number,
              }
            ]
        },
    ],
    batches: [
        {
            type: String, // Storing batch IDs as strings
        }
    ],
    subscription: {
        planTier: {
            type: String,
            enum: ["free", "basic", "pro"],
            default: "free"
        },
        expiryDate: Date
    },
    pushToken: {
        type: String,
        default: ""
    },
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: String
    },
    referralPoints: {
        type: Number,
        default: 0
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    streak: {
        type: Number,
        default: 0
    },
    lastStudyDate: Date,
    followers: [
        {
            type: String,
        }
    ],
    following: [
        {
            type: String,
        }
    ],
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    }
},{ timestamps: true });

        
// Hash the password before saving the user
userSchema.pre<IUser>('save', async function() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    
    if (!this.referralCode) {
        this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
});

// sign access token   
userSchema.methods.SignAccessToken = function() {
    return jwt.sign({ id: this._id, role: this.role }, process.env.ACCESS_TOKEN || '');
}  

// sign refresh token 

userSchema.methods.SignRefreshToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.REFRESH_TOKEN || '');
   }


// Method to compare password

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {

    return await bcrypt.compare(password, this.password);
}



const userModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default userModel;


