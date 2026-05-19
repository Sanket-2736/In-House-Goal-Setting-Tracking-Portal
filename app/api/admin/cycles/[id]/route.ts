import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";

/**
 * PUT /api/admin/cycles/[id]
 * Update a goal cycle
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const body = await request.json();

    const { name, year, phase1Open, q1Open, q2Open, q3Open, q4Open } = body;

    await connectDB();

    const cycle = await GoalCycle.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(year && { year }),
        ...(phase1Open && { phase1Open: new Date(phase1Open) }),
        ...(q1Open && { q1Open: new Date(q1Open) }),
        ...(q2Open && { q2Open: new Date(q2Open) }),
        ...(q3Open && { q3Open: new Date(q3Open) }),
        ...(q4Open && { q4Open: new Date(q4Open) }),
      },
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
      message: "Cycle updated successfully",
      data: cycle,
    });
  } catch (error) {
    console.error("Error updating cycle:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
