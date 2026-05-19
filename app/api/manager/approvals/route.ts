import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/manager/approvals
 * Fetch all submitted goal sheets for the manager's team
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("manager");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectDB();

    // Get all employees under this manager
    const employees = await User.find({
      managerId: new Types.ObjectId(user.id),
      isActive: true,
    }).select("_id");

    const employeeIds = employees.map((emp) => emp._id);

    // Fetch submitted goal sheets for these employees
    const goalSheets = await GoalSheet.find({
      employeeId: { $in: employeeIds },
      status: "submitted",
    })
      .populate("employeeId", "name employeeId department email")
      .populate("cycleId", "name year")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GoalSheet.countDocuments({
      employeeId: { $in: employeeIds },
      status: "submitted",
    });

    return NextResponse.json({
      success: true,
      data: goalSheets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
