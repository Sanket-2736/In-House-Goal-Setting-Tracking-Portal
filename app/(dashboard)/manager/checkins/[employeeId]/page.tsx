"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getProgressScoreBadgeVariant, formatProgressScore } from "@/lib/utils/progressScore";

interface Goal {
  goalId: string;
  title: string;
  description?: string;
  thrustArea: string;
  uomType: string;
  target: number;
  targetDate?: string;
  weightage: number;
  achievement: {
    quarter: string;
    actual: number | null;
    status: string;
    progressScore: number;
  };
}

interface CheckInData {
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  checkInId?: string;
  goalSheetId: string;
  quarter: string;
  cycle: { name: string; year: number };
  goals: Goal[];
  weightedProgress: number;
  comment: string | null;
  checkInDate: string | null;
}

export default function ManagerCheckInReviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.employeeId as string;
  const initialQuarter = (searchParams.get("quarter") || "Q1") as string;

  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">(initialQuarter as "Q1" | "Q2" | "Q3" | "Q4");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    fetchCheckInData();
  }, [employeeId, quarter]);

  const fetchCheckInData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/manager/checkins/${employeeId}?quarter=${quarter}`
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to fetch check-in data");
      }

      const result = await response.json();
      setCheckInData(result.data);
      setComment(result.data.comment || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = useCallback(async () => {
    if (!checkInData) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const achievements = checkInData.goals.map((goal) => ({
        goalTitle: goal.title,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        target: goal.target,
        actual: goal.achievement.actual,
        progressScore: goal.achievement.progressScore,
        status: goal.achievement.status,
      }));

      const response = await fetch("/api/manager/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: checkInData.employeeName,
          quarter: checkInData.quarter,
          achievements,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setAiError("AI suggestions temporarily unavailable. Please write the comment manually.");
        return;
      }

      const result = await response.json();
      setComment(result.data.summary);
    } catch (err) {
      setAiError("AI suggestions temporarily unavailable. Please write the comment manually.");
    } finally {
      setAiLoading(false);
    }
  }, [checkInData]);

  const handleSubmitComment = async () => {
    if (!checkInData) return;

    if (comment.trim().length < 20) {
      setError("Comment must be at least 20 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/manager/checkins/${employeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarter: checkInData.quarter,
          comment,
          goalSheetId: checkInData.goalSheetId,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit comment");
      }

      setConfirmDialogOpen(false);
      // Refresh data
      await fetchCheckInData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit comment");
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
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!checkInData) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Check-in data not found</h3>
        <Button onClick={() => router.push("/manager/checkins")}>
          Back to Check-ins
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <PageHeader
          title={`Check-in Review — ${checkInData.employeeName}`}
          description={`${checkInData.employeeDepartment} • ${checkInData.cycle.name}`}
        />
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quarter:</span>
            <span className="ml-2 font-medium">{checkInData.quarter}</span>
          </div>
          {checkInData.checkInDate && (
            <div>
              <span className="text-muted-foreground">Submitted:</span>
              <span className="ml-2 font-medium">
                {format(new Date(checkInData.checkInDate), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Quarter Tabs */}
      <Tabs value={quarter} onValueChange={(v) => setQuarter(v as "Q1" | "Q2" | "Q3" | "Q4")}>
        <TabsList>
          <TabsTrigger value="Q1">Q1</TabsTrigger>
          <TabsTrigger value="Q2">Q2</TabsTrigger>
          <TabsTrigger value="Q3">Q3</TabsTrigger>
          <TabsTrigger value="Q4">Q4</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Goals */}
      <div className="space-y-4">
        {checkInData.goals.map((goal) => (
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

              {/* Comparison Grid */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Planned Target</Label>
                  <p className="text-2xl font-bold mt-2">{goal.target}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Actual Achievement</Label>
                  <p className="text-2xl font-bold mt-2">
                    {goal.achievement.actual !== null ? goal.achievement.actual : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Progress Score</Label>
                  <Badge
                    variant={getProgressScoreBadgeVariant(goal.achievement.progressScore)}
                    className="text-lg mt-2"
                  >
                    {formatProgressScore(goal.achievement.progressScore)}
                  </Badge>
                </div>
              </div>

              {/* Status and Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className="capitalize">
                    {goal.achievement.status}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(goal.achievement.progressScore, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Weightage */}
              <div className="text-sm text-muted-foreground">
                Weightage: <span className="font-medium">{goal.weightage}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Overall Progress */}
      <Card className="p-6 bg-zinc-900 border-zinc-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2">
              Weighted Average Progress
            </h3>

            <p className="text-sm text-zinc-400">
              Based on goal weightages and achievement scores
            </p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-white">
              {checkInData.weightedProgress}%
            </div>
          </div>
        </div>
      </Card>

      {/* Comment Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Check-in Comment</h3>
            <p className="text-sm text-muted-foreground">
              {checkInData.comment
                ? "Edit your feedback below"
                : "Provide constructive feedback for this employee"}
            </p>
          </div>

          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {aiError}
            </div>
          )}

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your check-in comment here... (minimum 20 characters)"
            className="min-h-32"
          />

          <div className="text-xs text-muted-foreground">
            {comment.length} / 2000 characters
          </div>

          {comment.includes("AI-generated") && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ✨ AI-generated — please review before submitting
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateAISummary}
              disabled={aiLoading || checkInData.goals.length === 0}
              className="gap-2"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Summary
                </>
              )}
            </Button>
            <Button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={submitting || comment.trim().length < 20}
            >
              {checkInData.comment ? "Update Comment" : "Submit Comment"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Check-in Complete</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this check-in comment? This will mark the
              check-in as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm font-medium mb-2">Your comment:</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{comment}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitComment} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
