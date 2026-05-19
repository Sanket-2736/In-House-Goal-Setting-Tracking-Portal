/**
 * Quarter utilities for determining current quarter and check-in windows
 */

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

/**
 * Determine the current quarter based on the date
 * Q1: July-September
 * Q2: October-December
 * Q3: January-February
 * Q4: March-June
 */
export function getCurrentQuarter(date: Date = new Date()): Quarter {
  const month = date.getMonth(); // 0-11

  if (month >= 6 && month <= 8) {
    // July (6), August (7), September (8)
    return "Q1";
  } else if (month >= 9 && month <= 11) {
    // October (9), November (10), December (11)
    return "Q2";
  } else if (month >= 0 && month <= 1) {
    // January (0), February (1)
    return "Q3";
  } else {
    // March (2), April (3), May (4), June (5)
    return "Q4";
  }
}

/**
 * Get the month name for a quarter
 */
export function getQuarterMonthRange(quarter: Quarter): string {
  const ranges: Record<Quarter, string> = {
    Q1: "July - September",
    Q2: "October - December",
    Q3: "January - February",
    Q4: "March - June",
  };
  return ranges[quarter];
}

/**
 * Get the start date of a quarter
 */
export function getQuarterStartDate(quarter: Quarter, year: number): Date {
  const startMonths: Record<Quarter, number> = {
    Q1: 6, // July
    Q2: 9, // October
    Q3: 0, // January
    Q4: 2, // March
  };

  const month = startMonths[quarter];
  // Adjust year for Q3 (January is next year)
  const adjustedYear = quarter === "Q3" ? year + 1 : year;

  return new Date(adjustedYear, month, 1);
}

/**
 * Get the end date of a quarter
 */
export function getQuarterEndDate(quarter: Quarter, year: number): Date {
  const endMonths: Record<Quarter, number> = {
    Q1: 8, // September
    Q2: 11, // December
    Q3: 1, // February
    Q4: 5, // June
  };

  const month = endMonths[quarter];
  // Adjust year for Q3 (February is next year)
  const adjustedYear = quarter === "Q3" ? year + 1 : year;

  // Get last day of the month
  const lastDay = new Date(adjustedYear, month + 1, 0).getDate();
  return new Date(adjustedYear, month, lastDay, 23, 59, 59);
}

/**
 * Check if a date is within a quarter's check-in window
 * Check-in window is the entire quarter
 */
export function isInCheckInWindow(
  date: Date,
  quarter: Quarter,
  cycleYear: number
): boolean {
  const startDate = getQuarterStartDate(quarter, cycleYear);
  const endDate = getQuarterEndDate(quarter, cycleYear);

  return date >= startDate && date <= endDate;
}

/**
 * Get the next check-in date (start of next quarter)
 */
export function getNextCheckInDate(
  currentQuarter: Quarter,
  cycleYear: number
): Date {
  const quarterOrder: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  const currentIndex = quarterOrder.indexOf(currentQuarter);
  const nextQuarter = quarterOrder[(currentIndex + 1) % 4];

  // If we're wrapping around to Q1, increment year
  const nextYear = currentIndex === 3 ? cycleYear + 1 : cycleYear;

  return getQuarterStartDate(nextQuarter, nextYear);
}

/**
 * Format a quarter with month and year
 */
export function formatQuarterWithDate(quarter: Quarter, date: Date): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = date.getMonth();
  const year = date.getFullYear();

  return `${quarter} — ${monthNames[month]} ${year}`;
}
