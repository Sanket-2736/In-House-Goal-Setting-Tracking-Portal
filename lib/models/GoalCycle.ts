import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoalCycle extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  year: number;
  phase1Open: Date;
  q1Open: Date;
  q2Open: Date;
  q3Open: Date;
  q4Open: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const goalCycleSchema = new Schema<IGoalCycle>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    phase1Open: {
      type: Date,
      required: true,
    },
    q1Open: {
      type: Date,
      required: true,
    },
    q2Open: {
      type: Date,
      required: true,
    },
    q3Open: {
      type: Date,
      required: true,
    },
    q4Open: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
goalCycleSchema.index({ year: 1 });
goalCycleSchema.index({ isActive: 1 });
goalCycleSchema.index({ createdBy: 1 });

export const GoalCycle = (mongoose.models.GoalCycle as Model<IGoalCycle>) || mongoose.model<IGoalCycle>("GoalCycle", goalCycleSchema);
