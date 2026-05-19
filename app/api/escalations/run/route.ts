import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { checkAndTriggerEscalations } from "@/lib/escalations/checker";

/**
 * GET /api/escalations/run
 * Trigger the escalation checker
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    const result = await checkAndTriggerEscalations();

    return NextResponse.json({
      success: true,
      message: "Escalation check completed",
      data: result,
    });
  } catch (error) {
    console.error("Error running escalations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
