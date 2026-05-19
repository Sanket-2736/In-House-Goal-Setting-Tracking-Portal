import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * POST /api/admin/goals/[sheetId]/unlock
 * Unlock a goal sheet for editing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const admin = await requireRole("admin");
    const { sheetId } = await params;
    const body = await request.json();

    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason for unlock is required" },
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

    if (goalSheet.status !== "locked" && goalSheet.status !== "approved") {
      return NextResponse.json(
        { error: "Only locked or approved sheets can be unlocked" },
        { status: 400 }
      );
    }

    // Store previous status
    const previousStatus = goalSheet.status;

    // Unlock the sheet
    goalSheet.status = "approved";
    goalSheet.lockedAt = undefined;
    await goalSheet.save();

    // Create audit log
    await AuditLog.create({
      entityType: "GoalSheet",
      entityId: new Types.ObjectId(sheetId),
      changedBy: new Types.ObjectId(admin.id),
      changeType: "update",
      previousValue: { status: previousStatus, lockedAt: goalSheet.lockedAt },
      newValue: { status: "approved", lockedAt: null },
      reason: `Unlocked for editing: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "Goal sheet unlocked successfully",
      data: {
        sheetId: goalSheet._id,
        status: goalSheet.status,
        unlockedAt: new Date(),
        reason,
      },
    });
  } catch (error) {
    console.error("Error unlocking goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
