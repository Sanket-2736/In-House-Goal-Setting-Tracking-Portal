import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationToken extends Document {
  email: string;
  token: string;
  expires: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationToken = mongoose.models.VerificationToken || mongoose.model<IVerificationToken>("VerificationToken", verificationTokenSchema);
