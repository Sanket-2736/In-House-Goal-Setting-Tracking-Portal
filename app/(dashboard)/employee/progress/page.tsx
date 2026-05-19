"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Target, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { getCurrentQuarter } from "@/lib/utils/quarter";

interface Achievement {
  quarter: string;
  actual: number;
  status: string;
  progressScore: number;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  thrustArea: string;
  target: number;
  weightage: number;
  status: string;
  achievements?: Achievement[];
}

interface GoalSheet {
  _id: string;
  status: "draft" | "submitted" | "approved" | "returned" | "locked";
  goals: Goal[];
  cycleId: {
    name: string;
    year: number;
  };
}

interface ProgressStats {
  totalGoals: number;
  onTrackGoals: number;
  atRiskGoals: number;
  notStartedGoals: number;
  averageProgress: number;
  totalWeightage: number;
}

export default function EmployeeProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [currentQuarter, setCurrentQuarter] = useState<string>("");

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        logger.info("Fetching progress data");

        const quarter = getCurrentQuarter();
        setCurrentQuarter(quarter);

        // Fetch active cycle
        const cycleResponse = await fetch("/api/goals/cycles/active");
        if (!cycleResponse.ok) {
          throw new Error("Failed to fetch active cycle");
        }

        const cycleData = await cycleResponse.json();
        const cycleId = cycleData.data._id;

        // Fetch goal sheet
        const sheetResponse = await fetch(`/api/goals/sheet?cycleId=${cycleId}`);
        if (!sheetResponse.ok) {
          throw new Error("Failed to fetch goal sheet");
        }

        const sheetData = await sheetResponse.json();
        setGoalSheet(sheetData.data);

        // Calculate stats
        const goals = sheetData.data.goals || [];
        const onTrack = goals.filter((g: Goal) => {
          const latestAchievement = g.achievements?.[g.achievements.length - 1];
          return latestAchievement?.status === "on_track";
        }).length;

        const atRisk = goals.filter((g: Goal) => {
          const latestAchievement = g.achievements?.[g.achievements.length - 1];
          return latestAchievement?.status === "at_risk";
        }).length;

        const notStarted = goals.filter((g: Goal) => {
          const latestAchievement = g.achievements?.[g.achievements.length - 1];
          return latestAchievement?.status === "not_started";
        }).length;

        const totalWeightage = goals.reduce((sum: number, g: Goal) => sum + (g.weightage || 0), 0);
        const avgProgress = goals.length > 0
          ? Math.round(
              goals.reduce((sum: number, g: Goal) => {
                const latestAchievement = g.achievements?.[g.achievements.length - 1];
                return sum + (latestAchievement?.progressScore || 0);
              }, 0) / goals.length
            )
          : 0;

        setStats({
          totalGoals: goals.length,
          onTrackGoals: onTrack,
          atRiskGoals: atRisk,
          notStartedGoals: notStarted,
          averageProgress: avgProgress,
          totalWeightage,
        });

        logger.success("Progress data loaded successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load progress data";
        logger.error("Failed to load progress data", err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="My Progress"
          description="Track your goal achievement progress"
          breadcrumbs={[{ label: "Progress" }]}
        />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !goalSheet) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="My Progress"
          description="Track your goal achievement progress"
          breadcrumbs={[{ label: "Progress" }]}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {error || "No goal sheet found"}
              </p>
              <Button asChild>
                <Link href="/employee/goals">Create Goals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="My Progress"
        description={`${goalSheet.cycleId.name} - ${goalSheet.cycleId.year}`}
        breadcrumbs={[{ label: "Progress" }]}
      />

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Goals
                <Target className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGoals}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-between">
                On Track
                <CheckCircle2 className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                {stats.onTrackGoals}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center justify-between">
                At Risk
                <AlertCircle className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.atRiskGoals}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                Not Started
                <Clock className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {stats.notStartedGoals}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-between">
                Avg Progress
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {stats.averageProgress}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals Progress List */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Progress Details</CardTitle>
          <CardDescription>
            Current quarter: {currentQuarter}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {goalSheet.goals.map((goal) => {
              const latestAchievement = goal.achievements?.[goal.achievements.length - 1];
              const statusColor =
                latestAchievement?.status === "on_track"
                  ? "text-green-600 dark:text-green-400"
                  : latestAchievement?.status === "at_risk"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-600 dark:text-gray-400";

              return (
                <div key={goal._id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.thrustArea}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{goal.weightage}%</Badge>
                      <Badge
                        className={statusColor}
                        variant={
                          latestAchievement?.status === "on_track"
                            ? "default"
                            : latestAchievement?.status === "at_risk"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {latestAchievement?.status === "on_track"
                          ? "On Track"
                          : latestAchievement?.status === "at_risk"
                          ? "At Risk"
                          : "Not Started"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {goal.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-semibold">{goal.target}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-semibold">
                        {latestAchievement?.actual || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <p className="font-semibold">
                        {latestAchievement?.progressScore || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quarter</p>
                      <p className="font-semibold">
                        {latestAchievement?.quarter || currentQuarter}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress Bar</span>
                      <span className="text-sm text-muted-foreground">
                        {latestAchievement?.progressScore || 0}%
                      </span>
                    </div>
                    <Progress
                      value={latestAchievement?.progressScore || 0}
                      className="h-2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/employee/goals">View All Goals</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/employee/checkin">Update Check-in</Link>
        </Button>
      </div>
    </div>
  );
}
