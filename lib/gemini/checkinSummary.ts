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
 * Generate AI-powered check-in comment using Cerebras
 * Analyzes employee's quarterly achievement data and generates constructive feedback
 */
export async function generateCheckInSummary(
  employeeName: string,
  quarter: string,
  achievements: CheckInAchievementData[]
): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.CEREBRAS_BASE_URL;
  const model = process.env.CEREBRAS_MODEL || "gpt-oss-120b";

  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not configured");
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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Cerebras API error:", error);
      throw new Error(`Cerebras API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Cerebras API");
    }

    const cleanedContent = content
      .replace(/^```[\w]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    return cleanedContent;
  } catch (error) {
    console.error("Error generating check-in summary with Cerebras:", error);
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
