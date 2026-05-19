import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEscalationRule extends Document {
  _id: mongoose.Types.ObjectId;
  triggerType: "goal_not_submitted" | "goal_not_approved" | "checkin_not_completed";
  daysAfterTrigger: number;
  notifyRecipients: ("employee" | "manager" | "skip_level" | "hr")[];
  escalationChain: Array<{
    tier: number;
    daysAfter: number;
    notifyRecipients: ("employee" | "manager" | "skip_level" | "hr")[];
  }>;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const escalationChainSchema = new Schema(
  {
    tier: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    daysAfter: {
      type: Number,
      required: true,
      min: 1,
    },
    notifyRecipients: {
      type: [String],
      enum: ["employee", "manager", "skip_level", "hr"],
      required: true,
    },
  },
  { _id: false }
);

const escalationRuleSchema = new Schema<IEscalationRule>(
  {
    triggerType: {
      type: String,
      enum: ["goal_not_submitted", "goal_not_approved", "checkin_not_completed"],
      required: true,
    },
    daysAfterTrigger: {
      type: Number,
      required: true,
      min: 1,
    },
    notifyRecipients: {
      type: [String],
      enum: ["employee", "manager", "skip_level", "hr"],
      required: true,
    },
    escalationChain: [escalationChainSchema],
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

escalationRuleSchema.index({ triggerType: 1 });
escalationRuleSchema.index({ isActive: 1 });
escalationRuleSchema.index({ createdBy: 1 });

export const EscalationRule =
  (mongoose.models.EscalationRule as Model<IEscalationRule>) ||
  mongoose.model<IEscalationRule>("EscalationRule", escalationRuleSchema);
