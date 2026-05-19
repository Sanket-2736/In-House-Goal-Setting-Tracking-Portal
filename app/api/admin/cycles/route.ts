import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/admin/cycles
 * List all goal cycles
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectDB();

    const cycles = await GoalCycle.find()
      .populate("createdBy", "name email")
      .sort({ year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GoalCycle.countDocuments();

    // Determine status for each cycle
    const now = new Date();
    const cyclesWithStatus = cycles.map((cycle) => {
      let status = "upcoming";
      if (cycle.isActive) {
        status = "active";
      } else if (cycle.q4Open < now) {
        status = "closed";
      }
      return { ...cycle.toObject(), status };
    });

    return NextResponse.json({
      success: true,
      data: cyclesWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cycles:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * POST /api/admin/cycles
 * Create a new goal cycle
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole("admin");
    const user = await requireRole("admin");
    const body = await request.json();

    const { name, year, phase1Open, q1Open, q2Open, q3Open, q4Open } = body;

    if (!name || !year || !phase1Open || !q1Open || !q2Open || !q3Open || !q4Open) {
      return NextResponse.json(
        { error: "All date fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const cycle = await GoalCycle.create({
      name,
      year,
      phase1Open: new Date(phase1Open),
      q1Open: new Date(q1Open),
      q2Open: new Date(q2Open),
      q3Open: new Date(q3Open),
      q4Open: new Date(q4Open),
      isActive: false,
      createdBy: new Types.ObjectId(user.id),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cycle created successfully",
        data: cycle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cycle:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
