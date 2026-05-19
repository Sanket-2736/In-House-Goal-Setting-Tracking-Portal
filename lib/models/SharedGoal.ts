import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISharedGoalRecipient {
  employeeId: mongoose.Types.ObjectId;
  weightage: number;
  goalSheetId?: mongoose.Types.ObjectId;
  isPrimaryOwner?: boolean;
}

export interface ISharedGoal extends Document {
  _id: mongoose.Types.ObjectId;
  sourceGoalId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  target: number;
  targetDate?: Date;
  uomType: "numeric_min" | "numeric_max" | "timeline" | "zero";
  thrustArea: string;
  cycleId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  recipients: ISharedGoalRecipient[];
  createdAt: Date;
  updatedAt: Date;
}

const sharedGoalRecipientSchema = new Schema<ISharedGoalRecipient>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weightage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    goalSheetId: {
      type: Schema.Types.ObjectId,
      ref: "GoalSheet",
    },
    isPrimaryOwner: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const sharedGoalSchema = new Schema<ISharedGoal>(
  {
    sourceGoalId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    target: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: Date,
    },
    uomType: {
      type: String,
      enum: ["numeric_min", "numeric_max", "timeline", "zero"],
      required: true,
    },
    thrustArea: {
      type: String,
      required: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "GoalCycle",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: [sharedGoalRecipientSchema],
  },
  {
    timestamps: true,
  }
);

sharedGoalSchema.index({ cycleId: 1 });
sharedGoalSchema.index({ createdBy: 1 });
sharedGoalSchema.index({ sourceGoalId: 1 });
sharedGoalSchema.index({ "recipients.employeeId": 1 });

export const SharedGoal = (mongoose.models.SharedGoal as Model<ISharedGoal>) || mongoose.model<ISharedGoal>("SharedGoal", sharedGoalSchema);
