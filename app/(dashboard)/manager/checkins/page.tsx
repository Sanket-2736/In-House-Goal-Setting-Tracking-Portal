"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { getCurrentQuarter } from "@/lib/utils/quarter";

interface TeamCheckIn {
  employeeId: string;
  name: string;
  department: string;
  goalsCount: number;
  checkInStatus: "completed" | "in_progress" | "not_started";
  lastUpdated: string | null;
  quarter: string;
}

interface Summary {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

export default function ManagerCheckInsPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<TeamCheckIn[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">(getCurrentQuarter());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, [quarter, statusFilter]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("quarter", quarter);
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/manager/checkins?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch check-ins");
      }

      const result = await response.json();
      setCheckIns(result.data);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "not_started":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Check-ins"
          description="Monitor your team's quarterly progress"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Check-ins"
        description="Monitor your team's quarterly progress"
      />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Total Team Members</div>
            <div className="text-3xl font-bold mt-2">{summary.total}</div>
          </Card>
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="text-sm text-green-700 font-medium">Check-ins Completed</div>
            <div className="text-3xl font-bold text-green-700 mt-2">{summary.completed}</div>
          </Card>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="text-sm text-yellow-700 font-medium">In Progress</div>
            <div className="text-3xl font-bold text-yellow-700 mt-2">{summary.inProgress}</div>
          </Card>
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="text-sm text-red-700 font-medium">Not Started</div>
            <div className="text-3xl font-bold text-red-700 mt-2">{summary.notStarted}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Quarter</label>
          <Select value={quarter} onValueChange={(v) => setQuarter(v as "Q1" | "Q2" | "Q3" | "Q4")}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Q1 (July - September)</SelectItem>
              <SelectItem value="Q2">Q2 (October - December)</SelectItem>
              <SelectItem value="Q3">Q3 (January - February)</SelectItem>
              <SelectItem value="Q4">Q4 (March - June)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Check-ins Table */}
      {checkIns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="text-4xl">📋</div>
            <h3 className="text-lg font-semibold">No check-ins found</h3>
            <p className="text-muted-foreground">
              No team members match the selected filters.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.map((checkIn) => (
                <TableRow key={checkIn.employeeId}>
                  <TableCell className="font-medium">{checkIn.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {checkIn.department}
                  </TableCell>
                  <TableCell className="text-right">{checkIn.goalsCount}</TableCell>
                  <TableCell>{getStatusBadge(checkIn.checkInStatus)}</TableCell>
                  <TableCell className="text-sm">
                    {checkIn.lastUpdated
                      ? format(new Date(checkIn.lastUpdated), "MMM dd, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/manager/checkins/${checkIn.employeeId}?quarter=${quarter}`
                        )
                      }
                      className="gap-2"
                    >
                      View & Comment
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
