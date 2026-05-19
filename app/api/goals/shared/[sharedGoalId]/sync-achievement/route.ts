import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { SharedGoal, GoalSheet, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";
import { calculateProgressScore } from "@/lib/utils/progressScore";

/**
 * POST /api/goals/shared/[sharedGoalId]/sync-achievement
 * Sync achievement from primary owner to all recipients
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sharedGoalId: string }> }
) {
  try {
    const { sharedGoalId } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { quarter, actual, completionDate, status } = body;

    if (!quarter || actual === undefined || !status) {
      return NextResponse.json(
        { error: "Missing required fields: quarter, actual, status" },
        { status: 400 }
      );
    }

    await connectDB();

    const sharedGoal = await SharedGoal.findById(sharedGoalId);
    if (!sharedGoal) {
      return NextResponse.json(
        { error: "Shared goal not found" },
        { status: 404 }
      );
    }

    // Find primary owner (first recipient)
    const primaryOwner = sharedGoal.recipients[0];
    if (!primaryOwner) {
      return NextResponse.json(
        { error: "No primary owner found for shared goal" },
        { status: 400 }
      );
    }

    // Verify user is the primary owner
    if (primaryOwner.employeeId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Only primary owner can sync achievements" },
        { status: 403 }
      );
    }

    // Get primary owner's goal sheet
    const primaryGoalSheet = await GoalSheet.findById(
      primaryOwner.goalSheetId
    );
    if (!primaryGoalSheet) {
      return NextResponse.json(
        { error: "Primary owner's goal sheet not found" },
        { status: 404 }
      );
    }

    // Find the shared goal in primary owner's sheet
    const primaryGoalIndex = primaryGoalSheet.goals.findIndex(
      (g) => g.sharedFromId?.toString() === sharedGoal._id.toString()
    );

    if (primaryGoalIndex === -1) {
      return NextResponse.json(
        { error: "Shared goal not found in primary owner's sheet" },
        { status: 404 }
      );
    }

    // Calculate progress score
    const progressScore = calculateProgressScore(
      sharedGoal.uomType,
      actual,
      sharedGoal.target,
      sharedGoal.targetDate
    );

    // Update primary owner's achievement
    let achievementIndex = primaryGoalSheet.goals[primaryGoalIndex].achievements.findIndex(
      (a) => a.quarter === quarter
    );

    if (achievementIndex === -1) {
      primaryGoalSheet.goals[primaryGoalIndex].achievements.push({
        quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4",
        actual,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        status,
        progressScore,
        updatedAt: new Date(),
      });
    } else {
      primaryGoalSheet.goals[primaryGoalIndex].achievements[achievementIndex] = {
        quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4",
        actual,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        status,
        progressScore,
        updatedAt: new Date(),
      };
    }

    await primaryGoalSheet.save();

    // Sync to all other recipients
    for (let i = 1; i < sharedGoal.recipients.length; i++) {
      const recipient = sharedGoal.recipients[i];
      const recipientGoalSheet = await GoalSheet.findById(
        recipient.goalSheetId
      );

      if (recipientGoalSheet) {
        const recipientGoalIndex = recipientGoalSheet.goals.findIndex(
          (g) => g.sharedFromId?.toString() === sharedGoal._id.toString()
        );

        if (recipientGoalIndex !== -1) {
          let recipientAchievementIndex = recipientGoalSheet.goals[
            recipientGoalIndex
          ].achievements.findIndex((a) => a.quarter === quarter);

          if (recipientAchievementIndex === -1) {
            recipientGoalSheet.goals[recipientGoalIndex].achievements.push({
              quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4",
              actual,
              completionDate: completionDate ? new Date(completionDate) : undefined,
              status,
              progressScore,
              updatedAt: new Date(),
            });
          } else {
            recipientGoalSheet.goals[recipientGoalIndex].achievements[
              recipientAchievementIndex
            ] = {
              quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4",
              actual,
              completionDate: completionDate ? new Date(completionDate) : undefined,
              status,
              progressScore,
              updatedAt: new Date(),
            };
          }

          await recipientGoalSheet.save();

          // Create audit log for sync
          await AuditLog.create({
            entityType: "SharedGoal",
            entityId: sharedGoal._id,
            changedBy: new Types.ObjectId(user.id),
            changeType: "update",
            newValue: {
              quarter,
              actual,
              progressScore,
              syncedTo: recipient.employeeId,
            },
            reason: "Achievement synced from primary owner",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Achievement synced to all recipients",
      data: {
        quarter,
        actual,
        progressScore,
        syncedTo: sharedGoal.recipients.length - 1,
      },
    });
  } catch (error) {
    console.error("Error syncing achievement:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
