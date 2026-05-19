import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    employeeId: z.string().optional(),
    department: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const goalItemSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  uomType: z.enum(["numeric_min", "numeric_max", "timeline", "zero"]),
  target: z.number().positive("Target must be positive"),
  targetDate: z.date().optional(),
  weightage: z.number().min(0).max(100),
  isShared: z.boolean().default(false),
});

export const goalSheetSchema = z.object({
  employeeId: z.string(),
  cycleId: z.string(),
  goals: z.array(goalItemSchema),
});

export const updateGoalSheetSchema = z.object({
  status: z.enum(["draft", "submitted", "approved", "returned", "locked"]).optional(),
  managerComment: z.string().optional(),
  goals: z.array(goalItemSchema).optional(),
});

export const checkInSchema = z.object({
  goalSheetId: z.string(),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  comment: z.string().optional(),
});

export const goalCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  year: z.number().int().min(2000).max(2100),
  phase1Open: z.date(),
  q1Open: z.date(),
  q2Open: z.date(),
  q3Open: z.date(),
  q4Open: z.date(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoalItemInput = z.infer<typeof goalItemSchema>;
export type GoalSheetInput = z.infer<typeof goalSheetSchema>;
export type UpdateGoalSheetInput = z.infer<typeof updateGoalSheetSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type GoalCycleInput = z.infer<typeof goalCycleSchema>;
