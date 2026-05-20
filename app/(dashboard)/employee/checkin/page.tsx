"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  getCurrentQuarter,
  getQuarterMonthRange,
  formatQuarterWithDate,
  isInCheckInWindow,
  getNextCheckInDate,
} from "@/lib/utils/quarter";
import {
  calculateProgressScore,
  getProgressScoreLabel,
  getProgressScoreBadgeVariant,
  formatProgressScore,
} from "@/lib/utils/progressScore";

interface Achievement {
  quarter: string;
  actual: number;
  status: string;
  progressScore: number;
  completionDate?: string;
}

interface Goal {
  goalId: string;
  title: string;
  description?: string;
  thrustArea: string;
  uomType: string;
  target: number;
  targetDate?: string;
  weightage: number;
  isShared: boolean;
  achievement: Achievement;
}

interface CheckInData {
  checkInId: string;
  goalSheetId: string;
  quarter: string;
  cycleId: string;
  goals: Goal[];
}

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");

  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("");
  const [inCheckInWindow, setInCheckInWindow] = useState(false);
  const [nextCheckInDate, setNextCheckInDate] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState<
    Record<string, { actual: number | null; status: string; completionDate?: string }>
  >({});

  // Auto-save timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (checkInData && Object.keys(formData).length > 0) {
        handleAutoSave();
      }
    }, 60000); // Auto-save every 60 seconds

    return () => clearInterval(timer);
  }, [checkInData, formData]);

  useEffect(() => {
    fetchCheckInData();
  }, [cycleId]);

  const fetchCheckInData = async () => {
    try {
      setLoading(true);
      setError(null);

      let activeCycleId = cycleId;

      // If no cycleId provided, fetch the active cycle
      if (!activeCycleId) {
        const cycleResponse = await fetch("/api/goals/cycles/active");
        if (!cycleResponse.ok) {
          throw new Error("Failed to fetch active cycle");
        }
        const cycleData = await cycleResponse.json();
        activeCycleId = cycleData.data._id?.toString() || cycleData.data._id;
      }

      if (!activeCycleId) {
        setError("Cycle ID is required");
        return;
      }

      const quarter = getCurrentQuarter();
      setCurrentQuarter(quarter);

      // Check if in check-in window
      const inWindow = isInCheckInWindow(new Date(), quarter, new Date().getFullYear());
      setInCheckInWindow(inWindow);

      if (!inWindow) {
        const nextDate = getNextCheckInDate(quarter, new Date().getFullYear());
        setNextCheckInDate(nextDate);
      }

      console.log("Fetching check-in data with:", { quarter, cycleId: activeCycleId });

      const response = await fetch(
        `/api/employee/checkin?quarter=${quarter}&cycleId=${activeCycleId}`
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to fetch check-in data");
      }

      const result = await response.json();
      setCheckInData(result.data);

      // Initialize form data
      const initialFormData: typeof formData = {};
      result.data.goals.forEach((goal: Goal) => {
        initialFormData[goal.goalId] = {
          actual: goal.achievement.actual || null,
          status: goal.achievement.status || "not_started",
          completionDate: goal.achievement.completionDate,
        };
      });
      setFormData(initialFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!checkInData) return;

    try {
      const goals = checkInData.goals.map((goal) => ({
        goalId: goal.goalId,
        actual: formData[goal.goalId]?.actual || 0,
        status: formData[goal.goalId]?.status || "not_started",
        completionDate: formData[goal.goalId]?.completionDate,
      }));

      const payload = {
        cycleId: String(checkInData.cycleId),
        quarter: checkInData.quarter,
        goals,
      };

      console.log("=== AUTO-SAVE REQUEST ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/employee/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log("Auto-save response:", responseData);

      if (!response.ok) {
        console.error("Auto-save failed:", responseData);
      } else {
        console.log("Auto-save successful");
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [checkInData, formData]);

  const handleSave = async () => {
    if (!checkInData) return;

    try {
      setSaving(true);
      const goals = checkInData.goals.map((goal) => ({
        goalId: goal.goalId,
        actual: formData[goal.goalId]?.actual || 0,
        status: formData[goal.goalId]?.status || "not_started",
        completionDate: formData[goal.goalId]?.completionDate,
      }));

      const payload = {
        cycleId: String(checkInData.cycleId),
        quarter: checkInData.quarter,
        goals,
      };

      console.log("=== SENDING CHECK-IN SAVE REQUEST ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      console.log("cycleId type:", typeof checkInData.cycleId);
      console.log("cycleId value:", checkInData.cycleId);
      console.log("quarter:", checkInData.quarter);
      console.log("goals count:", goals.length);

      const response = await fetch("/api/employee/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        console.error("Save failed with status:", response.status);
        console.error("Error response:", responseData);
        throw new Error(responseData.error || "Failed to save check-in");
      }

      console.log("Check-in saved successfully");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    goalId: string,
    field: "actual" | "status" | "completionDate",
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!inCheckInWindow) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Check-in Not Available"
          description="Check-in window is not currently open"
        />
        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Check-in window closed</h3>
          <p className="text-muted-foreground mb-4">
            The next check-in window opens on{" "}
            <span className="font-semibold">
              {nextCheckInDate ? format(nextCheckInDate, "MMMM dd, yyyy") : "TBD"}
            </span>
          </p>
          <Button onClick={() => router.push("/employee")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (!checkInData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Goals Not Approved"
          description="Your goals are not yet approved"
        />
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No approved goals</h3>
          <p className="text-muted-foreground mb-4">
            Your goal sheet needs to be approved by your manager before you can submit
            check-ins.
          </p>
          <Button onClick={() => router.push("/employee/goals")}>View My Goals</Button>
        </Card>
      </div>
    );
  }

  const totalProgressScore =
    checkInData.goals.length > 0
      ? Math.round(
          checkInData.goals.reduce((sum, goal) => {
            const actual = formData[goal.goalId]?.actual || goal.achievement.actual;
            const completionDate = formData[goal.goalId]?.completionDate
              ? new Date(formData[goal.goalId].completionDate!)
              : goal.achievement.completionDate
              ? new Date(goal.achievement.completionDate)
              : undefined;
            const score = calculateProgressScore(
              goal.uomType as any,
              actual,
              goal.target,
              completionDate
            );
            return sum + score;
          }, 0) / checkInData.goals.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <PageHeader
          title={`${checkInData.quarter} Check-in`}
          description={formatQuarterWithDate(
            checkInData.quarter as any,
            new Date()
          )}
        />
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {saved && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <span>Progress saved successfully</span>
          </div>
        </Card>
      )}

      {/* Goals */}
      <div className="space-y-4">
        {checkInData.goals.map((goal) => {
          const formValue = formData[goal.goalId] || {
            actual: goal.achievement.actual,
            status: goal.achievement.status,
            completionDate: goal.achievement.completionDate,
          };

          const progressScore = calculateProgressScore(
            goal.uomType as any,
            formValue.actual,
            goal.target,
            formValue.completionDate ? new Date(formValue.completionDate) : undefined
          );

          return (
            <Card key={goal.goalId} className="p-6">
              <div className="space-y-4">
                {/* Goal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{goal.thrustArea}</Badge>
                    <Badge variant="secondary">{goal.uomType.replace(/_/g, " ")}</Badge>
                  </div>
                </div>

                {/* Goal Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <p className="font-semibold mt-1">{goal.target}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Weightage</Label>
                    <p className="font-semibold mt-1">{goal.weightage}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getProgressScoreBadgeVariant(progressScore)}>
                        {formatProgressScore(progressScore)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="font-semibold mt-1 capitalize">
                      {getProgressScoreLabel(progressScore)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progressScore, 100)}%` }}
                  />
                </div>

                {/* Achievement Input */}
                <div className="space-y-4 pt-4 border-t">
                  {goal.uomType === "numeric_min" || goal.uomType === "numeric_max" ? (
                    <div>
                      <Label htmlFor={`actual-${goal.goalId}`}>Actual Achievement</Label>
                      <Input
                        id={`actual-${goal.goalId}`}
                        type="number"
                        value={formValue.actual || ""}
                        onChange={(e) =>
                          handleInputChange(
                            goal.goalId,
                            "actual",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="Enter actual value"
                        className="mt-1"
                      />
                    </div>
                  ) : goal.uomType === "timeline" ? (
                    <div>
                      <Label htmlFor={`completion-${goal.goalId}`}>
                        Completion Date
                      </Label>
                      <Input
                        id={`completion-${goal.goalId}`}
                        type="date"
                        value={formValue.completionDate || ""}
                        onChange={(e) =>
                          handleInputChange(
                            goal.goalId,
                            "completionDate",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  ) : goal.uomType === "zero" ? (
                    <div>
                      <Label>Achievement Status</Label>
                      <Select
                        value={formValue.actual === 0 ? "achieved" : "not_achieved"}
                        onValueChange={(value) =>
                          handleInputChange(
                            goal.goalId,
                            "actual",
                            value === "achieved" ? 0 : 1
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="achieved">Achieved Zero</SelectItem>
                          <SelectItem value="not_achieved">Not Achieved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor={`status-${goal.goalId}`}>Status</Label>
                    <Select
                      value={formValue.status}
                      onValueChange={(value) =>
                        handleInputChange(goal.goalId, "status", value)
                      }
                    >
                      <SelectTrigger id={`status-${goal.goalId}`} className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2">Overall Progress</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Total Goals:</span>
                <span className="ml-2 font-medium">{checkInData.goals.length}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Average Progress:</span>
                <span className="ml-2 font-medium">{totalProgressScore}%</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{totalProgressScore}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {getProgressScoreLabel(totalProgressScore)}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push("/employee")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </div>
    </div>
  );
}
