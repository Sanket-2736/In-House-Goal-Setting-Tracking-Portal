import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * GET /api/goals/cycles/active
 * Fetch the active goal cycle
 */
export async function GET() {
  try {
    await connectDB();

    const activeCycle = await GoalCycle.findOne({ isActive: true }).sort({
      createdAt: -1,
    });

    if (!activeCycle) {
      return NextResponse.json(
        { error: "No active goal cycle found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activeCycle,
    });
  } catch (error) {
    console.error("Error fetching active cycle:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
