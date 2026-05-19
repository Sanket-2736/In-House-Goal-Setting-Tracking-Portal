import { NextRequest, NextResponse } from "next/server";
import { checkAndTriggerEscalations } from "@/lib/escalations/checker";

/**
 * POST /api/cron/escalations
 * Cron endpoint to trigger escalation checker
 * Can be called from external cron service or manually by admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await checkAndTriggerEscalations();

    return NextResponse.json({
      success: true,
      message: "Escalation check completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron escalations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/escalations
 * Allow GET for testing purposes
 */
export async function GET(request: NextRequest) {
  try {
    const result = await checkAndTriggerEscalations();

    return NextResponse.json({
      success: true,
      message: "Escalation check completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron escalations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
