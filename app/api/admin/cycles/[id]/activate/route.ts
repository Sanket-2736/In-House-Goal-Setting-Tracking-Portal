import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * POST /api/admin/cycles/[id]/activate
 * Set a cycle as active (deactivates others)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;

    await connectDB();

    await GoalCycle.updateMany({ _id: { $ne: id } }, { isActive: false });

    const cycle = await GoalCycle.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cycle activated successfully",
      data: cycle,
    });
  } catch (error) {
    console.error("Error activating cycle:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
