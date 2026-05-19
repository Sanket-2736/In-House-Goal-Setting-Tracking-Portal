import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/goals/sheet?cycleId=
 * Fetch employee's goal sheet for a specific cycle
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(user.id),
      cycleId: new Types.ObjectId(cycleId),
    }).populate("cycleId", "name year");

    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
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
 * POST /api/goals/sheet
 * Create or update goal sheet (draft)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { cycleId, goals } = body;

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(goals)) {
      return NextResponse.json(
        { error: "goals must be an array" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if cycle exists
    const cycle = await GoalCycle.findById(cycleId);
    if (!cycle) {
      return NextResponse.json(
        { error: "Goal cycle not found" },
        { status: 404 }
      );
    }

    // Find or create goal sheet
    let goalSheet = await GoalSheet.findOne({
      employeeId: new Types.ObjectId(user.id),
      cycleId: new Types.ObjectId(cycleId),
    });

    if (!goalSheet) {
      goalSheet = await GoalSheet.create({
        employeeId: new Types.ObjectId(user.id),
        cycleId: new Types.ObjectId(cycleId),
        status: "draft",
        goals: goals,
      });
    } else {
      goalSheet.goals = goals;
      goalSheet.status = "draft";
      await goalSheet.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Goal sheet saved as draft",
        data: goalSheet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving goal sheet:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
