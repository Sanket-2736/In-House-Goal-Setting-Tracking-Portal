"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Edit2 } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

interface Goal {
  _id: string;
  title: string;
  description: string;
  thrustArea: string;
  target: number;
  weightage: number;
  status: string;
  progress?: number;
  achievements?: Array<{
    quarter: string;
    actual: number;
    status: string;
    progressScore: number;
  }>;
}

interface GoalSheet {
  _id: string;
  status: "draft" | "submitted" | "approved" | "returned" | "locked";
  goals: Goal[];
  cycleId: {
    name: string;
    year: number;
  };
  submittedAt?: string;
  approvedAt?: string;
}

export default function GoalSheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);

  useEffect(() => {
    const fetchGoalSheet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        logger.info(`Fetching goal sheet: ${sheetId}`);

        const response = await fetch(`/api/goals/sheet/${sheetId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch goal sheet");
        }

        const data = await response.json();
        setGoalSheet(data.data);
        logger.success("Goal sheet loaded successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load goal sheet";
        logger.error("Failed to load goal sheet", err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (sheetId) {
      fetchGoalSheet();
    }
  }, [sheetId]);

  const handleDownload = () => {
    logger.info("Downloading goal sheet as PDF");
    toast.info("PDF download feature coming soon");
    // TODO: Implement PDF download
  };

  const handleEdit = () => {
    router.push(`/employee/goals/${sheetId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Goal Sheet"
          description="View your goal sheet details"
          breadcrumbs={[
            { label: "Goals", href: "/employee/goals" },
            { label: "Details" },
          ]}
        />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !goalSheet) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Goal Sheet"
          description="View your goal sheet details"
          breadcrumbs={[
            { label: "Goals", href: "/employee/goals" },
            { label: "Details" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {error || "Goal sheet not found"}
              </p>
              <Button asChild>
                <Link href="/employee/goals">Back to Goals</Link>
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
        title="Goal Sheet Details"
        description={`${goalSheet.cycleId.name} - ${goalSheet.cycleId.year}`}
        breadcrumbs={[
          { label: "Goals", href: "/employee/goals" },
          { label: "Details" },
        ]}
      />

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status</CardTitle>
              <CardDescription>Current submission status</CardDescription>
            </div>
            <Badge
              variant={
                goalSheet.status === "approved"
                  ? "default"
                  : goalSheet.status === "returned"
                  ? "destructive"
                  : "secondary"
              }
            >
              {goalSheet.status.charAt(0).toUpperCase() + goalSheet.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalSheet.submittedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {new Date(goalSheet.submittedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {goalSheet.approvedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="font-medium">
                {new Date(goalSheet.approvedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>Your goals for this cycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goalSheet.goals.map((goal) => {
              const latestAchievement = goal.achievements?.[goal.achievements.length - 1];
              return (
                <div key={goal._id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.thrustArea}
                      </p>
                    </div>
                    <Badge variant="outline">{goal.weightage}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {goal.description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-medium">{goal.target}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-medium">{latestAchievement?.actual || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <p className="font-medium">{latestAchievement?.progressScore || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/employee/goals">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Goals
          </Link>
        </Button>
        {goalSheet.status === "draft" && (
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
