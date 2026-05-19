import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, CheckIn } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/manager/checkins/[employeeId]?quarter=Q1
 * Fetch employee's achievement details for a quarter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const quarter = (searchParams.get("quarter") || "Q1") as "Q1" | "Q2" | "Q3" | "Q4";

    await connectDB();

    // Verify employee is under this manager
    const employee = await User.findById(employeeId);
    if (!employee || employee.managerId?.toString() !== manager.id) {
      return NextResponse.json(
        { error: "Unauthorized: Employee not under your management" },
        { status: 403 }
      );
    }

    // Get goal sheet
    const goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(employeeId),
      status: { $in: ["approved", "locked"] },
    }).populate("cycleId", "name year");

    if (!goalSheet) {
      return NextResponse.json(
        { error: "No approved goal sheet found" },
        { status: 404 }
      );
    }

    // Get check-in record
    let checkIn = await CheckIn.findOne({
      goalSheetId: goalSheet._id,
      quarter,
    });

    // Get achievements for this quarter
    const goalsWithAchievements = goalSheet.goals.map((goal) => {
      const achievement = goal.achievements?.find((a) => a.quarter === quarter);
      return {
        goalId: goal._id,
        title: goal.title,
        description: goal.description,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        target: goal.target,
        targetDate: goal.targetDate,
        weightage: goal.weightage,
        achievement: achievement || {
          quarter,
          actual: null,
          status: "not_started",
          progressScore: 0,
        },
      };
    });

    // Calculate weighted average progress
    const totalWeightage = goalsWithAchievements.reduce((sum, g) => sum + g.weightage, 0);
    const weightedProgress =
      totalWeightage > 0
        ? Math.round(
            goalsWithAchievements.reduce(
              (sum, g) => sum + ((g.achievement.progressScore || 0) * g.weightage) / 100,
              0
            )
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        employeeId: employee._id.toString(),
        employeeName: employee.name,
        employeeDepartment: employee.department,
        checkInId: checkIn?._id,
        goalSheetId: goalSheet._id,
        quarter,
        cycle: goalSheet.cycleId,
        goals: goalsWithAchievements,
        weightedProgress,
        comment: checkIn?.comment || null,
        checkInDate: checkIn?.checkInDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching employee check-in:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/manager/checkins/[employeeId]
 * Submit check-in comment and mark as complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const manager = await requireRole("manager");
    const { employeeId } = await params;
    const body = await request.json();

    const { quarter, comment, goalSheetId } = body as {
      quarter: "Q1" | "Q2" | "Q3" | "Q4";
      comment: string;
      goalSheetId: string;
    };

    if (!quarter || !comment || !goalSheetId) {
      return NextResponse.json(
        { error: "quarter, comment, and goalSheetId are required" },
        { status: 400 }
      );
    }

    // Validate comment
    if (comment.trim().length < 20) {
      return NextResponse.json(
        { error: "Comment must be at least 20 characters" },
        { status: 400 }
      );
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        { error: "Comment cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify employee is under this manager
    const employee = await User.findById(employeeId);
    if (!employee || employee.managerId?.toString() !== manager.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find or create check-in record
    let checkIn = await CheckIn.findOne({
      goalSheetId: new Types.ObjectId(goalSheetId),
      quarter,
    });

    if (checkIn) {
      // Update existing
      checkIn.comment = comment;
      checkIn.checkInDate = new Date();
      await checkIn.save();
    } else {
      // Create new
      checkIn = await CheckIn.create({
        goalSheetId: new Types.ObjectId(goalSheetId),
        employeeId: new Types.ObjectId(employeeId),
        managerId: new Types.ObjectId(manager.id),
        quarter,
        comment,
        checkInDate: new Date(),
        cycleId: (await GoalSheet.findById(goalSheetId))?.cycleId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in comment submitted",
      data: {
        checkInId: checkIn._id,
        comment: checkIn.comment,
        checkInDate: checkIn.checkInDate,
      },
    });
  } catch (error) {
    console.error("Error submitting check-in comment:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
