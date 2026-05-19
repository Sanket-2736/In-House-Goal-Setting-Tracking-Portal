import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/manager/approvals/[sheetId]
 * Fetch full goal sheet with employee info for review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { sheetId } = await params;

    await connectDB();

    const goalSheet = await GoalSheet.findById(sheetId)
      .populate("employeeId", "name employeeId department email")
      .populate("cycleId", "name year");

    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
      );
    }

    // Verify the employee belongs to this manager
    const employee = await User.findById(goalSheet.employeeId);
    if (!employee || employee.managerId?.toString() !== manager.id) {
      return NextResponse.json(
        { error: "Unauthorized: Employee not under your management" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: goalSheet,
    });
  } catch (error) {
    console.error("Error fetching goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * PUT /api/manager/approvals/[sheetId]
 * Update goal inline (manager edits target and weightage)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { sheetId } = await params;
    const body = await request.json();

    const { goalId, target, weightage } = body;

    if (!goalId || target === undefined || weightage === undefined) {
      return NextResponse.json(
        { error: "goalId, target, and weightage are required" },
        { status: 400 }
      );
    }

    if (weightage < 0 || weightage > 100) {
      return NextResponse.json(
        { error: "Weightage must be between 0 and 100" },
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

    // Find and update the goal
    const goal = goalSheet.goals.find((g) => g._id?.toString() === goalId);
    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    const oldTarget = goal.target;
    const oldWeightage = goal.weightage;

    goal.target = target;
    goal.weightage = weightage;

    // Validate total weightage
    const totalWeightage = goalSheet.goals.reduce(
      (sum, g) => sum + (g.weightage || 0),
      0
    );

    if (totalWeightage > 100) {
      return NextResponse.json(
        {
          error: `Total weightage exceeds 100% (current: ${totalWeightage}%)`,
        },
        { status: 400 }
      );
    }

    await goalSheet.save();

    return NextResponse.json({
      success: true,
      message: "Goal updated",
      data: goalSheet,
      changes: {
        goalId,
        oldTarget,
        newTarget: target,
        oldWeightage,
        newWeightage: weightage,
      },
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
