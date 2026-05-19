/**
 * Progress score calculation utilities
 * Calculates achievement percentage based on UoM type and actual vs target values
 */

export type UoMType = "numeric_min" | "numeric_max" | "timeline" | "zero";

/**
 * Calculate progress score based on UoM type
 * Returns a percentage (0-150, capped at 150%)
 */
export function calculateProgressScore(
  uomType: UoMType,
  actual: number | null,
  target: number,
  targetDate?: Date | null
): number {
  if (actual === null || actual === undefined) {
    return 0;
  }

  switch (uomType) {
    case "numeric_max":
      return Math.min((actual / target) * 100, 150);

    case "numeric_min":
      if (actual === 0) return 0;
      return Math.min((target / actual) * 100, 150);

    case "timeline":
      if (!targetDate) return 0;

      const completionDate = new Date(targetDate);
      const targetDateObj = new Date(targetDate);
      const today = new Date();

      if (today < targetDateObj) {
        return 0;
      }

      if (completionDate <= targetDateObj) {
        return 100;
      }

      const daysLate = Math.floor(
        (completionDate.getTime() - targetDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      const score = Math.max(100 - daysLate, 0);
      return Math.min(score, 150);

    case "zero":
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}

/**
 * Get a human-readable description of the progress score
 */
export function getProgressScoreLabel(score: number): string {
  if (score >= 100) return "Achieved";
  if (score >= 75) return "On Track";
  if (score >= 50) return "In Progress";
  if (score >= 25) return "Started";
  return "Not Started";
}

/**
 * Get the color for a progress score
 */
export function getProgressScoreColor(score: number): string {
  if (score >= 100) return "bg-green-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get the badge variant for a progress score
 */
export function getProgressScoreBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 100) return "default";
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  if (score >= 25) return "secondary";
  return "destructive";
}

/**
 * Format progress score for display
 */
export function formatProgressScore(score: number): string {
  return `${Math.round(score)}%`;
}
