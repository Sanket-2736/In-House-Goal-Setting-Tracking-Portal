import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, User, GoalCycle } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";
import * as XLSX from "xlsx";

/**
 * GET /api/reports/export
 * Export achievement data to Excel or CSV
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only admins can export reports
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can export reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";
    const cycleId = searchParams.get("cycleId");
    const department = searchParams.get("department");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch cycle info
    const cycle = await GoalCycle.findById(cycleId);
    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {
      cycleId: new Types.ObjectId(cycleId),
      status: { $in: ["approved", "locked"] },
    };

    // Fetch goal sheets
    let goalSheets = await GoalSheet.find(query)
      .populate("employeeId", "name email department employeeId managerId")
      .populate("cycleId", "name year");

    // Filter by department if provided
    if (department) {
      goalSheets = goalSheets.filter(
        (sheet: any) => sheet.employeeId?.department === department
      );
    }

    // Transform data
    const reportData = [];
    const q1Data = [];
    const q2Data = [];
    const q3Data = [];
    const q4Data = [];

    for (const sheet of goalSheets) {
      const employee = sheet.employeeId as any;
      let manager = null;

      if (employee?.managerId) {
        manager = await User.findById(employee.managerId, "name");
      }

      for (const goal of sheet.goals) {
        const baseData = {
          employeeName: employee?.name || "Unknown",
          employeeId: employee?.employeeId || "Unknown",
          department: employee?.department || "Unknown",
          manager: manager?.name || "Unassigned",
          goalTitle: goal.title,
          thrustArea: goal.thrustArea,
          uomType: goal.uomType,
          plannedTarget: goal.target,
          status: goal.status,
        };

        // Add to summary
        const summaryRow: any = { ...baseData };
        for (const achievement of goal.achievements) {
          summaryRow[`${achievement.quarter}Actual`] = achievement.actual || 0;
          summaryRow[`${achievement.quarter}Score`] = achievement.progressScore || 0;
        }
        reportData.push(summaryRow);

        // Add to quarterly sheets
        for (const achievement of goal.achievements) {
          const quarterRow = {
            ...baseData,
            actual: achievement.actual || 0,
            progressScore: achievement.progressScore || 0,
            completionDate: achievement.completionDate
              ? new Date(achievement.completionDate).toLocaleDateString()
              : "",
            achievementStatus: achievement.status,
          };

          if (achievement.quarter === "Q1") q1Data.push(quarterRow);
          else if (achievement.quarter === "Q2") q2Data.push(quarterRow);
          else if (achievement.quarter === "Q3") q3Data.push(quarterRow);
          else if (achievement.quarter === "Q4") q4Data.push(quarterRow);
        }
      }
    }

    if (format === "xlsx") {
      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Quarterly sheets
      if (q1Data.length > 0) {
        const q1Sheet = XLSX.utils.json_to_sheet(q1Data);
        XLSX.utils.book_append_sheet(workbook, q1Sheet, "Q1 Details");
      }
      if (q2Data.length > 0) {
        const q2Sheet = XLSX.utils.json_to_sheet(q2Data);
        XLSX.utils.book_append_sheet(workbook, q2Sheet, "Q2 Details");
      }
      if (q3Data.length > 0) {
        const q3Sheet = XLSX.utils.json_to_sheet(q3Data);
        XLSX.utils.book_append_sheet(workbook, q3Sheet, "Q3 Details");
      }
      if (q4Data.length > 0) {
        const q4Sheet = XLSX.utils.json_to_sheet(q4Data);
        XLSX.utils.book_append_sheet(workbook, q4Sheet, "Q4 Details");
      }

      // Generate file
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      // Create filename
      const date = new Date().toISOString().split("T")[0];
      const filename = `Achievement_Report_${cycle.name}_${date}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else if (format === "csv") {
      // Convert to CSV
      const csv = convertToCSV(reportData);
      const date = new Date().toISOString().split("T")[0];
      const filename = `Achievement_Report_${cycle.name}_${date}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid format. Use 'xlsx' or 'csv'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * Convert JSON array to CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get headers
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const csvHeaders = headers.map((h) => `"${h}"`).join(",");

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}
