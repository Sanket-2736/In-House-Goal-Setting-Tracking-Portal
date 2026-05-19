import { connectDB } from "@/lib/db/connection";
import {
  GoalCycle,
  GoalSheet,
  CheckIn,
  User,
  EscalationRule,
  EscalationLog,
  Notification,
} from "@/lib/models";
import { Types } from "mongoose";

interface EscalationResult {
  triggered: number;
  notifications: number;
  errors: string[];
}

/**
 * Check and trigger escalations for missed deadlines
 * - Goal not submitted N days after phase1Open
 * - Goal not approved N days after submission
 * - Check-in not completed N days after quarter opens
 */
export async function checkAndTriggerEscalations(): Promise<EscalationResult> {
  const result: EscalationResult = {
    triggered: 0,
    notifications: 0,
    errors: [],
  };

  try {
    await connectDB();

    // Get all active escalation rules
    const rules = await EscalationRule.find({ isActive: true });

    if (rules.length === 0) {
      return result;
    }

    const now = new Date();

    // Process each rule type
    for (const rule of rules) {
      try {
        if (rule.triggerType === "goal_not_submitted") {
          const escalated = await checkGoalNotSubmitted(rule, now);
          result.triggered += escalated.triggered;
          result.notifications += escalated.notifications;
        } else if (rule.triggerType === "goal_not_approved") {
          const escalated = await checkGoalNotApproved(rule, now);
          result.triggered += escalated.triggered;
          result.notifications += escalated.notifications;
        } else if (rule.triggerType === "checkin_not_completed") {
          const escalated = await checkCheckInNotCompleted(rule, now);
          result.triggered += escalated.triggered;
          result.notifications += escalated.notifications;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error processing rule ${rule._id}: ${errorMsg}`);
        console.error(`Error processing rule ${rule._id}:`, error);
      }
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Database connection error: ${errorMsg}`);
    console.error("Error in checkAndTriggerEscalations:", error);
    return result;
  }
}

/**
 * Check for goals not submitted N days after phase1Open
 */
async function checkGoalNotSubmitted(
  rule: any,
  now: Date
): Promise<{ triggered: number; notifications: number }> {
  let triggered = 0;
  let notifications = 0;

  try {
    // Get active cycles
    const cycles = await GoalCycle.find({ isActive: true });

    for (const cycle of cycles) {
      const triggerDate = new Date(cycle.phase1Open);
      triggerDate.setDate(triggerDate.getDate() + rule.daysAfterTrigger);

      if (now >= triggerDate) {
        // Find employees who haven't submitted
        const unsubmittedSheets = await GoalSheet.find({
          cycleId: cycle._id,
          status: "draft",
        }).populate("employeeId");

        for (const sheet of unsubmittedSheets) {
          const employee = sheet.employeeId as any;
          // Check if escalation already exists for this sheet
          const existingEscalation = await EscalationLog.findOne({
            ruleId: rule._id,
            userId: employee._id,
            triggerType: "goal_not_submitted",
            status: { $in: ["pending", "notified"] },
          });

          if (!existingEscalation) {
            const daysSince = Math.floor(
              (now.getTime() - triggerDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Create escalation log
            const escalationLog = await EscalationLog.create({
              ruleId: rule._id,
              userId: employee._id,
              managerId: employee.managerId,
              triggerType: "goal_not_submitted",
              daysSinceTrigger: daysSince,
              notificationSentTo: rule.notifyRecipients,
              status: "notified",
              notifiedAt: now,
            });

            triggered++;

            // Create notifications
            const notificationCount = await createNotifications(
              employee,
              rule.notifyRecipients,
              "Goal Submission Overdue",
              `Your goal sheet for ${cycle.name} was due ${daysSince} days ago. Please submit immediately.`,
              sheet._id,
              "goal_sheet"
            );

            notifications += notificationCount;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in checkGoalNotSubmitted:", error);
  }

  return { triggered, notifications };
}

/**
 * Check for goals not approved N days after submission
 */
async function checkGoalNotApproved(
  rule: any,
  now: Date
): Promise<{ triggered: number; notifications: number }> {
  let triggered = 0;
  let notifications = 0;

  try {
    // Find submitted but not approved sheets
    const submittedSheets = await GoalSheet.find({
      status: "submitted",
      submittedAt: { $exists: true },
    }).populate(["employeeId", "cycleId"]);

    for (const sheet of submittedSheets) {
      const employee = sheet.employeeId as any;
      const submittedDate = new Date(sheet.submittedAt!);
      const triggerDate = new Date(submittedDate);
      triggerDate.setDate(triggerDate.getDate() + rule.daysAfterTrigger);

      if (now >= triggerDate) {
        // Check if escalation already exists
        const existingEscalation = await EscalationLog.findOne({
          ruleId: rule._id,
          userId: employee._id,
          triggerType: "goal_not_approved",
          status: { $in: ["pending", "notified"] },
        });

        if (!existingEscalation) {
          const daysSince = Math.floor(
            (now.getTime() - triggerDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Create escalation log
          const escalationLog = await EscalationLog.create({
            ruleId: rule._id,
            userId: employee._id,
            managerId: employee.managerId,
            triggerType: "goal_not_approved",
            daysSinceTrigger: daysSince,
            notificationSentTo: rule.notifyRecipients,
            status: "notified",
            notifiedAt: now,
          });

          triggered++;

          // Create notifications for manager
          const manager = await User.findById(employee.managerId);
          if (manager) {
            const notificationCount = await createNotifications(
              manager,
              rule.notifyRecipients,
              "Goal Approval Overdue",
              `Goal sheet for ${employee.name} has been pending approval for ${daysSince} days. Please review and approve.`,
              sheet._id,
              "goal_sheet"
            );

            notifications += notificationCount;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in checkGoalNotApproved:", error);
  }

  return { triggered, notifications };
}

/**
 * Check for check-ins not completed within the active window
 */
async function checkCheckInNotCompleted(
  rule: any,
  now: Date
): Promise<{ triggered: number; notifications: number }> {
  let triggered = 0;
  let notifications = 0;

  try {
    // Get active cycles
    const cycles = await GoalCycle.find({ isActive: true });

    for (const cycle of cycles) {
      // Determine current quarter
      const quarters = [
        { name: "Q1", date: cycle.q1Open },
        { name: "Q2", date: cycle.q2Open },
        { name: "Q3", date: cycle.q3Open },
        { name: "Q4", date: cycle.q4Open },
      ];

      for (const quarter of quarters) {
        const triggerDate = new Date(quarter.date);
        triggerDate.setDate(triggerDate.getDate() + rule.daysAfterTrigger);

        if (now >= triggerDate) {
          // Find approved goal sheets for this cycle
          const approvedSheets = await GoalSheet.find({
            cycleId: cycle._id,
            status: "approved",
          }).populate("employeeId");

          for (const sheet of approvedSheets) {
            const employee = sheet.employeeId as any;
            // Check if check-in exists for this quarter
            const checkInExists = await CheckIn.findOne({
              goalSheetId: sheet._id,
              quarter: quarter.name as "Q1" | "Q2" | "Q3" | "Q4",
            });

            if (!checkInExists) {
              // Check if escalation already exists
              const existingEscalation = await EscalationLog.findOne({
                ruleId: rule._id,
                userId: employee._id,
                triggerType: "checkin_not_completed",
                status: { $in: ["pending", "notified"] },
              });

              if (!existingEscalation) {
                const daysSince = Math.floor(
                  (now.getTime() - triggerDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Create escalation log
                const escalationLog = await EscalationLog.create({
                  ruleId: rule._id,
                  userId: employee._id,
                  managerId: employee.managerId,
                  triggerType: "checkin_not_completed",
                  daysSinceTrigger: daysSince,
                  notificationSentTo: rule.notifyRecipients,
                  status: "notified",
                  notifiedAt: now,
                });

                triggered++;

                // Create notifications
                const notificationCount = await createNotifications(
                  employee,
                  rule.notifyRecipients,
                  `${quarter.name} Check-in Overdue`,
                  `Your ${quarter.name} check-in is ${daysSince} days overdue. Please complete it now.`,
                  sheet._id,
                  "goal_sheet"
                );

                notifications += notificationCount;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in checkCheckInNotCompleted:", error);
  }

  return { triggered, notifications };
}

/**
 * Create notifications for escalation
 */
async function createNotifications(
  user: any,
  recipients: string[],
  title: string,
  message: string,
  relatedEntityId: Types.ObjectId,
  relatedEntityType: string
): Promise<number> {
  let count = 0;

  try {
    // Notify employee
    if (recipients.includes("employee")) {
      await Notification.create({
        userId: user._id,
        type: "escalation",
        title,
        message,
        relatedEntityId,
        relatedEntityType,
        isRead: false,
      });
      count++;
    }

    // Notify manager
    if (recipients.includes("manager") && user.managerId) {
      await Notification.create({
        userId: user.managerId,
        type: "escalation",
        title,
        message,
        relatedEntityId,
        relatedEntityType,
        isRead: false,
      });
      count++;
    }

    // Notify skip-level manager
    if (recipients.includes("skip_level") && user.managerId) {
      const manager = await User.findById(user.managerId);
      if (manager && manager.managerId) {
        await Notification.create({
          userId: manager.managerId,
          type: "escalation",
          title,
          message,
          relatedEntityId,
          relatedEntityType,
          isRead: false,
        });
        count++;
      }
    }

    // Notify HR (all admins)
    if (recipients.includes("hr")) {
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: "escalation",
          title,
          message,
          relatedEntityId,
          relatedEntityType,
          isRead: false,
        });
        count++;
      }
    }
  } catch (error) {
    console.error("Error creating notifications:", error);
  }

  return count;
}
