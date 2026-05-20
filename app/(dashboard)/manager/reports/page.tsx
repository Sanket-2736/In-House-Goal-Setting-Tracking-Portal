"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Download, RefreshCw, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

interface ReportData {
  employeeName: string;
  employeeId: string;
  department: string;
  manager: string;
  goalTitle: string;
  uomType: string;
  plannedTarget: number;
  Q1Actual?: number;
  Q1Score?: number;
  Q2Actual?: number;
  Q2Score?: number;
  Q3Actual?: number;
  Q3Score?: number;
  Q4Actual?: number;
  Q4Score?: number;
  status: string;
}

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

export default function ManagerReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("achievements");
  
  // Shared filter states
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Achievement data states
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Completion data states
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Redirect if not manager or admin
  useEffect(() => {
    if (session && session.user.role !== "manager" && session.user.role !== "admin") {
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
          } else if (data.data?.length > 0) {
            setSelectedCycle(data.data[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching cycles:", error);
      }
    };
    fetchCycles();
  }, []);

  // Fetch unique departments from the manager's team list
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/manager/checkins");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const depts = [
              ...new Set(json.data.map((u: any) => u.department).filter(Boolean)),
            ] as string[];
            setDepartments(depts);
          }
        }
      } catch (error) {
        console.error("Error fetching departments from checkins:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch achievements data
  const fetchAchievements = async () => {
    if (!selectedCycle) return;

    try {
      setLoadingAchievements(true);
      const params = new URLSearchParams({
        cycleId: selectedCycle,
        ...(selectedDepartment && selectedDepartment !== "all" && { department: selectedDepartment }),
        ...(selectedQuarter && selectedQuarter !== "all" && { quarter: selectedQuarter }),
      });

      const res = await fetch(`/api/reports/achievement?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.data || []);
      } else {
        toast.error("Failed to load achievement report");
      }
    } catch (error) {
      console.error("Error fetching achievement report:", error);
      toast.error("Failed to load achievement report");
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Fetch completion data
  const fetchCompletion = async () => {
    if (!selectedCycle) return;

    try {
      setLoadingCompletion(true);
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
        toast.error("Failed to load completion statistics");
      }
    } catch (error) {
      console.error("Error fetching completion statistics:", error);
      toast.error("Failed to load completion statistics");
    } finally {
      setLoadingCompletion(false);
    }
  };

  // Load data based on active tab and filters
  useEffect(() => {
    if (selectedCycle) {
      if (activeTab === "achievements") {
        fetchAchievements();
      } else {
        fetchCompletion();
      }
    }
  }, [selectedCycle, selectedDepartment, selectedQuarter, activeTab]);

  // Auto-refresh for Completion Dashboard
  useEffect(() => {
    if (!autoRefresh || !selectedCycle || activeTab !== "completion") return;

    const interval = setInterval(() => {
      fetchCompletion();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedCycle, selectedDepartment, selectedQuarter, activeTab]);

  // Export handling
  const handleExport = async (format: "xlsx" | "csv") => {
    if (!selectedCycle) {
      toast.error("Please select a cycle");
      return;
    }

    try {
      setExporting(true);
      const params = new URLSearchParams({
        format,
        cycleId: selectedCycle,
        ...(selectedDepartment && selectedDepartment !== "all" && { department: selectedDepartment }),
      });

      const res = await fetch(`/api/reports/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = format === "xlsx" ? "xlsx" : "csv";
        a.download = `Team_Achievement_Report_${new Date().toISOString().split("T")[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report exported successfully");
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "text-muted-foreground";
    if (score >= 100) return "text-green-600 font-semibold dark:text-green-400";
    if (score >= 75) return "text-blue-600 font-semibold dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 font-semibold dark:text-yellow-400";
    return "text-red-600 font-semibold dark:text-red-400";
  };

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
    if (isOverdue) return "bg-red-50/30 hover:bg-red-50/50 dark:bg-red-950/20 dark:hover:bg-red-950/30";
    if (isInProgress) return "bg-yellow-50/30 hover:bg-yellow-50/50 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30";
    if (isComplete) return "bg-green-50/30 hover:bg-green-50/50 dark:bg-green-950/20 dark:hover:bg-green-950/30";
    return "";
  };

  if (!session || (session.user.role !== "manager" && session.user.role !== "admin")) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Team Reports"
          description="View achievements and track goal completion status for your team"
          breadcrumbs={[{ label: "Reports" }]}
        />
        
        {activeTab === "completion" && (
          <div className="flex items-center gap-4 self-end md:self-auto">
            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              Auto-refresh (30s)
            </label>
            <Button
              onClick={fetchCompletion}
              disabled={loadingCompletion}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {loadingCompletion ? (
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
        )}
      </div>

      {/* Filters Shared Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Goal Cycle *</label>
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
              <label className="text-sm font-medium text-muted-foreground">Department</label>
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
              <label className="text-sm font-medium text-muted-foreground">Quarter</label>
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

      {/* Main Tabbed Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="achievements">Team Achievements</TabsTrigger>
          <TabsTrigger value="completion">Submission & Check-ins</TabsTrigger>
        </TabsList>

        {/* Tab 1: Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("xlsx")}
              disabled={exporting || reportData.length === 0}
              variant="outline"
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to Excel
                </>
              )}
            </Button>
            <Button
              onClick={() => handleExport("csv")}
              disabled={exporting || reportData.length === 0}
              variant="outline"
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to CSV
                </>
              )}
            </Button>
            <Button
              onClick={fetchAchievements}
              disabled={loadingAchievements}
              variant="ghost"
              size="icon"
              className="ml-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAchievements ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Achievement Data</CardTitle>
              <CardDescription>Goal metrics and progress for your direct reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAchievements ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span>Loading achievement report...</span>
                </div>
              ) : reportData.length > 0 ? (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Goal Title</TableHead>
                        <TableHead>UoM Type</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Q1 Act/Score</TableHead>
                        <TableHead>Q2 Act/Score</TableHead>
                        <TableHead>Q3 Act/Score</TableHead>
                        <TableHead>Q4 Act/Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {row.employeeName}
                            <div className="text-xs text-muted-foreground">{row.employeeId}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{row.department}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={row.goalTitle}>
                            {row.goalTitle}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {row.uomType.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{row.plannedTarget}</TableCell>
                          
                          {/* Q1 */}
                          <TableCell>
                            <div>{row.Q1Actual !== undefined ? row.Q1Actual : "-"}</div>
                            <div className={getScoreColor(row.Q1Score)}>
                              {row.Q1Score !== undefined ? `${Math.round(row.Q1Score)}%` : ""}
                            </div>
                          </TableCell>
                          
                          {/* Q2 */}
                          <TableCell>
                            <div>{row.Q2Actual !== undefined ? row.Q2Actual : "-"}</div>
                            <div className={getScoreColor(row.Q2Score)}>
                              {row.Q2Score !== undefined ? `${Math.round(row.Q2Score)}%` : ""}
                            </div>
                          </TableCell>
                          
                          {/* Q3 */}
                          <TableCell>
                            <div>{row.Q3Actual !== undefined ? row.Q3Actual : "-"}</div>
                            <div className={getScoreColor(row.Q3Score)}>
                              {row.Q3Score !== undefined ? `${Math.round(row.Q3Score)}%` : ""}
                            </div>
                          </TableCell>
                          
                          {/* Q4 */}
                          <TableCell>
                            <div>{row.Q4Actual !== undefined ? row.Q4Actual : "-"}</div>
                            <div className={getScoreColor(row.Q4Score)}>
                              {row.Q4Score !== undefined ? `${Math.round(row.Q4Score)}%` : ""}
                            </div>
                          </TableCell>
                          
                          <TableCell className="whitespace-nowrap">
                            <Badge variant={row.status === "completed" ? "default" : "secondary"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No data available for this cycle</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Make sure team members have approved or locked goal sheets</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Completion Dashboard */}
        <TabsContent value="completion" className="space-y-6">
          {completionData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {completionData.employeeSubmissionStatus.length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Total Team Size</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {completionData.employeeSubmissionStatus.filter((e) => e.isComplete).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Submitted/Approved</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {completionData.employeeSubmissionStatus.filter((e) => e.isInProgress).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">In Progress</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {completionData.employeeSubmissionStatus.filter((e) => e.isOverdue).length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Overdue (Draft)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Submission Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Team Submission Details
                </CardTitle>
                <CardDescription>Goal sheet status for your direct reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCompletion ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span>Loading submission details...</span>
                  </div>
                ) : completionData?.employeeSubmissionStatus ? (
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Approved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completionData.employeeSubmissionStatus.map((emp, idx) => (
                          <TableRow
                            key={idx}
                            className={getRowColor(emp.isOverdue, emp.isInProgress, emp.isComplete)}
                          >
                            <TableCell className="font-medium whitespace-nowrap">
                              {emp.employeeName}
                              <div className="text-xs text-muted-foreground">{emp.employeeId}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{emp.department}</TableCell>
                            <TableCell>{getStatusBadge(emp.status)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {emp.submittedDate ? new Date(emp.submittedDate).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {emp.approvedDate ? new Date(emp.approvedDate).toLocaleDateString() : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No submission data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Check-in Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  My Check-in Progress
                </CardTitle>
                <CardDescription>Your check-in status completion</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCompletion ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span>Loading check-in metrics...</span>
                  </div>
                ) : completionData?.managerCheckInStatus && completionData.managerCheckInStatus.length > 0 ? (
                  <div className="space-y-6">
                    {completionData.managerCheckInStatus.map((mgr, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">{mgr.managerName}</span>
                          <Badge
                            variant={
                              mgr.isComplete
                                ? "default"
                                : mgr.isInProgress
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {mgr.completionPercentage}% Complete
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Completed Check-ins</span>
                            <span>{mgr.checkInsCompleted} / {mgr.teamSize}</span>
                          </div>
                          <Progress value={mgr.completionPercentage} className="h-3" />
                        </div>

                        {mgr.isComplete && (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>All check-ins for your team have been completed!</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No check-in metrics available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/10 border border-red-500/30 rounded"></div>
                  <span className="text-sm font-medium">Overdue (Draft / Returned)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500/10 border border-yellow-500/30 rounded"></div>
                  <span className="text-sm font-medium">In Progress (Submitted)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/10 border border-green-500/30 rounded"></div>
                  <span className="text-sm font-medium">Complete (Approved / Locked)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
