import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { SharedGoal, GoalSheet, User, GoalCycle, AuditLog } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/admin/shared-goals
 * Fetch all shared goals for a cycle
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admins can view shared goals
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can view shared goals" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const sharedGoals = await SharedGoal.find({
      cycleId: new Types.ObjectId(cycleId),
    })
      .populate("createdBy", "name email")
      .populate("recipients.employeeId", "name email department")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: sharedGoals,
    });
  } catch (error) {
    console.error("Error fetching shared goals:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/admin/shared-goals
 * Create a shared goal and push to recipients
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admins can create shared goals
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can create shared goals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate,
      cycleId,
      recipientIds,
      defaultWeightage = 10,
    } = body;

    // Validation
    if (!title || !thrustArea || !uomType || !target || !cycleId || !recipientIds || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (uomType === "timeline" && !targetDate) {
      return NextResponse.json(
        { error: "targetDate is required for timeline UoM" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify cycle exists
    const cycle = await GoalCycle.findById(cycleId);
    if (!cycle) {
      return NextResponse.json(
        { error: "Goal cycle not found" },
        { status: 404 }
      );
    }

    // Verify all recipients exist
    const recipients = await User.find({
      _id: { $in: recipientIds.map((id: string) => new Types.ObjectId(id)) },
      role: "employee",
    });

    if (recipients.length !== recipientIds.length) {
      return NextResponse.json(
        { error: "One or more recipients not found or are not employees" },
        { status: 400 }
      );
    }

    // Create shared goal
    const sharedGoal = await SharedGoal.create({
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate: uomType === "timeline" ? new Date(targetDate) : undefined,
      cycleId: new Types.ObjectId(cycleId),
      createdBy: new Types.ObjectId(user.id),
      recipients: recipientIds.map((id: string, index: number) => ({
        employeeId: new Types.ObjectId(id),
        weightage: defaultWeightage,
        isPrimaryOwner: index === 0, // First recipient is primary owner
      })),
    });

    // Push shared goal to each recipient's goal sheet
    for (const recipientId of recipientIds) {
      let goalSheet = await GoalSheet.findOne({
        employeeId: new Types.ObjectId(recipientId),
        cycleId: new Types.ObjectId(cycleId),
      });

      if (!goalSheet) {
        // Create goal sheet if it doesn't exist
        goalSheet = await GoalSheet.create({
          employeeId: new Types.ObjectId(recipientId),
          cycleId: new Types.ObjectId(cycleId),
          status: "draft",
          goals: [],
        });
      }

      // Add shared goal to goal sheet
      goalSheet.goals.push({
        thrustArea,
        title,
        description,
        uomType,
        target,
        targetDate: uomType === "timeline" ? new Date(targetDate) : undefined,
        weightage: defaultWeightage,
        isShared: true,
        sharedFromId: sharedGoal._id,
        achievements: [],
        status: "not_started",
      });

      await goalSheet.save();

      // Update recipient in shared goal with goalSheetId
      const recipientIndex = sharedGoal.recipients.findIndex(
        (r) => r.employeeId.toString() === recipientId
      );
      if (recipientIndex !== -1) {
        sharedGoal.recipients[recipientIndex].goalSheetId = goalSheet._id;
      }
    }

    await sharedGoal.save();

    // Create audit log
    await AuditLog.create({
      entityType: "SharedGoal",
      entityId: sharedGoal._id,
      changedBy: new Types.ObjectId(user.id),
      changeType: "create",
      newValue: {
        title,
        thrustArea,
        recipientCount: recipientIds.length,
      },
      reason: "Shared goal created and pushed to recipients",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shared goal created and pushed to recipients",
        data: sharedGoal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shared goal:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
