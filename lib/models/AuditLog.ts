import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  changeType: "create" | "update" | "delete" | "approve" | "reject" | "submit" | "lock";
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    entityType: {
      type: String,
      required: true,
      enum: ["GoalSheet", "GoalItem", "CheckIn", "User", "GoalCycle", "EscalationRule", "SharedGoal"],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changeType: {
      type: String,
      enum: ["create", "update", "delete", "approve", "reject", "submit", "lock"],
      required: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    reason: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use timestamp field instead
  }
);

// Index for faster queries
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ changedBy: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, changeType: 1 });

export const AuditLog = (mongoose.models.AuditLog as Model<IAuditLog>) || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
