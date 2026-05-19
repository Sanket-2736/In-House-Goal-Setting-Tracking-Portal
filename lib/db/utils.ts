import { connectDB } from "./mongoose";
import { AuditLog } from "@/lib/models";
import { Types } from "mongoose";
import { AuditChangeType, AuditEntityType } from "@/types";

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  entityType,
  entityId,
  changedBy,
  changeType,
  previousValue,
  newValue,
  reason,
}: {
  entityType: AuditEntityType;
  entityId: string | Types.ObjectId;
  changedBy: string | Types.ObjectId;
  changeType: AuditChangeType;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
}): Promise<void> {
  try {
    await connectDB();

    await AuditLog.create({
      entityType,
      entityId: new Types.ObjectId(entityId),
      changedBy: new Types.ObjectId(changedBy),
      changeType,
      previousValue,
      newValue,
      reason,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType: AuditEntityType,
  entityId: string | Types.ObjectId,
  limit: number = 50
) {
  try {
    await connectDB();

    return await AuditLog.find({
      entityType,
      entityId: new Types.ObjectId(entityId),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("changedBy", "name email");
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

/**
 * Convert MongoDB document to DTO (remove sensitive fields)
 */
export function toDTO<T extends Record<string, any>>(doc: T): T {
  if (!doc) return doc;

  const obj = doc.toObject ? doc.toObject() : { ...doc };

  // Remove sensitive fields
  delete (obj as any).password;
  delete (obj as any).__v;

  // Convert ObjectId to string
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }

  return obj;
}

/**
 * Convert array of MongoDB documents to DTOs
 */
export function toDTOArray<T extends Record<string, any>>(docs: T[]): T[] {
  return docs.map(toDTO);
}

/**
 * Handle database errors
 */
export function handleDBError(error: any): { message: string; statusCode: number } {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      message: `${field} already exists`,
      statusCode: 409,
    };
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors)
      .map((err: any) => err.message)
      .join(", ");
    return {
      message: `Validation error: ${messages}`,
      statusCode: 400,
    };
  }

  if (error.name === "CastError") {
    return {
      message: "Invalid ID format",
      statusCode: 400,
    };
  }

  return {
    message: error.message || "Database error",
    statusCode: 500,
  };
}
