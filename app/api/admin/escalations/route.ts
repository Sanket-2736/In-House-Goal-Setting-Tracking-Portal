import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { EscalationRule, EscalationLog, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/admin/escalations
 * List all escalation rules with pagination
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectDB();

    const rules = await EscalationRule.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EscalationRule.countDocuments();

    return NextResponse.json({
      success: true,
      data: rules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching escalation rules:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/admin/escalations
 * Create a new escalation rule
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("admin");
    const body = await request.json();

    const {
      triggerType,
      daysAfterTrigger,
      notifyRecipients,
      escalationChain,
    } = body;

    if (!triggerType || !daysAfterTrigger || !notifyRecipients) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const rule = await EscalationRule.create({
      triggerType,
      daysAfterTrigger,
      notifyRecipients,
      escalationChain: escalationChain || [],
      isActive: true,
      createdBy: new Types.ObjectId(user.id),
    });

    // Log audit
    await AuditLog.create({
      changedBy: new Types.ObjectId(user.id),
      entityType: "EscalationRule",
      entityId: rule._id,
      changeType: "create",
      newValue: rule.toObject(),
      reason: "Escalation rule created",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Escalation rule created successfully",
        data: rule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating escalation rule:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
