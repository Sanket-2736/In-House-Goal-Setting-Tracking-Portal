import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet } from "@/lib/models";
import { handleDBError, createAuditLog } from "@/lib/db/utils";

/**
 * POST /api/goals/sheet/submit
 * Submit goal sheet for approval
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { goalSheetId } = body;

    if (!goalSheetId) {
      return NextResponse.json(
        { error: "goalSheetId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const goalSheet = await GoalSheet.findById(goalSheetId);

    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
      );
    }

    if (goalSheet.employeeId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!goalSheet.goals || goalSheet.goals.length === 0) {
      return NextResponse.json(
        { error: "Goal sheet must contain at least one goal" },
        { status: 400 }
      );
    }

    if (goalSheet.goals.length > 8) {
      return NextResponse.json(
        { error: "Maximum 8 goals allowed" },
        { status: 400 }
      );
    }

    const totalWeightage = goalSheet.goals.reduce(
      (sum, goal) => sum + (goal.weightage || 0),
      0
    );

    if (totalWeightage !== 100) {
      return NextResponse.json(
        { error: `Total weightage must equal 100% (current: ${totalWeightage}%)` },
        { status: 400 }
      );
    }

    for (const goal of goalSheet.goals) {
      if (!goal.title || !goal.thrustArea || !goal.uomType) {
        return NextResponse.json(
          { error: "All goals must have title, thrust area, and UoM type" },
          { status: 400 }
        );
      }

      if ((goal.weightage || 0) < 10) {
        return NextResponse.json(
          { error: "Each goal weightage must be at least 10%" },
          { status: 400 }
        );
      }

      if (goal.uomType === "timeline" && !goal.targetDate) {
        return NextResponse.json(
          { error: "Timeline goals must have a target date" },
          { status: 400 }
        );
      }

      if (["numeric_min", "numeric_max", "zero"].includes(goal.uomType) && goal.target === undefined) {
        return NextResponse.json(
          { error: "Numeric goals must have a target value" },
          { status: 400 }
        );
      }
    }

    const previousStatus = goalSheet.status;
    goalSheet.status = "submitted";
    goalSheet.submittedAt = new Date();
    await goalSheet.save();

    await createAuditLog({
      entityType: "GoalSheet",
      entityId: goalSheet._id,
      changedBy: user.id,
      changeType: "submit",
      previousValue: { status: previousStatus },
      newValue: { status: "submitted" },
      reason: "Employee submitted goal sheet for approval",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Goal sheet submitted for approval",
        data: goalSheet,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
