import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/goals/sheet/[id]
 * Fetch a specific goal sheet by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid goal sheet ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const goalSheet = await GoalSheet.findById(id)
      .populate("cycleId", "name year")
      .lean();

    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this goal sheet
    if (goalSheet.employeeId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
