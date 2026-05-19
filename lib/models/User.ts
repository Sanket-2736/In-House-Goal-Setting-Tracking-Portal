import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "employee" | "manager" | "admin";
  managerId?: mongoose.Types.ObjectId;
  department?: string;
  employeeId?: string;
  provider: "credentials" | "google";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      select: false,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ["employee", "manager", "admin"],
      default: "employee",
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: String,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ managerId: 1 });

export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);
