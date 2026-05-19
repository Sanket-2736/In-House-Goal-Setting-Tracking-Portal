"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";

interface Cycle {
  _id: string;
  name: string;
  year: number;
  phase1Open: string;
  q1Open: string;
  q2Open: string;
  q3Open: string;
  q4Open: string;
  isActive: boolean;
  status: "active" | "upcoming" | "closed";
  createdAt: string;
}

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    phase1Open: "",
    q1Open: "",
    q2Open: "",
    q3Open: "",
    q4Open: "",
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/cycles");

      if (!response.ok) {
        throw new Error("Failed to fetch cycles");
      }

      const result = await response.json();
      setCycles(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    try {
      const response = await fetch("/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create cycle");
      }

      setCreateDialogOpen(false);
      setFormData({
        name: "",
        year: new Date().getFullYear(),
        phase1Open: "",
        q1Open: "",
        q2Open: "",
        q3Open: "",
        q4Open: "",
      });
      await fetchCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cycle");
    }
  };

  const handleActivateCycle = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/admin/cycles/${cycleId}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to activate cycle");
      }

      await fetchCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate cycle");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Goal Cycles" description="Manage goal cycles" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Goal Cycles" description="Manage goal cycles" />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create New Cycle
      </Button>

      {/* Active Cycle Banner */}
      {cycles.find((c) => c.isActive) && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Active Cycle</h3>
              <p className="text-sm text-green-800 mt-1">
                {cycles.find((c) => c.isActive)?.name} ({cycles.find((c) => c.isActive)?.year})
              </p>
            </div>
            <Badge className="bg-green-600">Currently Active</Badge>
          </div>
        </Card>
      )}

      {/* Cycles List */}
      <div className="space-y-4">
        {cycles.map((cycle) => (
          <Card key={cycle._id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{cycle.name}</h3>
                  <p className="text-sm text-muted-foreground">Year: {cycle.year}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(cycle.status)}
                  {!cycle.isActive && cycle.status !== "closed" && (
                    <Button
                      size="sm"
                      onClick={() => handleActivateCycle(cycle._id)}
                    >
                      Set as Active
                    </Button>
                  )}
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Phase 1 Opens</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(cycle.phase1Open), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Q1 Opens</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(cycle.q1Open), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Q2 Opens</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(cycle.q2Open), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Q3 Opens</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(cycle.q3Open), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Q4 Opens</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(cycle.q4Open), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {format(new Date(cycle.createdAt), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Cycle Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goal Cycle</DialogTitle>
            <DialogDescription>Set up a new goal cycle with dates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cycle Name</Label>
                <Input
                  placeholder="e.g., FY 2025-26"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Phase 1 Goal Setting Opens</Label>
              <Input
                type="datetime-local"
                value={formData.phase1Open}
                onChange={(e) => setFormData({ ...formData, phase1Open: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Quarter Windows</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Q1 Opens</Label>
                  <Input
                    type="datetime-local"
                    value={formData.q1Open}
                    onChange={(e) => setFormData({ ...formData, q1Open: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Q2 Opens</Label>
                  <Input
                    type="datetime-local"
                    value={formData.q2Open}
                    onChange={(e) => setFormData({ ...formData, q2Open: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Q3 Opens</Label>
                  <Input
                    type="datetime-local"
                    value={formData.q3Open}
                    onChange={(e) => setFormData({ ...formData, q3Open: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Q4 Opens</Label>
                  <Input
                    type="datetime-local"
                    value={formData.q4Open}
                    onChange={(e) => setFormData({ ...formData, q4Open: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCycle}>Create Cycle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
