import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { analyzeGoalQuality } from "@/lib/gemini/goalScorer";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

/**
 * POST /api/goals/analyze
 * Analyze goal quality using Cerebras AI
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { goals } = body;

    if (!Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json(
        { error: "At least one goal is required" },
        { status: 400 }
      );
    }

    if (goals.length > 8) {
      return NextResponse.json(
        { error: "Maximum 8 goals allowed" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT) {
          return NextResponse.json(
            {
              error: `Rate limit exceeded. Maximum ${RATE_LIMIT} analyses per hour.`,
            },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(user.id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    const report = await analyzeGoalQuality(goals);

    return NextResponse.json(
      {
        success: true,
        data: report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error analyzing goals:", error);

    // Return user-friendly message for all errors
    return NextResponse.json(
      { error: "AI suggestions temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
