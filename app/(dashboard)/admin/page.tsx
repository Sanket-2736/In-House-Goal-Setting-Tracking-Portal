"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Zap, TrendingUp, BarChart3, Clock } from "lucide-react";
import { apiGet } from "@/lib/hooks/useApi";
import { logger } from "@/lib/utils/logger";

interface AuditLog {
  _id: string;
  action: string;
  userId: { name: string };
  createdAt: string;
  type: string;
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      label: "Total Employees",
      value: "0",
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Cycle",
      value: "N/A",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      label: "Submission Rate",
      value: "0%",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Overall Completion",
      value: "0%",
      icon: BarChart3,
      color: "text-purple-500",
    },
  ]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch audit logs for recent activity
        const auditResponse = await apiGet("/api/admin/audit?limit=5", { showToast: false });
        if (auditResponse?.success && auditResponse.data) {
          setRecentActivity(auditResponse.data);
          console.log("Audit logs fetched:", auditResponse.data);
        }
        
        // Fetch active cycle
        const cycleResponse = await apiGet("/api/goals/cycles/active", { showToast: false });
        if (cycleResponse?.success && cycleResponse.data) {
          const cycle = cycleResponse.data;
          console.log("Active cycle:", cycle);
          
          // Fetch completion report for submission and completion rates
          const completionResponse = await apiGet("/api/reports/completion", { showToast: false });
          if (completionResponse?.success && completionResponse.data) {
            const completionData = completionResponse.data;
            console.log("Completion data:", completionData);
            
            const totalEmployees = completionData.totalEmployees || 0;
            const submitted = completionData.submitted || 0;
            const completed = completionData.completed || 0;
            
            const submissionRate = totalEmployees > 0 ? Math.round((submitted / totalEmployees) * 100) : 0;
            const completionRate = totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0;
            
            // Update stats with real data
            setStats([
              {
                label: "Total Employees",
                value: totalEmployees.toString(),
                icon: Users,
                color: "text-blue-500",
              },
              {
                label: "Active Cycle",
                value: cycle.name || "N/A",
                icon: Zap,
                color: "text-amber-500",
              },
              {
                label: "Submission Rate",
                value: `${submissionRate}%`,
                icon: TrendingUp,
                color: "text-green-500",
              },
              {
                label: "Overall Completion",
                value: `${completionRate}%`,
                icon: BarChart3,
                color: "text-purple-500",
              },
            ]);
          }
        }
        
        logger.success("Admin dashboard data loaded");
      } catch (error) {
        logger.error("Failed to load admin dashboard data", error);
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getActivityIcon = (action: string | undefined) => {
    if (!action) return "📌";
    if (action.includes("submit")) return "📤";
    if (action.includes("approve")) return "✅";
    if (action.includes("check-in")) return "📋";
    if (action.includes("user")) return "👤";
    if (action.includes("cycle")) return "📅";
    return "📌";
  };

  const formatTimestamp = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Admin Dashboard"
        description="System overview and management"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

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
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="text-2xl flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.action || "Unknown action"}</p>
                    <p className="text-sm text-muted-foreground">by {activity.userId?.name || "System"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(activity.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Server</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <Badge variant="secondary">Warning</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/cycles">
                Create Goal Cycle
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/users">
                Manage Users
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/audit">
                View Audit Logs
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/reports">
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
