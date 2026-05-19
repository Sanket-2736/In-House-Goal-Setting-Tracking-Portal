import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICheckIn extends Document {
  _id: mongoose.Types.ObjectId;
  goalSheetId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  comment?: string;
  checkInDate: Date;
  cycleId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checkInSchema = new Schema<ICheckIn>(
  {
    goalSheetId: {
      type: Schema.Types.ObjectId,
      ref: "GoalSheet",
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    comment: {
      type: String,
    },
    checkInDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "GoalCycle",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

checkInSchema.index({ goalSheetId: 1 });
checkInSchema.index({ managerId: 1 });
checkInSchema.index({ employeeId: 1 });
checkInSchema.index({ cycleId: 1 });
checkInSchema.index({ quarter: 1 });
checkInSchema.index({ goalSheetId: 1, quarter: 1 }, { unique: true });

export const CheckIn = (mongoose.models.CheckIn as Model<ICheckIn>) || mongoose.model<ICheckIn>("CheckIn", checkInSchema);
