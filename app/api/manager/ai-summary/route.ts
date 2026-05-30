import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { generateCheckInSummary, CheckInAchievementData } from "@/lib/gemini/checkinSummary";

/**
 * POST /api/manager/ai-summary
 * Generate AI-powered check-in comment using Cerebras
 */
export async function POST(request: NextRequest) {
  try {
    const manager = await requireRole("manager");
    const body = await request.json();

    const { employeeName, quarter, achievements } = body as {
      employeeName: string;
      quarter: string;
      achievements: CheckInAchievementData[];
    };

    if (!employeeName || !quarter || !achievements || achievements.length === 0) {
      return NextResponse.json(
        { error: "employeeName, quarter, and achievements array are required" },
        { status: 400 }
      );
    }

    // Generate AI summary
    const summary = await generateCheckInSummary(employeeName, quarter, achievements);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        disclaimer: "AI-generated — please review before submitting",
      },
    });
  } catch (error) {
    console.error("Error generating AI summary:", error);

    // Return user-friendly message for all errors
    return NextResponse.json(
      {
        error: "AI suggestions temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }
}
