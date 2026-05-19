"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface EmployeeSubmission {
  employeeName: string;
  employeeId: string;
  department: string;
  status: string;
  submittedDate: string | null;
  approvedDate: string | null;
  isOverdue: boolean;
  isInProgress: boolean;
  isComplete: boolean;
}

interface ManagerCheckIn {
  managerName: string;
  teamSize: number;
  checkInsCompleted: number;
  completionPercentage: number;
  isOverdue: boolean;
  isInProgress: boolean;
  isComplete: boolean;
}

interface CompletionData {
  employeeSubmissionStatus: EmployeeSubmission[];
  managerCheckInStatus: ManagerCheckIn[];
}

interface GoalCycle {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export default function CompletionDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  // Fetch cycles
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const res = await fetch("/api/admin/cycles");
        if (res.ok) {
          const data = await res.json();
          setCycles(data.data || []);
          const activeCycle = data.data?.find((c: GoalCycle) => c.isActive);
          if (activeCycle) {
            setSelectedCycle(activeCycle._id);
          }
        }
      } catch (error) {
        console.error("Error fetching cycles:", error);
      }
    };
    fetchCycles();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/admin/users?role=employee");
        if (res.ok) {
          const data = await res.json();
          const depts = [
            ...new Set(data.data?.map((u: any) => u.department).filter(Boolean)),
          ] as string[];
          setDepartments(depts);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const fetchCompletionData = async () => {
    if (!selectedCycle) {
      toast.error("Please select a cycle");
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        cycleId: selectedCycle,
        ...(selectedDepartment && selectedDepartment !== "all" && { department: selectedDepartment }),
        ...(selectedQuarter && selectedQuarter !== "all" && { quarter: selectedQuarter }),
      });

      const res = await fetch(`/api/reports/completion?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCompletionData(data.data);
      } else {
        toast.error("Failed to load completion data");
      }
    } catch (error) {
      console.error("Error fetching completion data:", error);
      toast.error("Failed to load completion data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh || !selectedCycle) return;

    const interval = setInterval(() => {
      fetchCompletionData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedCycle, selectedDepartment, selectedQuarter]);

  useEffect(() => {
    if (selectedCycle) {
      fetchCompletionData();
    }
  }, [selectedCycle]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "destructive",
      submitted: "secondary",
      returned: "destructive",
      approved: "default",
      locked: "default",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRowColor = (isOverdue: boolean, isInProgress: boolean, isComplete: boolean) => {
    if (isOverdue) return "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/30 dark:hover:bg-red-950/50";
    if (isInProgress) return "bg-yellow-50/50 hover:bg-yellow-100/50 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50";
    if (isComplete) return "bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/30 dark:hover:bg-green-950/50";
    return "";
  };

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Completion Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time view of submission and check-in status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <Button
            onClick={fetchCompletionData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Cycle *</label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle._id} value={cycle._id}>
                      {cycle.name} ({cycle.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All quarters</SelectItem>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {completionData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {completionData.employeeSubmissionStatus.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Total Employees</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {
                    completionData.employeeSubmissionStatus.filter(
                      (e) => e.isComplete
                    ).length
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">Submitted</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {
                    completionData.employeeSubmissionStatus.filter(
                      (e) => e.isInProgress
                    ).length
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {
                    completionData.employeeSubmissionStatus.filter(
                      (e) => e.isOverdue
                    ).length
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Submission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Employee Submission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completionData?.employeeSubmissionStatus ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Approved Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionData.employeeSubmissionStatus.map((emp, idx) => (
                    <TableRow
                      key={idx}
                      className={getRowColor(
                        emp.isOverdue,
                        emp.isInProgress,
                        emp.isComplete
                      )}
                    >
                      <TableCell className="font-medium">
                        {emp.employeeName}
                        <div className="text-xs text-muted-foreground">
                          {emp.employeeId}
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>
                        {emp.submittedDate
                          ? new Date(emp.submittedDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {emp.approvedDate
                          ? new Date(emp.approvedDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading employee submission status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manager Check-in Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Manager Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completionData?.managerCheckInStatus ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Team Size</TableHead>
                    <TableHead>Check-ins Completed</TableHead>
                    <TableHead>Completion %</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionData.managerCheckInStatus.map((mgr, idx) => (
                    <TableRow
                      key={idx}
                      className={getRowColor(
                        mgr.isOverdue,
                        mgr.isInProgress,
                        mgr.isComplete
                      )}
                    >
                      <TableCell className="font-medium">
                        {mgr.managerName}
                      </TableCell>
                      <TableCell>{mgr.teamSize}</TableCell>
                      <TableCell>
                        {mgr.checkInsCompleted} / {mgr.teamSize}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mgr.isComplete
                              ? "default"
                              : mgr.isInProgress
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {mgr.completionPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={mgr.completionPercentage}
                            className="w-24"
                          />
                          {mgr.isComplete && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading manager check-in status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 dark:bg-red-950/50 dark:border-red-800 rounded"></div>
              <span className="text-sm">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 dark:bg-yellow-950/50 dark:border-yellow-800 rounded"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 dark:bg-green-950/50 dark:border-green-800 rounded"></div>
              <span className="text-sm">Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
