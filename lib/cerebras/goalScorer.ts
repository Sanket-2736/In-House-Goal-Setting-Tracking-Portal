import { IGoalItem } from "@/lib/models/GoalSheet";

export interface GoalQualityScore {
  goalIndex: number;
  score: number;
  strengths: string[];
  suggestions: string[];
}

export interface GoalQualityReport {
  overallScore: number;
  goals: GoalQualityScore[];
  summary: string;
}

/**
 * Analyze goal quality using Cerebras AI
 * Evaluates goals against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
 */
export async function analyzeGoalQuality(goals: IGoalItem[]): Promise<GoalQualityReport> {
  const apiKey = process.env.CEREBRAS_API_KEY;

  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not configured");
  }

  if (!goals || goals.length === 0) {
    throw new Error("At least one goal is required for analysis");
  }

  const goalsText = goals
    .map(
      (goal, index) => `
Goal ${index + 1}:
- Title: ${goal.title}
- Description: ${goal.description || "N/A"}
- Thrust Area: ${goal.thrustArea}
- UoM Type: ${goal.uomType}
- Target: ${goal.target}
- Target Date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "N/A"}
- Weightage: ${goal.weightage}%
`
    )
    .join("\n");

  const systemPrompt = `You are an expert OKR coach and goal-setting specialist. Analyze employee goal sheets for quality across the SMART criteria:
- Specificity: Is the goal clear and well-defined?
- Measurability: Can progress be objectively measured?
- Achievability: Is the goal realistic and attainable?
- Relevance: Does it align with organizational strategy?
- Time-bound: Is there a clear deadline?

For each goal, provide:
1. A score from 1-10 (1=poor, 10=excellent)
2. 2-3 specific strengths (what's working well)
3. 2-3 actionable improvement suggestions

Also provide an overall sheet score and a brief summary.

Return ONLY valid JSON in this exact format:
{
  "overallScore": <number 1-10>,
  "goals": [
    {
      "goalIndex": <number>,
      "score": <number 1-10>,
      "strengths": ["strength1", "strength2"],
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "summary": "<brief summary of overall goal sheet quality>"
}`;

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
            content: `Please analyze these goals:\n${goalsText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const report: GoalQualityReport = JSON.parse(jsonMatch[0]);

    if (!report.overallScore || !Array.isArray(report.goals) || !report.summary) {
      throw new Error("Invalid response structure from AI");
    }

    return report;
  } catch (error) {
    console.error("Error analyzing goals with Cerebras:", error);
    throw error;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-600 dark:text-green-400";
  if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-50 dark:bg-green-950";
  if (score >= 6) return "bg-yellow-50 dark:bg-yellow-950";
  return "bg-red-50 dark:bg-red-950";
}
