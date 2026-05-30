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

    // Only admins and managers can access reports
    if (user.role !== "admin" && user.role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins and managers can access reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let cycleId = searchParams.get("cycleId");
    const department = searchParams.get("department");
    const quarter = searchParams.get("quarter");

    // If no cycleId provided, fetch the active cycle
    if (!cycleId) {
      try {
        const cycleResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/goals/cycles/active`
        );
        if (cycleResponse.ok) {
          const cycleData = await cycleResponse.json();
          cycleId = cycleData.data?._id?.toString() || cycleData.data?._id;
        }
      } catch (err) {
        console.log("Could not fetch active cycle, proceeding without cycleId");
      }
    }

    // If still no cycleId, return empty data instead of error
    if (!cycleId) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    await connectDB();

    // Validate cycleId if not "all"
    if (cycleId !== "all" && !Types.ObjectId.isValid(cycleId)) {
      return NextResponse.json(
        { error: `Invalid cycleId format: "${cycleId}" is not a valid MongoDB ID` },
        { status: 400 }
      );
    }

    // Build query
    const query: any = {
      status: { $in: ["approved", "locked"] }, // Only approved/locked sheets
    };
    
    // Only add cycleId filter if not "all"
    if (cycleId !== "all") {
      query.cycleId = new Types.ObjectId(cycleId);
    }

    if (user.role === "manager") {
      // Get all employees under this manager
      const employees = await User.find({
        managerId: new Types.ObjectId(user.id),
        isActive: true,
      }).select("_id");
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
    }

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
