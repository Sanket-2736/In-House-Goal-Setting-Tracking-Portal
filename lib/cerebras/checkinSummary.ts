import { IGoalItem } from "@/lib/models/GoalSheet";

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

  const systemPrompt = `You are an empathetic and constructive HR manager assistant. Your role is to provide meaningful, professional check-in feedback that:
1. Acknowledges genuine wins and progress
2. Identifies risks on low-progress goals with empathy
3. Provides one concrete, actionable suggestion for improvement
4. Maintains a supportive, growth-oriented tone

Write in first person as the manager. Be specific, reference actual goals and numbers. Keep it professional but warm.`;

  const userPrompt = `Please write a professional check-in comment for ${employeeName} for ${quarter}. 

Summary of their performance:
- Total Goals: ${achievements.length}
- Completed: ${completedGoals}
- On Track: ${onTrackGoals}
- Not Started: ${notStartedGoals}
- Average Progress: ${averageProgress}%
${lowProgressGoals.length > 0 ? `- Goals with low progress (<50%): ${lowProgressGoals.length}` : ""}

Detailed Achievement Data:
${achievementsText}

Please write a check-in comment (150-200 words) that:
1. Opens with acknowledgment of their overall performance
2. Highlights specific wins (goals with high progress scores)
3. If there are low-progress goals, address them with empathy and ask about blockers
4. Provides one concrete suggestion for the next quarter
5. Closes with encouragement

Keep the tone professional, empathetic, and constructive.`;

  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
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
        max_tokens: 1000,
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
