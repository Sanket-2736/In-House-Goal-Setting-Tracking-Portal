"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Target, TrendingUp, Clock } from "lucide-react";
import { getCurrentQuarter, isInCheckInWindow, getQuarterMonthRange } from "@/lib/utils/quarter";
import { apiGet } from "@/lib/hooks/useApi";
import { logger } from "@/lib/utils/logger";

interface GoalData {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  goals: Array<{
    _id: string;
    title: string;
    description: string;
    target: number;
    weightage: number;
    progress?: number;
    status?: string;
  }>;
  cycleId: {
    _id: string;
    name: string;
    year: number;
  };
}

interface CycleData {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export default function EmployeeDashboard() {
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");
  const [isLoading, setIsLoading] = useState(true);
  const [inCheckInWindow, setInCheckInWindow] = useState(false);
  const [currentQuarter, setCurrentQuarter] = useState("");
  const [activeCycle, setActiveCycle] = useState<CycleData | null>(null);
  const [goalSheet, setGoalSheet] = useState<GoalData | null>(null);
  const [stats, setStats] = useState([
    {
      label: "Total Goals",
      value: "0",
      icon: Target,
      color: "text-blue-500",
    },
    {
      label: "Weightage Used",
      value: "0%",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Goals Approved",
      value: "0",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Current Quarter",
      value: "Q1",
      icon: AlertCircle,
      color: "text-amber-500",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get current quarter
        const quarter = getCurrentQuarter();
        setCurrentQuarter(quarter);
        
        // Fetch active cycle
        const cycleResponse = await apiGet("/api/goals/cycles/active", { showToast: false });
        if (cycleResponse?.success && cycleResponse.data) {
          setActiveCycle(cycleResponse.data);
          
          // Fetch goal sheet for active cycle
          const sheetResponse = await apiGet(`/api/goals/sheet?cycleId=${cycleResponse.data._id}`, { showToast: false });
          if (sheetResponse?.success && sheetResponse.data) {
            setGoalSheet(sheetResponse.data);
            
            // Calculate stats from real data
            const totalGoals = sheetResponse.data.goals?.length || 0;
            const approvedGoals = sheetResponse.data.goals?.filter((g: any) => g.status === "approved").length || 0;
            const totalWeightage = sheetResponse.data.goals?.reduce((sum: number, g: any) => sum + (g.weightage || 0), 0) || 0;
            
            setStats([
              {
                label: "Total Goals",
                value: totalGoals.toString(),
                icon: Target,
                color: "text-blue-500",
              },
              {
                label: "Weightage Used",
                value: `${totalWeightage}%`,
                icon: TrendingUp,
                color: "text-green-500",
              },
              {
                label: "Goals Approved",
                value: approvedGoals.toString(),
                icon: CheckCircle2,
                color: "text-emerald-500",
              },
              {
                label: "Current Quarter",
                value: quarter,
                icon: AlertCircle,
                color: "text-amber-500",
              },
            ]);
          }
        }
        
        // Check if in check-in window
        const inWindow = isInCheckInWindow(new Date(), quarter, new Date().getFullYear());
        setInCheckInWindow(inWindow);
        
        logger.success("Dashboard data loaded successfully");
      } catch (error) {
        logger.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your goal tracking overview."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Status Banner */}
      {!isLoading && (
        <>
          {inCheckInWindow && activeCycle && (
            <Link href={`/employee/checkin?cycleId=${activeCycle._id}`}>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      {currentQuarter} Check-in is open
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Update your progress for {getQuarterMonthRange(currentQuarter as any)}. Click to start.
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Goal Sheet Status</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Your goal sheet for {activeCycle?.name} is currently in <Badge className="ml-1">{goalSheet?.status || "draft"}</Badge> status. 
                  Submit by March 31st for manager review.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  {stat.label}
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Goals</CardTitle>
          <CardDescription>Your active goals for the current cycle</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : goalSheet && goalSheet.goals && goalSheet.goals.length > 0 ? (
            <div className="space-y-4">
              {goalSheet.goals.slice(0, 3).map((goal) => (
                <div key={goal._id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Weightage: {goal.weightage}%
                      </p>
                    </div>
                    <Badge
                      variant={goal.status === "approved" ? "default" : "secondary"}
                    >
                      {goal.status === "approved" ? "Approved" : goal.status === "submitted" ? "Submitted" : "Draft"}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{goal.progress || 0}% complete</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No goals created yet</p>
              <Button className="mt-4" asChild>
                <Link href="/employee/goals/new">Create Your First Goal</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/employee/goals/new">Create New Goal</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/employee/goals">View All Goals</Link>
        </Button>
        {activeCycle && (
          <Button variant="outline" asChild>
            <Link href={`/employee/checkin?cycleId=${activeCycle._id}`}>Schedule Check-in</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
