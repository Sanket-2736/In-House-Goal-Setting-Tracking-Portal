import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { EscalationLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * GET /api/admin/escalations/logs
 * List escalation logs with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const triggerType = searchParams.get("triggerType");

    await connectDB();

    const filter: any = {};
    if (status) filter.status = status;
    if (triggerType) filter.triggerType = triggerType;

    const logs = await EscalationLog.find(filter)
      .populate("userId", "name email employeeId")
      .populate("managerId", "name email")
      .populate("ruleId", "triggerType daysAfterTrigger")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EscalationLog.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching escalation logs:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
