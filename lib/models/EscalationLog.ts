import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEscalationLog extends Document {
  _id: mongoose.Types.ObjectId;
  ruleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  triggerType: "goal_not_submitted" | "goal_not_approved" | "checkin_not_completed";
  daysSinceTrigger: number;
  notifiedAt?: Date;
  resolvedAt?: Date;
  status: "pending" | "notified" | "resolved";
  notificationSentTo: ("employee" | "manager" | "skip_level" | "hr")[];
  createdAt: Date;
  updatedAt: Date;
}

const escalationLogSchema = new Schema<IEscalationLog>(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "EscalationRule",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    triggerType: {
      type: String,
      enum: ["goal_not_submitted", "goal_not_approved", "checkin_not_completed"],
      required: true,
    },
    daysSinceTrigger: {
      type: Number,
      required: true,
    },
    notifiedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "notified", "resolved"],
      default: "pending",
    },
    notificationSentTo: {
      type: [String],
      enum: ["employee", "manager", "skip_level", "hr"],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

escalationLogSchema.index({ userId: 1, triggerType: 1 });
escalationLogSchema.index({ ruleId: 1 });
escalationLogSchema.index({ status: 1 });
escalationLogSchema.index({ createdAt: -1 });

export const EscalationLog =
  (mongoose.models.EscalationLog as Model<IEscalationLog>) ||
  mongoose.model<IEscalationLog>("EscalationLog", escalationLogSchema);
