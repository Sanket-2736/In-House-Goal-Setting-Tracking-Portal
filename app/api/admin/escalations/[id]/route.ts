import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connection";
import { EscalationRule, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * PUT /api/admin/escalations/[id]
 * Update an escalation rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("admin");
    const { id } = await params;
    const body = await request.json();

    const {
      triggerType,
      daysAfterTrigger,
      notifyRecipients,
      escalationChain,
      isActive,
    } = body;

    await connectDB();

    const rule = await EscalationRule.findById(id);
    if (!rule) {
      return NextResponse.json(
        { error: "Escalation rule not found" },
        { status: 404 }
      );
    }

    const oldValue = rule.toObject();

    // Update fields
    if (triggerType) rule.triggerType = triggerType;
    if (daysAfterTrigger) rule.daysAfterTrigger = daysAfterTrigger;
    if (notifyRecipients) rule.notifyRecipients = notifyRecipients;
    if (escalationChain) rule.escalationChain = escalationChain;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    // Log audit
    await AuditLog.create({
      changedBy: new Types.ObjectId(user.id),
      entityType: "EscalationRule",
      entityId: rule._id,
      changeType: "update",
      previousValue: oldValue,
      newValue: rule.toObject(),
      reason: "Escalation rule updated",
    });

    return NextResponse.json({
      success: true,
      message: "Escalation rule updated successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Error updating escalation rule:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * DELETE /api/admin/escalations/[id]
 * Delete an escalation rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("admin");
    const { id } = await params;

    await connectDB();

    const rule = await EscalationRule.findByIdAndDelete(id);
    if (!rule) {
      return NextResponse.json(
        { error: "Escalation rule not found" },
        { status: 404 }
      );
    }

    // Log audit
    await AuditLog.create({
      changedBy: new Types.ObjectId(user.id),
      entityType: "EscalationRule",
      entityId: rule._id,
      changeType: "delete",
      previousValue: rule.toObject(),
      reason: "Escalation rule deleted",
    });

    return NextResponse.json({
      success: true,
      message: "Escalation rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting escalation rule:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
