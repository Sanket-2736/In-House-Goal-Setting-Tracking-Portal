import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, CheckIn } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/analytics
 * Fetch analytics data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admins can access analytics
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can access analytics" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const view = searchParams.get("view") || "overview";

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch all approved/locked goal sheets for the cycle
    const goalSheets = await GoalSheet.find({
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] },
    })
      .populate("employeeId", "name email department employeeId managerId")
      .populate("cycleId", "name year");

    // Build analytics data based on view
    let analyticsData: any = {};

    if (view === "overview" || view === "all") {
      analyticsData = {
        ...analyticsData,
        ...getOverviewData(goalSheets),
      };
    }

    if (view === "trends" || view === "all") {
      analyticsData = {
        ...analyticsData,
        ...getTrendsData(goalSheets),
      };
    }

    if (view === "distribution" || view === "all") {
      analyticsData = {
        ...analyticsData,
        ...getDistributionData(goalSheets),
      };
    }

    if (view === "manager-effectiveness" || view === "all") {
      analyticsData = {
        ...analyticsData,
        ...await getManagerEffectivenessData(goalSheets, cycleId),
      };
    }

    if (view === "heatmap" || view === "all") {
      analyticsData = {
        ...analyticsData,
        ...getHeatmapData(goalSheets),
      };
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * Get overview data (KPIs and org-wide progress)
 */
function getOverviewData(goalSheets: any[]) {
  const allAchievements: number[] = [];
  const departmentProgress: Record<string, { total: number; count: number }> = {};
  const thrustAreaCount: Record<string, number> = {};
  let submittedCount = 0;

  for (const sheet of goalSheets) {
    const employee = sheet.employeeId as any;
    const dept = employee?.department || "Unknown";

    if (!departmentProgress[dept]) {
      departmentProgress[dept] = { total: 0, count: 0 };
    }

    for (const goal of sheet.goals) {
      thrustAreaCount[goal.thrustArea] = (thrustAreaCount[goal.thrustArea] || 0) + 1;

      for (const achievement of goal.achievements) {
        if (achievement.progressScore !== undefined) {
          allAchievements.push(achievement.progressScore);
          departmentProgress[dept].total += achievement.progressScore;
          departmentProgress[dept].count += 1;
        }
      }
    }

    if (sheet.status === "approved" || sheet.status === "locked") {
      submittedCount++;
    }
  }

  // Calculate KPIs
  const avgAchievement =
    allAchievements.length > 0
      ? Math.round(
          (allAchievements.reduce((a, b) => a + b, 0) / allAchievements.length) * 100
        ) / 100
      : 0;

  const topDepartment = Object.entries(departmentProgress).reduce(
    (best, [dept, data]) => {
      const avg = data.count > 0 ? data.total / data.count : 0;
      return avg > (best.avg || 0) ? { dept, avg } : best;
    },
    { dept: "N/A", avg: 0 }
  );

  const mostCommonThrustArea = Object.entries(thrustAreaCount).reduce(
    (max, [area, count]) => (count > (max.count || 0) ? { area, count } : max),
    { area: "N/A", count: 0 }
  );

  const submissionRate = goalSheets.length > 0 ? Math.round((submittedCount / goalSheets.length) * 100) : 0;

  // Department progress by quarter
  const departmentQuarterData: any[] = [];
  for (const [dept, data] of Object.entries(departmentProgress)) {
    const avg = data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0;
    departmentQuarterData.push({
      department: dept,
      Q1: avg,
      Q2: avg,
      Q3: avg,
      Q4: avg,
    });
  }

  return {
    overview: {
      kpis: {
        avgAchievement,
        topDepartment: topDepartment.dept,
        mostCommonThrustArea: mostCommonThrustArea.area,
        submissionRate,
      },
      departmentProgress: departmentQuarterData,
    },
  };
}

/**
 * Get trends data (quarter-on-quarter trends)
 */
function getTrendsData(goalSheets: any[]) {
  const quarterlyTrends: Record<string, number[]> = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: [],
  };

  const departmentTrends: Record<string, Record<string, number[]>> = {};

  for (const sheet of goalSheets) {
    const employee = sheet.employeeId as any;
    const dept = employee?.department || "Unknown";

    if (!departmentTrends[dept]) {
      departmentTrends[dept] = { Q1: [], Q2: [], Q3: [], Q4: [] };
    }

    for (const goal of sheet.goals) {
      for (const achievement of goal.achievements) {
        if (achievement.progressScore !== undefined) {
          quarterlyTrends[achievement.quarter].push(achievement.progressScore);
          departmentTrends[dept][achievement.quarter].push(achievement.progressScore);
        }
      }
    }
  }

  // Calculate averages
  const trendData = [
    {
      quarter: "Q1",
      average: quarterlyTrends.Q1.length > 0 ? Math.round((quarterlyTrends.Q1.reduce((a, b) => a + b, 0) / quarterlyTrends.Q1.length) * 100) / 100 : 0,
    },
    {
      quarter: "Q2",
      average: quarterlyTrends.Q2.length > 0 ? Math.round((quarterlyTrends.Q2.reduce((a, b) => a + b, 0) / quarterlyTrends.Q2.length) * 100) / 100 : 0,
    },
    {
      quarter: "Q3",
      average: quarterlyTrends.Q3.length > 0 ? Math.round((quarterlyTrends.Q3.reduce((a, b) => a + b, 0) / quarterlyTrends.Q3.length) * 100) / 100 : 0,
    },
    {
      quarter: "Q4",
      average: quarterlyTrends.Q4.length > 0 ? Math.round((quarterlyTrends.Q4.reduce((a, b) => a + b, 0) / quarterlyTrends.Q4.length) * 100) / 100 : 0,
    },
  ];

  // Department trends
  const departmentTrendData = Object.entries(departmentTrends).map(([dept, quarters]) => ({
    department: dept,
    Q1: quarters.Q1.length > 0 ? Math.round((quarters.Q1.reduce((a, b) => a + b, 0) / quarters.Q1.length) * 100) / 100 : 0,
    Q2: quarters.Q2.length > 0 ? Math.round((quarters.Q2.reduce((a, b) => a + b, 0) / quarters.Q2.length) * 100) / 100 : 0,
    Q3: quarters.Q3.length > 0 ? Math.round((quarters.Q3.reduce((a, b) => a + b, 0) / quarters.Q3.length) * 100) / 100 : 0,
    Q4: quarters.Q4.length > 0 ? Math.round((quarters.Q4.reduce((a, b) => a + b, 0) / quarters.Q4.length) * 100) / 100 : 0,
  }));

  return {
    trends: {
      quarterlyTrend: trendData,
      departmentTrends: departmentTrendData,
    },
  };
}

