import { Types } from "mongoose";

export type UserRole = "employee" | "manager" | "admin";
export type UserProvider = "credentials" | "google";
export type GoalSheetStatus = "draft" | "submitted" | "approved" | "returned" | "locked";
export type GoalItemStatus = "not_started" | "on_track" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type UoMType = "numeric_min" | "numeric_max" | "timeline" | "zero";
export type AuditChangeType = "create" | "update" | "delete" | "approve" | "reject" | "submit" | "lock";
export type AuditEntityType = "GoalSheet" | "GoalItem" | "CheckIn" | "User" | "GoalCycle";

export interface IUserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  managerId?: Types.ObjectId;
  department?: string;
  employeeId?: string;
  provider: UserProvider;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDTO {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  employeeId?: string;
  isActive: boolean;
}

export interface IGoalCycleDocument {
  _id: Types.ObjectId;
  name: string;
  year: number;
  phase1Open: Date;
  q1Open: Date;
  q2Open: Date;
  q3Open: Date;
  q4Open: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IGoalCycleDTO {
  id: string;
  name: string;
  year: number;
  phase1Open: Date;
  q1Open: Date;
  q2Open: Date;
  q3Open: Date;
  q4Open: Date;
  isActive: boolean;
  createdBy: string;
}

export interface IQuarterlyAchievementDocument {
  _id?: Types.ObjectId;
  quarter: Quarter;
  actual: number;
  completionDate?: Date;
  status: GoalItemStatus;
  progressScore?: number;
  updatedAt?: Date;
}

export interface IQuarterlyAchievementDTO {
  quarter: Quarter;
  actual: number;
  completionDate?: Date;
  status: GoalItemStatus;
  progressScore?: number;
}

export interface IGoalItemDocument {
  _id?: Types.ObjectId;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UoMType;
  target: number;
  targetDate?: Date;
  weightage: number;
  isShared: boolean;
  sharedFromId?: Types.ObjectId;
  achievements: IQuarterlyAchievementDocument[];
  status: GoalItemStatus;
}

export interface IGoalItemDTO {
  id?: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UoMType;
  target: number;
  targetDate?: Date;
  weightage: number;
  isShared: boolean;
  sharedFromId?: string;
  achievements: IQuarterlyAchievementDTO[];
  status: GoalItemStatus;
}

export interface IGoalSheetDocument {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  cycleId: Types.ObjectId;
  status: GoalSheetStatus;
  managerComment?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  lockedAt?: Date;
  goals: IGoalItemDocument[];
  totalWeightage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoalSheetDTO {
  id: string;
  employeeId: string;
  cycleId: string;
  status: GoalSheetStatus;
  managerComment?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  lockedAt?: Date;
  goals: IGoalItemDTO[];
  totalWeightage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckInDocument {
  _id: Types.ObjectId;
  goalSheetId: Types.ObjectId;
  managerId: Types.ObjectId;
  employeeId: Types.ObjectId;
  quarter: Quarter;
  comment?: string;
  checkInDate: Date;
  cycleId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckInDTO {
  id: string;
  goalSheetId: string;
  managerId: string;
  employeeId: string;
  quarter: Quarter;
  comment?: string;
  checkInDate: Date;
  cycleId: string;
}

export interface IAuditLogDocument {
  _id: Types.ObjectId;
  entityType: AuditEntityType;
  entityId: Types.ObjectId;
  changedBy: Types.ObjectId;
  changeType: AuditChangeType;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
  timestamp: Date;
}

export interface IAuditLogDTO {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  changedBy: string;
  changeType: AuditChangeType;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
  timestamp: Date;
}

export interface ISharedGoalRecipientDocument {
  employeeId: Types.ObjectId;
  weightage: number;
  goalSheetId?: Types.ObjectId;
}

export interface ISharedGoalRecipientDTO {
  employeeId: string;
  weightage: number;
  goalSheetId?: string;
}

export interface ISharedGoalDocument {
  _id: Types.ObjectId;
  sourceGoalId: Types.ObjectId;
  title: string;
  description?: string;
  target: number;
  targetDate?: Date;
  uomType: UoMType;
  thrustArea: string;
  cycleId: Types.ObjectId;
  createdBy: Types.ObjectId;
  recipients: ISharedGoalRecipientDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISharedGoalDTO {
  id: string;
  sourceGoalId: string;
  title: string;
  description?: string;
  target: number;
  targetDate?: Date;
  uomType: UoMType;
  thrustArea: string;
  cycleId: string;
  createdBy: string;
  recipients: ISharedGoalRecipientDTO[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface CreateGoalSheetRequest {
  employeeId: string;
  cycleId: string;
  goals: IGoalItemDTO[];
}

export interface UpdateGoalSheetRequest {
  status?: GoalSheetStatus;
  managerComment?: string;
  goals?: IGoalItemDTO[];
}

export interface CreateCheckInRequest {
  goalSheetId: string;
  quarter: Quarter;
  comment?: string;
}

export interface CreateSharedGoalRequest {
  sourceGoalId: string;
  title: string;
  description?: string;
  target: number;
  targetDate?: Date;
  uomType: UoMType;
  thrustArea: string;
  cycleId: string;
  recipients: ISharedGoalRecipientDTO[];
}

export type UserRoleType = UserRole;
export type GoalStatus = "not_started" | "in_progress" | "completed" | "on_hold";
export type GoalPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  department?: string;
  manager?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  userId: string;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
