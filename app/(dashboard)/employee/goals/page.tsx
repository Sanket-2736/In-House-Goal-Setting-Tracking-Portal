"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit2 } from "lucide-react";
import { apiGet } from "@/lib/hooks/useApi";
import { logger } from "@/lib/utils/logger";

interface GoalSheet {
  _id: string;
  cycleId: {
    name: string;
    year: number;
  };
  status: "draft" | "submitted" | "approved" | "returned" | "locked";
  submittedAt?: string;
  approvedAt?: string;
  goals: any[];
}

export default function GoalsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [goalSheets, setGoalSheets] = useState<GoalSheet[]>([]);

  useEffect(() => {
    const fetchGoalSheets = async () => {
      try {
        setIsLoading(true);
        // Fetch all goal sheets for the current user
        // Note: This would require a new API endpoint to fetch all sheets
        // For now, we'll fetch the active cycle and then the sheet for that cycle
        const cycleResponse = await apiGet("/api/goals/cycles/active", { showToast: false });
        if (cycleResponse?.success && cycleResponse.data) {
          const sheetResponse = await apiGet(`/api/goals/sheet?cycleId=${cycleResponse.data._id}`, { showToast: false });
          if (sheetResponse?.success && sheetResponse.data) {
            setGoalSheets([sheetResponse.data]);
          }
        }
        logger.success("Goal sheets loaded");
      } catch (error) {
        logger.error("Error fetching goal sheets", error);
        setGoalSheets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalSheets();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      submitted: "secondary",
      approved: "default",
      returned: "destructive",
      locked: "default",
    };

    const labels: Record<string, string> = {
      draft: "Draft",
      submitted: "Submitted",
      approved: "Approved",
      returned: "Returned",
      locked: "Locked",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Goals"
        description="View and manage your goal sheets across cycles"
        breadcrumbs={[{ label: "Goals" }]}
      />

      {/* Create New Button */}
      <Link href="/employee/goals/new">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Goal Sheet
        </Button>
      </Link>

      {/* Goal Sheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Sheets</CardTitle>
          <CardDescription>Your goal sheets across all cycles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : goalSheets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No goal sheets yet</p>
              <Link href="/employee/goals/new">
                <Button>Create Your First Goal Sheet</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goalSheets.map((sheet) => (
                    <TableRow key={sheet._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sheet.cycleId.name}</p>
                          <p className="text-sm text-muted-foreground">{sheet.cycleId.year}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sheet.status)}</TableCell>
                      <TableCell>{sheet.goals.length}</TableCell>
                      <TableCell>{formatDate(sheet.submittedAt)}</TableCell>
                      <TableCell>{formatDate(sheet.approvedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {sheet.status === "draft" ? (
                            <Link href={`/employee/goals/${sheet._id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/employee/goals/${sheet._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
