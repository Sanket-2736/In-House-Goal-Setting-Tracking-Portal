"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";
import { apiGet } from "@/lib/hooks/useApi";
import { logger } from "@/lib/utils/logger";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  goals: number;
  approved: number;
  status: string;
  completion: number;
}

export default function ManagerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState([
    {
      label: "Team Size",
      value: "0",
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Pending Approvals",
      value: "0",
      icon: AlertCircle,
      color: "text-amber-500",
    },
    {
      label: "Check-ins Due",
      value: "0",
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      label: "Team Completion",
      value: "0%",
      icon: BarChart3,
      color: "text-green-500",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch pending approvals
        const approvalsResponse = await apiGet("/api/manager/approvals?limit=100", { showToast: false });
        if (approvalsResponse?.success && approvalsResponse.data) {
          const sheets = approvalsResponse.data;
          
          // Transform goal sheets into team member stats
          const memberMap = new Map<string, TeamMember>();
          
          sheets.forEach((sheet: any) => {
            const empId = sheet.employeeId._id;
            if (!memberMap.has(empId)) {
              memberMap.set(empId, {
                _id: empId,
                name: sheet.employeeId.name,
                email: sheet.employeeId.email,
                employeeId: sheet.employeeId.employeeId,
                department: sheet.employeeId.department,
                goals: sheet.goals?.length || 0,
                approved: 0,
                status: "pending",
                completion: 0,
              });
            }
          });
          
          const members = Array.from(memberMap.values());
          setTeamMembers(members);
          
          // Update stats
          setStats([
            {
              label: "Team Size",
              value: members.length.toString(),
              icon: Users,
              color: "text-blue-500",
            },
            {
              label: "Pending Approvals",
              value: sheets.length.toString(),
              icon: AlertCircle,
              color: "text-amber-500",
            },
            {
              label: "Check-ins Due",
              value: "0",
              icon: AlertCircle,
              color: "text-red-500",
            },
            {
              label: "Team Completion",
              value: "0%",
              icon: BarChart3,
              color: "text-green-500",
            },
          ]);
          
          logger.success("Manager dashboard data loaded");
        }
      } catch (error) {
        logger.error("Failed to load manager dashboard data", error);
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
        title="Team Dashboard"
        description="Manage your team's goals and track progress"
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
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Goal status and completion for your team</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{member.goals}</TableCell>
                      <TableCell>{member.approved}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "approved"
                              ? "default"
                              : member.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.status === "approved"
                            ? "Approved"
                            : member.status === "pending"
                            ? "Pending"
                            : "On Track"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${member.completion}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {member.completion}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/manager/approvals`}>
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/manager/approvals">
            Review Pending Goals
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/manager/checkins">
            Schedule Check-ins
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/manager/reports">
            View Reports
          </Link>
        </Button>
      </div>
    </div>
  );
}
