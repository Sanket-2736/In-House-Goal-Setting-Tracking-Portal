import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CheckInAchievementData {
  goalTitle: string;
  thrustArea: string;
  uomType: string;
  target: number;
  actual: number | null;
  progressScore: number;
  status: string;
}

/**
 * Generate AI-powered check-in comment using Google Gemini
 * Analyzes employee's quarterly achievement data and generates constructive feedback
 */
export async function generateCheckInSummary(
  employeeName: string,
  quarter: string,
  achievements: CheckInAchievementData[]
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  if (!achievements || achievements.length === 0) {
    throw new Error("At least one achievement is required");
  }

  const achievementsText = achievements
    .map(
      (achievement, index) => `
Goal ${index + 1}: ${achievement.goalTitle}
- Thrust Area: ${achievement.thrustArea}
- Measurement Type: ${achievement.uomType}
- Target: ${achievement.target}
- Actual Achievement: ${achievement.actual !== null ? achievement.actual : "Not yet entered"}
- Progress Score: ${achievement.progressScore}%
- Status: ${achievement.status}
`
    )
    .join("\n");

  const completedGoals = achievements.filter((a) => a.status === "completed").length;
  const onTrackGoals = achievements.filter((a) => a.status === "on_track").length;
  const notStartedGoals = achievements.filter((a) => a.status === "not_started").length;
  const averageProgress = Math.round(
    achievements.reduce((sum, a) => sum + a.progressScore, 0) / achievements.length
  );
  const lowProgressGoals = achievements.filter((a) => a.progressScore < 50);

  const systemPrompt = `You are a direct, professional manager providing concise check-in feedback. Keep responses SHORT and ACTION-FOCUSED.
- Be direct and specific
- Reference actual numbers and goals
- Provide clear next steps
- Keep it under 100 words
- Professional but brief tone`;

  const userPrompt = `Write a brief check-in comment for ${employeeName} for ${quarter}.

Performance Summary:
- Total Goals: ${achievements.length}
- Completed: ${completedGoals}
- On Track: ${onTrackGoals}
- Not Started: ${notStartedGoals}
- Average Progress: ${averageProgress}%
${lowProgressGoals.length > 0 ? `- Low Progress Goals: ${lowProgressGoals.length}` : ""}

Goals:
${achievementsText}

Write a SHORT (50-80 words), direct check-in comment that:
1. States current status clearly
2. Identifies key blockers if any
3. Specifies one clear next action

Be concise and professional.`;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const content = response.response.text();

    if (!content) {
      throw new Error("No response from Gemini API");
    }

    const cleanedContent = content
      .replace(/^```[\w]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    return cleanedContent;
  } catch (error) {
    console.error("Error generating check-in summary with Gemini:", error);
    throw error;
  }
}

export function validateComment(comment: string): { valid: boolean; error?: string } {
  if (!comment || comment.trim().length === 0) {
    return { valid: false, error: "Comment cannot be empty" };
  }

  if (comment.trim().length < 20) {
    return { valid: false, error: "Comment must be at least 20 characters" };
  }

  if (comment.length > 2000) {
    return { valid: false, error: "Comment cannot exceed 2000 characters" };
  }

  return { valid: true };
}
