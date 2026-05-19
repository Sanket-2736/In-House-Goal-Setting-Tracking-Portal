import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, AuditLog, Notification } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * POST /api/manager/approvals/[sheetId]/approve
 * Approve goal sheet and lock it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { sheetId } = await params;

    await connectDB();

    const goalSheet = await GoalSheet.findById(sheetId);
    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
      );
    }

    // Verify authorization
    const employee = await User.findById(goalSheet.employeeId);
    if (!employee || employee.managerId?.toString() !== manager.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update goal sheet
    goalSheet.status = "approved";
    goalSheet.approvedAt = new Date();
    goalSheet.lockedAt = new Date();
    await goalSheet.save();

    // Create audit log
    await AuditLog.create({
      entityType: "GoalSheet",
      entityId: new Types.ObjectId(sheetId),
      changedBy: new Types.ObjectId(manager.id),
      changeType: "approve",
      newValue: {
        status: "approved",
        approvedAt: goalSheet.approvedAt,
        lockedAt: goalSheet.lockedAt,
      },
      reason: "Manager approval",
    });

    // Create notification for employee
    await Notification.create({
      userId: goalSheet.employeeId,
      type: "approval",
      title: "Goals Approved",
      message: `Your goal sheet for ${goalSheet.cycleId} has been approved by your manager.`,
      relatedEntityId: new Types.ObjectId(sheetId),
      relatedEntityType: "GoalSheet",
    });

    return NextResponse.json({
      success: true,
      message: "Goal sheet approved and locked",
      data: goalSheet,
    });
  } catch (error) {
    console.error("Error approving goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
