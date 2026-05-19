import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/reports/achievement
 * Fetch achievement data for reporting
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admins can access reports
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can access reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const department = searchParams.get("department");
    const quarter = searchParams.get("quarter");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query
    const query: any = {
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] }, // Only approved/locked sheets
    };

    // Fetch goal sheets with employee info
    let goalSheets = await GoalSheet.find(query)
      .populate("employeeId", "name email department employeeId managerId")
      .populate("cycleId", "name year");

    // Filter by department if provided
    if (department) {
      goalSheets = goalSheets.filter(
        (sheet: any) => sheet.employeeId?.department === department
      );
    }

    // Transform data for reporting
    const reportData = [];

    for (const sheet of goalSheets) {
      const employee = sheet.employeeId as any;
      let manager = null;

      if (employee?.managerId) {
        manager = await User.findById(employee.managerId, "name");
      }

      // For each goal in the sheet
      for (const goal of sheet.goals) {
        const goalData: any = {
          employeeName: employee?.name || "Unknown",
          employeeId: employee?.employeeId || "Unknown",
          department: employee?.department || "Unknown",
          manager: manager?.name || "Unassigned",
          goalTitle: goal.title,
          uomType: goal.uomType,
          plannedTarget: goal.target,
          status: goal.status,
        };

        // Add quarterly achievements
        for (const achievement of goal.achievements) {
          const quarterKey = `${achievement.quarter}Actual`;
          const scoreKey = `${achievement.quarter}Score`;
          goalData[quarterKey] = achievement.actual || 0;
          goalData[scoreKey] = achievement.progressScore || 0;
        }

        // Filter by quarter if provided
        if (quarter) {
          const quarterKey = `${quarter}Actual`;
          if (goalData[quarterKey] === undefined) {
            continue; // Skip if quarter data not available
          }
        }

        reportData.push(goalData);
      }
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      count: reportData.length,
    });
  } catch (error) {
    console.error("Error fetching achievement report:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
