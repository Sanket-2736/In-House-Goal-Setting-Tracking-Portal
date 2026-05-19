import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, CheckIn, GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";
import { calculateProgressScore } from "@/lib/utils/progressScore";
import { getCurrentQuarter, isInCheckInWindow } from "@/lib/utils/quarter";

/**
 * GET /api/employee/checkin?quarter=Q1&cycleId=
 * Get current achievements for a quarter
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter") as "Q1" | "Q2" | "Q3" | "Q4" | null;
    const cycleId = searchParams.get("cycleId");

    if (!quarter || !cycleId) {
      return NextResponse.json(
        { error: "quarter and cycleId are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(cycleId)) {
      return NextResponse.json(
        { error: "Invalid cycleId format" },
        { status: 400 }
      );
    }

    await connectDB();

    const goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(user.id),
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] },
    }).populate("cycleId");

    if (!goalSheet) {
      return NextResponse.json(
        { error: "No approved goal sheet found" },
        { status: 404 }
      );
    }

    let checkIn = await CheckIn.findOne({
      goalSheetId: goalSheet._id,
      quarter,
    });

    if (!checkIn) {
      checkIn = await CheckIn.create({
        goalSheetId: goalSheet._id,
        employeeId: new Types.ObjectId(user.id),
        managerId: goalSheet.employeeId,
        quarter,
        cycleId: new Types.ObjectId(cycleId),
        checkInDate: new Date(),
      });
    }

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
        isShared: goal.isShared,
        achievement: achievement || {
          quarter,
          actual: 0,
          status: "not_started",
          progressScore: 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        checkInId: checkIn._id,
        goalSheetId: goalSheet._id,
        quarter,
        cycleId: goalSheet.cycleId,
        goals: goalsWithAchievements,
      },
    });
  } catch (error) {
    console.error("Error fetching check-in:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/employee/checkin
 * Save/update achievements for all goals in a quarter
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { cycleId, quarter, goals } = body as {
      cycleId: string;
      quarter: "Q1" | "Q2" | "Q3" | "Q4";
      goals: Array<{
        goalId: string;
        actual: number;
        status: string;
        completionDate?: string;
      }>;
    };

    if (!cycleId || !quarter || !Array.isArray(goals)) {
      return NextResponse.json(
        { error: "cycleId, quarter, and goals array are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(cycleId)) {
      return NextResponse.json(
        { error: "Invalid cycleId format" },
        { status: 400 }
      );
    }

    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected");

    console.log("  - employeeId:", user.id);
    console.log("  - cycleId:", cycleId);
    console.log("  - status: approved or locked");

    const goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(user.id),
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] },
    });

    if (!goalSheet) {
      return NextResponse.json(
        { error: "No approved goal sheet found" },
        { status: 404 }
      );
    }

    for (const goalUpdate of goals) {
      const { goalId, actual, status, completionDate } = goalUpdate;
      const typedStatus = status as "not_started" | "on_track" | "completed";

      const goal = goalSheet.goals.find((g) => g._id?.toString() === goalId);
      if (!goal) {
        continue;
      }

      const progressScore = calculateProgressScore(
        goal.uomType,
        actual,
        goal.target,
        completionDate ? new Date(completionDate) : undefined
      );

      let achievement = goal.achievements?.find((a) => a.quarter === quarter);

      if (achievement) {
        achievement.actual = actual;
        achievement.status = typedStatus;
        achievement.progressScore = progressScore;
        if (completionDate) {
          achievement.completionDate = new Date(completionDate);
        }
        achievement.updatedAt = new Date();
      } else {
        goal.achievements = goal.achievements || [];
        goal.achievements.push({
          quarter,
          actual,
          status: typedStatus,
          progressScore,
          completionDate: completionDate ? new Date(completionDate) : undefined,
          updatedAt: new Date(),
        });
      }
    }

    await goalSheet.save();

    let checkIn = await CheckIn.findOne({
      goalSheetId: goalSheet._id,
      quarter,
    });

    if (!checkIn) {
      checkIn = await CheckIn.create({
        goalSheetId: goalSheet._id,
        employeeId: new Types.ObjectId(user.id),
        managerId: goalSheet.employeeId,
        quarter,
        cycleId: new Types.ObjectId(cycleId),
        checkInDate: new Date(),
      });
    } else {
      checkIn.checkInDate = new Date();
      await checkIn.save();
    }

    return NextResponse.json({
      success: true,
      message: "Check-in saved successfully",
      data: {
        checkInId: checkIn._id,
        goalSheetId: goalSheet._id,
        quarter,
      },
    });
  } catch (error) {
    console.error("Error saving check-in:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
