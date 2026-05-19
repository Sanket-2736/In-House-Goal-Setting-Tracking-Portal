import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { SharedGoal, GoalSheet, User, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * PUT /api/admin/shared-goals/[id]/recipients
 * Update recipients and their weightages for a shared goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can update shared goals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipientUpdates } = body;

    if (!Array.isArray(recipientUpdates) || recipientUpdates.length === 0) {
      return NextResponse.json(
        { error: "recipientUpdates must be a non-empty array" },
        { status: 400 }
      );
    }

    await connectDB();

    const sharedGoal = await SharedGoal.findById(id);
    if (!sharedGoal) {
      return NextResponse.json(
        { error: "Shared goal not found" },
        { status: 404 }
      );
    }

    for (const update of recipientUpdates) {
      const recipientIndex = sharedGoal.recipients.findIndex(
        (r) => r.employeeId.toString() === update.employeeId
      );

      if (recipientIndex !== -1) {
        const oldWeightage = sharedGoal.recipients[recipientIndex].weightage;
        sharedGoal.recipients[recipientIndex].weightage = update.weightage;

        if (sharedGoal.recipients[recipientIndex].goalSheetId) {
          const goalSheet = await GoalSheet.findById(
            sharedGoal.recipients[recipientIndex].goalSheetId
          );

          if (goalSheet) {
            const goalIndex = goalSheet.goals.findIndex(
              (g) => g.sharedFromId?.toString() === sharedGoal._id.toString()
            );

            if (goalIndex !== -1) {
              goalSheet.goals[goalIndex].weightage = update.weightage;
              await goalSheet.save();
            }
          }
        }

        await AuditLog.create({
          entityType: "SharedGoal",
          entityId: sharedGoal._id,
          changedBy: new Types.ObjectId(user.id),
          changeType: "update",
          previousValue: {
            weightage: oldWeightage,
            employeeId: update.employeeId,
          },
          newValue: {
            weightage: update.weightage,
            employeeId: update.employeeId,
          },
          reason: "Shared goal weightage updated",
        });
      }
    }

    await sharedGoal.save();

    return NextResponse.json({
      success: true,
      message: "Recipients updated successfully",
      data: sharedGoal,
    });
  } catch (error) {
    console.error("Error updating recipients:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
