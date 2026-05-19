import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { AuditLog, User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/admin/audit
 * Fetch audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can access audit logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    await connectDB();

    const query: any = {};

    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) {
        query.timestamp.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.timestamp.$lte = new Date(toDate);
      }
    }

    if (userId) {
      query.changedBy = new Types.ObjectId(userId);
    }

    if (entityType) {
      query.entityType = entityType;
    }

    const auditLogs = await AuditLog.find(query)
      .populate("changedBy", "name email")
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const totalCount = await AuditLog.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: auditLogs,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
