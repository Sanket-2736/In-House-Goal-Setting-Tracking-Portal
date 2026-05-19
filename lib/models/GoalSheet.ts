import mongoose, { Schema, Document, Model } from "mongoose";

// Quarterly Achievement embedded schema
export interface IQuarterlyAchievement {
  _id?: mongoose.Types.ObjectId;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  actual: number;
  completionDate?: Date;
  status: "not_started" | "on_track" | "completed";
  progressScore?: number; // Computed field
  updatedAt?: Date;
}

const quarterlyAchievementSchema = new Schema<IQuarterlyAchievement>(
  {
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    actual: {
      type: Number,
      default: 0,
    },
    completionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["not_started", "on_track", "completed"],
      default: "not_started",
    },
    progressScore: {
      type: Number,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Goal Item embedded schema
export interface IGoalItem {
  _id?: mongoose.Types.ObjectId;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: "numeric_min" | "numeric_max" | "timeline" | "zero";
  target: number;
  targetDate?: Date; // For timeline UoM
  weightage: number;
  isShared: boolean;
  sharedFromId?: mongoose.Types.ObjectId;
  achievements: IQuarterlyAchievement[];
  status: "not_started" | "on_track" | "completed";
}

const goalItemSchema = new Schema<IGoalItem>(
  {
    thrustArea: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    uomType: {
      type: String,
      enum: ["numeric_min", "numeric_max", "timeline", "zero"],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: Date,
    },
    weightage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedFromId: {
      type: Schema.Types.ObjectId,
    },
    achievements: [quarterlyAchievementSchema],
    status: {
      type: String,
      enum: ["not_started", "on_track", "completed"],
      default: "not_started",
    },
  },
  { _id: true }
);

// Goal Sheet main schema
export interface IGoalSheet extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  status: "draft" | "submitted" | "approved" | "returned" | "locked";
  managerComment?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  lockedAt?: Date;
  goals: IGoalItem[];
  totalWeightage?: number; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

const goalSheetSchema = new Schema<IGoalSheet>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "GoalCycle",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "returned", "locked"],
      default: "draft",
    },
    managerComment: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    lockedAt: {
      type: Date,
    },
    goals: [goalItemSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual field for total weightage
goalSheetSchema.virtual("totalWeightage").get(function () {
  return this.goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
});

// Ensure virtuals are included in JSON
goalSheetSchema.set("toJSON", { virtuals: true });

// Index for faster queries
goalSheetSchema.index({ employeeId: 1, cycleId: 1 }, { unique: true });
goalSheetSchema.index({ cycleId: 1 });
goalSheetSchema.index({ status: 1 });
goalSheetSchema.index({ employeeId: 1 });

export const GoalSheet = (mongoose.models.GoalSheet as Model<IGoalSheet>) || mongoose.model<IGoalSheet>("GoalSheet", goalSheetSchema);
