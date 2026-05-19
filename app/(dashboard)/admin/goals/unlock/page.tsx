"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, Unlock } from "lucide-react";
import { format } from "date-fns";

interface GoalSheet {
  _id: string;
  employeeId: { _id: string; name: string; email: string };
  cycleId: { name: string; year: number };
  status: string;
  goals: Array<{ title: string; weightage: number }>;
  lockedAt?: string;
  approvedAt?: string;
}

interface UnlockHistory {
  sheetId: string;
  employeeName: string;
  unlockedAt: string;
  reason: string;
  unlockedBy: string;
}

export default function AdminGoalUnlockPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockHistory, setUnlockHistory] = useState<UnlockHistory[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGoalSheet(null);

      // Search for employee by name or email
      const response = await fetch(
        `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const result = await response.json();
      const users = result.data;

      if (users.length === 0) {
        setError("No users found");
        return;
      }

      // Get the first user's goal sheet
      const user = users[0];
      const sheetResponse = await fetch(
        `/api/admin/goals/sheet?employeeId=${user._id}`
      );

      if (!sheetResponse.ok) {
        setError("No goal sheet found for this employee");
        return;
      }

      const sheetResult = await sheetResponse.json();
      setGoalSheet(sheetResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!goalSheet || !unlockReason.trim()) {
      setError("Please provide a reason for unlocking");
      return;
    }

    try {
      setUnlocking(true);
      setError(null);

      const response = await fetch(`/api/admin/goals/${goalSheet._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: unlockReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to unlock goal sheet");
      }

      const result = await response.json();

      // Add to history
      setUnlockHistory([
        {
          sheetId: goalSheet._id,
          employeeName: goalSheet.employeeId.name,
          unlockedAt: new Date().toISOString(),
          reason: unlockReason,
          unlockedBy: "Current Admin",
        },
        ...unlockHistory,
      ]);

      setUnlockDialogOpen(false);
      setUnlockReason("");
      setGoalSheet(null);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goal Unlock"
        description="Unlock locked goal sheets for editing (exception handling)"
      />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Search Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Search for Goal Sheet</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search by employee name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Goal Sheet Details */}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : goalSheet ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{goalSheet.employeeId.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {goalSheet.employeeId.email}
                </p>
              </div>
              <Badge variant={goalSheet.status === "locked" ? "destructive" : "default"}>
                {goalSheet.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Cycle</Label>
                <p className="font-medium mt-1">
                  {goalSheet.cycleId.name} ({goalSheet.cycleId.year})
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Goals</Label>
                <p className="font-medium mt-1">{goalSheet.goals.length} goals</p>
              </div>
              {goalSheet.approvedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Approved</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(goalSheet.approvedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {goalSheet.lockedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Locked</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(goalSheet.lockedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>

            {/* Goals Summary */}
            <div>
              <Label className="text-sm font-medium">Goals Summary</Label>
              <div className="mt-2 space-y-2">
                {goalSheet.goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span>{goal.title}</span>
                    <Badge variant="outline">{goal.weightage}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            {goalSheet.status === "locked" || goalSheet.status === "approved" ? (
              <Button
                onClick={() => setUnlockDialogOpen(true)}
                className="gap-2"
              >
                <Unlock className="h-4 w-4" />
                Unlock for Editing
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                This goal sheet is not locked and cannot be unlocked.
              </p>
            )}
          </div>
        </Card>
      ) : null}

      {/* Unlock History */}
      {unlockHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Unlock History</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Unlocked At</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Unlocked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unlockHistory.map((record, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{record.employeeName}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(record.unlockedAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">{record.reason}</TableCell>
                  <TableCell className="text-sm">{record.unlockedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Unlock Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Goal Sheet</DialogTitle>
            <DialogDescription>
              Provide a reason for unlocking this goal sheet. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Unlock</Label>
              <Textarea
                placeholder="Explain why this goal sheet needs to be unlocked..."
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="mt-1 min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlockDialogOpen(false)}
              disabled={unlocking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={unlocking || !unlockReason.trim()}
            >
              {unlocking ? "Unlocking..." : "Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
