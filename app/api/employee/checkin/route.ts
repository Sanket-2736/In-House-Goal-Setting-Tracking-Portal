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

    // Validate cycleId is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(cycleId)) {
      return NextResponse.json(
        { error: "Invalid cycleId format" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the goal sheet
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

    // Get or create check-in record
    let checkIn = await CheckIn.findOne({
      goalSheetId: goalSheet._id,
      quarter,
    });

    if (!checkIn) {
      checkIn = await CheckIn.create({
        goalSheetId: goalSheet._id,
        employeeId: new Types.ObjectId(user.id),
        managerId: goalSheet.employeeId, // Will be populated with actual manager ID
        quarter,
        cycleId: new Types.ObjectId(cycleId),
        checkInDate: new Date(),
      });
    }

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

    console.log("=== CHECK-IN SAVE REQUEST ===");
    console.log("User ID:", user.id);
    console.log("Request body:", JSON.stringify(body, null, 2));

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

    console.log("Extracted cycleId:", cycleId);
    console.log("Extracted quarter:", quarter);
    console.log("Extracted goals count:", goals?.length);

    if (!cycleId || !quarter || !Array.isArray(goals)) {
      console.log("Validation failed:");
      console.log("  - cycleId:", cycleId ? "✓" : "✗");
      console.log("  - quarter:", quarter ? "✓" : "✗");
      console.log("  - goals is array:", Array.isArray(goals) ? "✓" : "✗");
      return NextResponse.json(
        { error: "cycleId, quarter, and goals array are required" },
        { status: 400 }
      );
    }

    // Validate cycleId is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(cycleId)) {
      console.log("Invalid cycleId format:", cycleId);
      return NextResponse.json(
        { error: "Invalid cycleId format" },
        { status: 400 }
      );
    }

    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected");

    // Get the goal sheet
    console.log("Fetching goal sheet with:");
    console.log("  - employeeId:", user.id);
    console.log("  - cycleId:", cycleId);
    console.log("  - status: approved or locked");

    const goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(user.id),
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] },
    });

    console.log("Goal sheet found:", goalSheet ? "✓" : "✗");
    if (!goalSheet) {
      console.log("No approved goal sheet found for this employee and cycle");
      return NextResponse.json(
        { error: "No approved goal sheet found" },
        { status: 404 }
      );
    }

    console.log("Goal sheet ID:", goalSheet._id);
    console.log("Total goals in sheet:", goalSheet.goals?.length);

    // Update achievements for each goal
    console.log("Updating achievements for", goals.length, "goals");
    for (const goalUpdate of goals) {
      const { goalId, actual, status, completionDate } = goalUpdate;
      console.log(`\nProcessing goal: ${goalId}`);
      console.log(`  - actual: ${actual}`);
      console.log(`  - status: ${status}`);
      console.log(`  - completionDate: ${completionDate}`);

      const typedStatus = status as "not_started" | "on_track" | "completed";

      const goal = goalSheet.goals.find((g) => g._id?.toString() === goalId);
      if (!goal) {
        console.log(`  - Goal not found in sheet`);
        continue;
      }

      console.log(`  - Goal found: ${goal.title}`);

      // Calculate progress score
      const progressScore = calculateProgressScore(
        goal.uomType,
        actual,
        goal.target,
        completionDate ? new Date(completionDate) : undefined
      );

      console.log(`  - Calculated progress score: ${progressScore}`);

      // Find or create achievement for this quarter
      let achievement = goal.achievements?.find((a) => a.quarter === quarter);

      if (achievement) {
        console.log(`  - Updating existing achievement`);
        // Update existing
        achievement.actual = actual;
        achievement.status = typedStatus;
        achievement.progressScore = progressScore;
        if (completionDate) {
          achievement.completionDate = new Date(completionDate);
        }
        achievement.updatedAt = new Date();
      } else {
        console.log(`  - Creating new achievement`);
        // Create new
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

    console.log("Saving goal sheet...");
    await goalSheet.save();
    console.log("Goal sheet saved successfully");

    // Update check-in record
    console.log("Updating check-in record...");
    let checkIn = await CheckIn.findOne({
      goalSheetId: goalSheet._id,
      quarter,
    });

    if (!checkIn) {
      console.log("Creating new check-in record");
      checkIn = await CheckIn.create({
        goalSheetId: goalSheet._id,
        employeeId: new Types.ObjectId(user.id),
        managerId: goalSheet.employeeId,
        quarter,
        cycleId: new Types.ObjectId(cycleId),
        checkInDate: new Date(),
      });
    } else {
      console.log("Updating existing check-in record");
      checkIn.checkInDate = new Date();
      await checkIn.save();
    }

    console.log("Check-in saved successfully");
    console.log("=== CHECK-IN SAVE COMPLETE ===\n");

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
    console.error("=== CHECK-IN SAVE ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("=== END ERROR ===\n");
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
