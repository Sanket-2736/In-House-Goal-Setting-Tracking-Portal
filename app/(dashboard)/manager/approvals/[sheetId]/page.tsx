"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface GoalItem {
  _id: string;
  thrustArea: string;
  title: string;
  description?: string;
  target: number;
  weightage: number;
  uomType: string;
  isShared: boolean;
  status: string;
}

interface GoalSheet {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
    email: string;
  };
  cycleId: {
    _id: string;
    name: string;
    year: string;
  };
  status: string;
  goals: GoalItem[];
  totalWeightage: number;
  submittedAt: string;
  managerComment?: string;
}

export default function GoalSheetReviewPage() {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId as string;

  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [editValues, setEditValues] = useState<{
    target: number;
    weightage: number;
  } | null>(null);

  const [modifiedGoals, setModifiedGoals] = useState<Set<string>>(new Set());

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  const [returnComment, setReturnComment] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoalSheet();
  }, [sheetId]);

  const fetchGoalSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/manager/approvals/${sheetId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch goal sheet");
      }

      const result = await response.json();

      setGoalSheet(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = (goal: GoalItem) => {
    setEditingGoalId(goal._id);

    setEditValues({
      target: goal.target,
      weightage: goal.weightage,
    });
  };

  const handleSaveGoalEdit = async () => {
    if (!editingGoalId || !editValues || !goalSheet) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/manager/approvals/${sheetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalId: editingGoalId,
            target: editValues.target,
            weightage: editValues.weightage,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json();

        throw new Error(result.error || "Failed to update goal");
      }

      const result = await response.json();

      setGoalSheet(result.data);

      setModifiedGoals((prev) => new Set([...prev, editingGoalId]));

      setEditingGoalId(null);
      setEditValues(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditValues(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!goalSheet) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/manager/approvals/${sheetId}?goalId=${goalId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();

        throw new Error(result.error || "Failed to delete goal");
      }

      setGoalSheet((prev) =>
        prev
          ? {
              ...prev,
              goals: prev.goals.filter((g) => g._id !== goalId),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/manager/approvals/${sheetId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve goal sheet");
      }

      setApproveDialogOpen(false);

      router.push("/manager/approvals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      setError("Comment is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/manager/approvals/${sheetId}/return`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: returnComment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to return goal sheet");
      }

      setReturnDialogOpen(false);

      router.push("/manager/approvals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />

        <Card className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!goalSheet) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />

        <h3 className="text-lg font-semibold mb-2">
          Goal sheet not found
        </h3>

        <Button onClick={() => router.push("/manager/approvals")}>
          Back to Approvals
        </Button>
      </Card>
    );
  }

  const totalWeightage = goalSheet.goals.reduce(
    (sum, g) => sum + (g.weightage || 0),
    0
  );

  const isWeightageValid = totalWeightage === 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PageHeader
          title={`Review Goals - ${goalSheet.employeeId.name}`}
          description={`${goalSheet.cycleId.name} (${goalSheet.cycleId.year})`}
        />

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">
              Employee ID:
            </span>

            <span className="ml-2 font-medium">
              {goalSheet.employeeId.employeeId}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground">
              Department:
            </span>

            <span className="ml-2 font-medium">
              {goalSheet.employeeId.department}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground">
              Submitted:
            </span>

            <span className="ml-2 font-medium">
              {format(
                new Date(goalSheet.submittedAt),
                "MMM dd, yyyy"
              )}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {goalSheet.goals.map((goal) => (
          <div
            key={goal._id}
            className="border border-border rounded-xl p-6 space-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">
                      {goal.title}
                    </h3>

                    {modifiedGoals.has(goal._id) && (
                      <Badge variant="outline">
                        Modified
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                </div>

                {editingGoalId !== goal._id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteGoal(goal._id)
                      }
                      className="gap-2 text-red-500 hover:text-red-600"
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Thrust Area
                  </Label>

                  <p className="font-medium">
                    {goal.thrustArea}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    UoM Type
                  </Label>

                  <p className="font-medium capitalize">
                    {goal.uomType.replace(/_/g, " ")}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>

                  <p className="font-medium capitalize">
                    {goal.status}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Shared
                  </Label>

                  <p className="font-medium">
                    {goal.isShared ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {editingGoalId === goal._id && editValues ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`target-${goal._id}`}>
                        Target
                      </Label>

                      <Input
                        id={`target-${goal._id}`}
                        type="number"
                        value={editValues.target}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            target:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`weightage-${goal._id}`}
                      >
                        Weightage (%)
                      </Label>

                      <Input
                        id={`weightage-${goal._id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={editValues.weightage}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            weightage:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveGoalEdit}
                      disabled={submitting}
                    >
                      Save
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Target
                    </Label>

                    <p className="text-lg font-semibold">
                      {goal.target}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Weightage
                    </Label>

                    <p className="text-lg font-semibold">
                      {goal.weightage}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2">Summary</h3>

            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">
                  Total Goals:
                </span>

                <span className="ml-2 font-medium">
                  {goalSheet.goals.length}
                </span>
              </p>

              <p>
                <span className="text-muted-foreground">
                  Total Weightage:
                </span>

                <span className="ml-2 font-medium">
                  {totalWeightage}%
                </span>
              </p>
            </div>
          </div>

          <div>
            {isWeightageValid ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-6 w-6" />
                <span className="font-semibold">Invalid</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      {/* Action Buttons */}
<div className="flex justify-end gap-3 pt-4">
  <Button
    variant="outline"
    onClick={() => router.push("/manager/approvals")}
    disabled={submitting}
  >
    Cancel
  </Button>

  <Button
    variant="destructive"
    onClick={() => setReturnDialogOpen(true)}
    disabled={submitting || !isWeightageValid}
  >
    Return for Rework
  </Button>

  <Button
    onClick={() => setApproveDialogOpen(true)}
    disabled={submitting || !isWeightageValid}
  >
    Approve Goals
  </Button>
</div>

{/* Approve Dialog */}
<Dialog
  open={approveDialogOpen}
  onOpenChange={setApproveDialogOpen}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Approve Goal Sheet</DialogTitle>

      <DialogDescription>
        Are you sure you want to approve these goals?
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setApproveDialogOpen(false)}
      >
        Cancel
      </Button>

      <Button
        onClick={handleApprove}
        disabled={submitting}
      >
        {submitting ? "Approving..." : "Approve"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Return Dialog */}
<Dialog
  open={returnDialogOpen}
  onOpenChange={setReturnDialogOpen}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Return for Rework</DialogTitle>

      <DialogDescription>
        Add feedback for the employee.
      </DialogDescription>
    </DialogHeader>

    <Textarea
      placeholder="Enter feedback..."
      value={returnComment}
      onChange={(e) =>
        setReturnComment(e.target.value)
      }
      className="min-h-28"
    />

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setReturnDialogOpen(false)}
      >
        Cancel
      </Button>

      <Button
        variant="destructive"
        onClick={handleReturn}
        disabled={!returnComment.trim() || submitting}
      >
        {submitting ? "Returning..." : "Return"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}