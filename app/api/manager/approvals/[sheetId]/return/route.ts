import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, AuditLog, Notification } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * POST /api/manager/approvals/[sheetId]/return
 * Return goal sheet for rework with mandatory comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { sheetId } = await params;
    const body = await request.json();

    const { comment } = body;

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment is required when returning for rework" },
        { status: 400 }
      );
    }

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
    const previousStatus = goalSheet.status;
    goalSheet.status = "returned";
    goalSheet.managerComment = comment;
    await goalSheet.save();

    // Create audit log
    await AuditLog.create({
      entityType: "GoalSheet",
      entityId: new Types.ObjectId(sheetId),
      changedBy: new Types.ObjectId(manager.id),
      changeType: "reject",
      previousValue: { status: previousStatus },
      newValue: { status: "returned" },
      reason: comment,
    });

    // Create notification for employee
    await Notification.create({
      userId: goalSheet.employeeId,
      type: "return",
      title: "Goals Returned for Rework",
      message: `Your goal sheet has been returned for rework. Comment: ${comment}`,
      relatedEntityId: new Types.ObjectId(sheetId),
      relatedEntityType: "GoalSheet",
    });

    return NextResponse.json({
      success: true,
      message: "Goal sheet returned for rework",
      data: goalSheet,
    });
  } catch (error) {
    console.error("Error returning goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
