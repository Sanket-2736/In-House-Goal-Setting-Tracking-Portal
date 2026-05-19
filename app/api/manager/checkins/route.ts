import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, CheckIn } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";
import { getCurrentQuarter } from "@/lib/utils/quarter";

/**
 * GET /api/manager/checkins
 * Fetch team check-in status overview
 */
export async function GET(request: NextRequest) {
  try {
    const manager = await requireRole("manager");
    const { searchParams } = new URL(request.url);
    const quarter = (searchParams.get("quarter") || getCurrentQuarter()) as "Q1" | "Q2" | "Q3" | "Q4";
    const status = searchParams.get("status"); // "completed", "in_progress", "not_started"

    await connectDB();

    // Get all employees under this manager
    const employees = await User.find({
      managerId: new Types.ObjectId(manager.id),
      isActive: true,
    }).select("_id name department");

    // Get goal sheets and check-ins for these employees
    const teamCheckIns = await Promise.all(
      employees.map(async (employee) => {
        const goalSheet = await GoalSheet.findOne({
          employeeId: employee._id,
          status: { $in: ["approved", "locked"] },
        }).populate("cycleId", "name year");

        if (!goalSheet) {
          return {
            employeeId: employee._id,
            name: employee.name,
            department: employee.department,
            goalsCount: 0,
            checkInStatus: "not_started",
            lastUpdated: null,
            quarter,
          };
        }

        // Get check-in record
        const checkIn = await CheckIn.findOne({
          goalSheetId: goalSheet._id,
          quarter,
        });

        // Determine check-in status based on achievements
        let checkInStatus = "not_started";
        let lastUpdated = null;

        if (checkIn && checkIn.comment) {
          checkInStatus = "completed";
          lastUpdated = checkIn.updatedAt || checkIn.checkInDate;
        } else {
          // Check if any achievements have been entered
          const hasAchievements = goalSheet.goals.some((goal) =>
            goal.achievements?.some((a) => a.quarter === quarter && a.actual !== null)
          );

          if (hasAchievements) {
            checkInStatus = "in_progress";
            // Get the most recent achievement update
            const latestAchievement = goalSheet.goals
              .flatMap((g) => g.achievements || [])
              .filter((a) => a.quarter === quarter)
              .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))[0];

            if (latestAchievement?.updatedAt) {
              lastUpdated = latestAchievement.updatedAt;
            }
          }
        }

        return {
          employeeId: employee._id.toString(),
          name: employee.name,
          department: employee.department,
          goalsCount: goalSheet.goals.length,
          checkInStatus,
          lastUpdated,
          quarter,
        };
      })
    );

    // Filter by status if provided
    let filtered = teamCheckIns;
    if (status) {
      filtered = teamCheckIns.filter((item) => item.checkInStatus === status);
    }

    // Calculate summary
    const summary = {
      total: teamCheckIns.length,
      completed: teamCheckIns.filter((item) => item.checkInStatus === "completed").length,
      inProgress: teamCheckIns.filter((item) => item.checkInStatus === "in_progress").length,
      notStarted: teamCheckIns.filter((item) => item.checkInStatus === "not_started").length,
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      summary,
      quarter,
    });
  } catch (error) {
    console.error("Error fetching team check-ins:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
