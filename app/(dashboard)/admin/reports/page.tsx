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
import { toast } from "sonner";
import { Loader2, Download, RefreshCw } from "lucide-react";

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

interface GoalCycle {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export default function AchievementReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  // Fetch departments
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

  // Fetch report data
  const fetchReport = async () => {
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

      const res = await fetch(`/api/reports/achievement?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.data || []);
        toast.success(`Loaded ${data.count} records`);
      } else {
        toast.error("Failed to load report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!selectedCycle) {
      toast.error("Please select a cycle");
      return;
    }

    try {
      setExporting(true);
      const params = new URLSearchParams({
        format: "xlsx",
        cycleId: selectedCycle,
        ...(selectedDepartment && selectedDepartment !== "all" && { department: selectedDepartment }),
      });

      const res = await fetch(`/api/reports/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Achievement_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
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

  // Export to CSV
  const handleExportCSV = async () => {
    if (!selectedCycle) {
      toast.error("Please select a cycle");
      return;
    }

    try {
      setExporting(true);
      const params = new URLSearchParams({
        format: "csv",
        cycleId: selectedCycle,
        ...(selectedDepartment && selectedDepartment !== "all" && { department: selectedDepartment }),
      });

      const res = await fetch(`/api/reports/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Achievement_Report_${new Date().toISOString().split("T")[0]}.csv`;
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
    if (!score) return "text-gray-500";
    if (score >= 100) return "text-green-600 font-semibold";
    if (score >= 75) return "text-blue-600 font-semibold";
    if (score >= 50) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Achievement Report</h1>
        <p className="text-gray-600 mt-1">
          View and export goal achievement data
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="flex items-end">
              <Button
                onClick={fetchReport}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Load Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleExportExcel}
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
          onClick={handleExportCSV}
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
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Data</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Goal Title</TableHead>
                    <TableHead>UoM Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Q1 Actual</TableHead>
                    <TableHead>Q1 Score</TableHead>
                    <TableHead>Q2 Actual</TableHead>
                    <TableHead>Q2 Score</TableHead>
                    <TableHead>Q3 Actual</TableHead>
                    <TableHead>Q3 Score</TableHead>
                    <TableHead>Q4 Actual</TableHead>
                    <TableHead>Q4 Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {row.employeeName}
                        <div className="text-xs text-gray-500">
                          {row.employeeId}
                        </div>
                      </TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.manager}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {row.goalTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.uomType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.plannedTarget}</TableCell>
                      <TableCell>{row.Q1Actual || "-"}</TableCell>
                      <TableCell className={getScoreColor(row.Q1Score)}>
                        {row.Q1Score ? `${Math.round(row.Q1Score)}%` : "-"}
                      </TableCell>
                      <TableCell>{row.Q2Actual || "-"}</TableCell>
                      <TableCell className={getScoreColor(row.Q2Score)}>
                        {row.Q2Score ? `${Math.round(row.Q2Score)}%` : "-"}
                      </TableCell>
                      <TableCell>{row.Q3Actual || "-"}</TableCell>
                      <TableCell className={getScoreColor(row.Q3Score)}>
                        {row.Q3Score ? `${Math.round(row.Q3Score)}%` : "-"}
                      </TableCell>
                      <TableCell>{row.Q4Actual || "-"}</TableCell>
                      <TableCell className={getScoreColor(row.Q4Score)}>
                        {row.Q4Score ? `${Math.round(row.Q4Score)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {loading ? "Loading report..." : "No data available"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Select filters and click "Load Report" to view data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
