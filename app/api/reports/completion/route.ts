import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongoose";
import { GoalSheet, CheckIn, User } from "@/lib/models";
import { handleDBError } from "@/lib/db/utils";
import { Types } from "mongoose";

/**
 * GET /api/reports/completion
 * Fetch completion status for reporting
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
    const cycleId = searchParams.get("cycleId");
    const quarter = searchParams.get("quarter");
    const department = searchParams.get("department");

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Employee Submission Status
    const submissionQuery: any = {};
    
    // Handle cycleId - if "all", don't filter by cycleId
    if (cycleId && cycleId !== "all") {
      if (!Types.ObjectId.isValid(cycleId)) {
        return NextResponse.json(
          { error: `Invalid cycleId format: "${cycleId}" is not a valid MongoDB ID` },
          { status: 400 }
        );
      }
      submissionQuery.cycleId = new Types.ObjectId(cycleId);
    }

    let teamIds: any[] = [];
    if (user.role === "manager") {
      const team = await User.find({
        managerId: new Types.ObjectId(user.id),
        isActive: true,
      }).select("_id");
      teamIds = team.map((m) => m._id);
      submissionQuery.employeeId = { $in: teamIds };
    }

    let goalSheets = await GoalSheet.find(submissionQuery)
      .populate("employeeId", "name email department employeeId managerId")
      .select("employeeId status submittedAt approvedAt");

    // Filter by department if provided
    if (department) {
      goalSheets = goalSheets.filter(
        (sheet: any) => sheet.employeeId?.department === department
      );
    }

    const employeeSubmissionStatus = goalSheets.map((sheet: any) => ({
      employeeName: sheet.employeeId?.name || "Unknown",
      employeeId: sheet.employeeId?.employeeId || "Unknown",
      department: sheet.employeeId?.department || "Unknown",
      status: sheet.status,
      submittedDate: sheet.submittedAt || null,
      approvedDate: sheet.approvedAt || null,
      isOverdue: sheet.status === "draft", // Draft is overdue
      isInProgress: sheet.status === "submitted" || sheet.status === "returned",
      isComplete: sheet.status === "approved" || sheet.status === "locked",
    }));

    // Manager Check-in Status
    let managersQuery: any = { role: "manager" };
    if (user.role === "manager") {
      managersQuery = { _id: new Types.ObjectId(user.id) };
    }
    const managers = await User.find(managersQuery).select("_id name");

    const managerCheckInStatus = [];

    for (const manager of managers) {
      // Get team members
      const teamMembers = await User.find({
        managerId: manager._id,
        role: "employee",
      }).select("_id");

      const teamSize = teamMembers.length;

      // Get check-ins completed for this quarter
      let checkInsCompleted = 0;

      if (quarter) {
        const checkInsQuery: any = {
          quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4",
          employeeId: { $in: teamMembers.map((m) => m._id) },
        };
        if (cycleId && cycleId !== "all") {
          checkInsQuery.cycleId = new Types.ObjectId(cycleId);
        }
        const checkIns = await CheckIn.find(checkInsQuery);
        checkInsCompleted = checkIns.length;
      } else {
        // Count all check-ins for the cycle
        const checkInsQuery: any = {
          employeeId: { $in: teamMembers.map((m) => m._id) },
        };
        if (cycleId && cycleId !== "all") {
          checkInsQuery.cycleId = new Types.ObjectId(cycleId);
        }
        const checkIns = await CheckIn.find(checkInsQuery);
        checkInsCompleted = checkIns.length;
      }

      const completionPercentage =
        teamSize > 0 ? Math.round((checkInsCompleted / teamSize) * 100) : 0;

      managerCheckInStatus.push({
        managerName: manager.name,
        teamSize,
        checkInsCompleted,
        completionPercentage,
        isOverdue: completionPercentage < 50,
        isInProgress: completionPercentage >= 50 && completionPercentage < 100,
        isComplete: completionPercentage === 100,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeSubmissionStatus,
        managerCheckInStatus,
      },
      summary: {
        totalEmployees: employeeSubmissionStatus.length,
        submittedCount: employeeSubmissionStatus.filter(
          (e: any) => e.isComplete
        ).length,
        inProgressCount: employeeSubmissionStatus.filter(
          (e: any) => e.isInProgress
        ).length,
        overdueCount: employeeSubmissionStatus.filter(
          (e: any) => e.isOverdue
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching completion report:", error);
    const { message, statusCode } = handleDBError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
