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
import { format } from "date-fns";
import { ChevronRight, AlertCircle } from "lucide-react";

interface GoalSheet {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
    email: string;
  };
  cycleId: {
    _id: string;
    name: string;
    year: string;
  };
  status: string;
  goals: Array<{ _id: string; weightage: number }>;
  submittedAt: string;
  totalWeightage: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchApprovals();
  }, [pagination.page]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/manager/approvals?page=${pagination.page}&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch approvals");
      }

      const result = await response.json();
      setApprovals(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (sheetId: string) => {
    router.push(`/manager/approvals/${sheetId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pending Approvals"
          description="Review and approve goal sheets from your team"
        />
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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Pending Approvals"
          description="Review and approve goal sheets from your team"
        />
        <Badge variant="secondary">
          {pagination.total} pending
        </Badge>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {approvals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="text-4xl">✓</div>
            <h3 className="text-lg font-semibold">No pending approvals</h3>
            <p className="text-muted-foreground">
              All goal sheets from your team have been reviewed.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead className="text-right">Weightage</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((sheet) => (
                <TableRow key={sheet._id}>
                  <TableCell className="font-medium">
                    {sheet.employeeId.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sheet.employeeId.employeeId}
                  </TableCell>
                  <TableCell>{sheet.employeeId.department}</TableCell>
                  <TableCell className="text-right">
                    {sheet.goals.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        sheet.totalWeightage === 100 ? "default" : "outline"
                      }
                    >
                      {sheet.totalWeightage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(sheet.submittedAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReview(sheet._id)}
                      className="gap-2"
                    >
                      Review
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