/**
 * Get distribution data (goals by thrust area and UoM type)
 */
function getDistributionData(goalSheets: any[]) {
  const thrustAreaCount: Record<string, number> = {};
  const uomTypeCount: Record<string, number> = {};
  const thrustAreaAchievement: Record<string, number[]> = {};

  for (const sheet of goalSheets) {
    for (const goal of sheet.goals) {
      thrustAreaCount[goal.thrustArea] = (thrustAreaCount[goal.thrustArea] || 0) + 1;
      uomTypeCount[goal.uomType] = (uomTypeCount[goal.uomType] || 0) + 1;

      if (!thrustAreaAchievement[goal.thrustArea]) {
        thrustAreaAchievement[goal.thrustArea] = [];
      }

      for (const achievement of goal.achievements) {
        if (achievement.progressScore !== undefined) {
          thrustAreaAchievement[goal.thrustArea].push(achievement.progressScore);
        }
      }
    }
  }

  const thrustAreaPie = Object.entries(thrustAreaCount).map(([name, value]) => ({
    name,
    value,
  }));

  const uomTypeBar = Object.entries(uomTypeCount).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const thrustAreaRadar = Object.entries(thrustAreaAchievement).map(([name, scores]) => ({
    name,
    achievement: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
  }));

  return {
    distribution: {
      thrustAreaPie,
      uomTypeBar,
      thrustAreaRadar,
    },
  };
}

/**
 * Get manager effectiveness data
 */
async function getManagerEffectivenessData(goalSheets: any[], cycleId: string) {
  const managers = await User.find({ role: "manager" }).select("_id name");

  const managerData = [];

  for (const manager of managers) {
    // Get team members
    const teamMembers = await User.find({
      managerId: manager._id,
      role: "employee",
    }).select("_id");

    const teamSize = teamMembers.length;

    // Get check-ins completed
    const checkIns = await CheckIn.find({
      cycleId: new Types.ObjectId(cycleId),
      managerId: manager._id,
    });

    const completionRate = teamSize > 0 ? Math.round((checkIns.length / teamSize) * 100) : 0;

    // Get average approval time (submitted → approved)
    const managerSheets = goalSheets.filter(
      (sheet: any) => sheet.employeeId?.managerId?.toString() === manager._id.toString()
    );

    let avgApprovalTime = 0;
    let approvalCount = 0;

    for (const sheet of managerSheets) {
      if (sheet.submittedAt && sheet.approvedAt) {
        const timeDiff = new Date(sheet.approvedAt).getTime() - new Date(sheet.submittedAt).getTime();
        const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        avgApprovalTime += daysDiff;
        approvalCount++;
      }
    }

    avgApprovalTime = approvalCount > 0 ? Math.round(avgApprovalTime / approvalCount) : 0;

    managerData.push({
      managerName: manager.name,
      teamSize,
      checkInsCompleted: checkIns.length,
      completionRate,
      avgApprovalTime,
    });
  }

  // Sort by completion rate
  managerData.sort((a, b) => b.completionRate - a.completionRate);

  return {
    managerEffectiveness: {
      managers: managerData,
      topManagers: managerData.slice(0, 3),
      bottomManagers: managerData.slice(-3).reverse(),
    },
  };
}

/**
 * Get heatmap data (employees vs quarters)
 */
function getHeatmapData(goalSheets: any[]) {
  const heatmapData: any[] = [];

  for (const sheet of goalSheets) {
    const employee = sheet.employeeId as any;
    const employeeName = employee?.name || "Unknown";

    const quarterScores: Record<string, number> = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    const quarterCounts: Record<string, number> = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    for (const goal of sheet.goals) {
      for (const achievement of goal.achievements) {
        if (achievement.progressScore !== undefined) {
          quarterScores[achievement.quarter] += achievement.progressScore;
          quarterCounts[achievement.quarter] += 1;
        }
      }
    }

    const row: any = { employee: employeeName };

    for (const quarter of ["Q1", "Q2", "Q3", "Q4"]) {
      row[quarter] = quarterCounts[quarter] > 0 ? Math.round((quarterScores[quarter] / quarterCounts[quarter]) * 100) / 100 : null;
    }

    heatmapData.push(row);
  }

  return {
    heatmap: {
      data: heatmapData,
    },
  };
}
