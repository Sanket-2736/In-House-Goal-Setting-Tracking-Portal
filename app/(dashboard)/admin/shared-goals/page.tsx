"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Send, Search } from "lucide-react";

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface SharedGoal {
  _id: string;
  title: string;
  description?: string;
  thrustArea: string;
  uomType: string;
  target: number;
  targetDate?: string;
  recipients: Array<{
    employeeId: Employee;
    weightage: number;
  }>;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface GoalCycle {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export default function SharedGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thrustArea: "Strategy",
    uomType: "numeric_min",
    target: "",
    targetDate: "",
    defaultWeightage: "10",
  });

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
          // Set active cycle as default
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

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/admin/users?role=employee");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch shared goals
  useEffect(() => {
    if (selectedCycle) {
      const fetchSharedGoals = async () => {
        try {
          setLoading(true);
          const res = await fetch(
            `/api/admin/shared-goals?cycleId=${selectedCycle}`
          );
          if (res.ok) {
            const data = await res.json();
            setSharedGoals(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching shared goals:", error);
          toast.error("Failed to fetch shared goals");
        } finally {
          setLoading(false);
        }
      };
      fetchSharedGoals();
    }
  }, [selectedCycle]);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeToggle = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleCreateSharedGoal = async () => {
    if (!selectedCycle) {
      toast.error("Please select a cycle");
      return;
    }

    if (!formData.title || !formData.thrustArea || !formData.target) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedEmployees.size === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (
      formData.uomType === "timeline" &&
      !formData.targetDate
    ) {
      toast.error("Please select a target date for timeline UoM");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thrustArea: formData.thrustArea,
          uomType: formData.uomType,
          target: parseFloat(formData.target),
          targetDate: formData.targetDate || undefined,
          cycleId: selectedCycle,
          recipientIds: Array.from(selectedEmployees),
          defaultWeightage: parseFloat(formData.defaultWeightage),
        }),
      });

      if (res.ok) {
        toast.success("Shared goal created and pushed to recipients");
        setFormData({
          title: "",
          description: "",
          thrustArea: "Strategy",
          uomType: "numeric_min",
          target: "",
          targetDate: "",
          defaultWeightage: "10",
        });
        setSelectedEmployees(new Set());
        setIsDialogOpen(false);

        // Refresh shared goals
        const refreshRes = await fetch(
          `/api/admin/shared-goals?cycleId=${selectedCycle}`
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSharedGoals(data.data || []);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create shared goal");
      }
    } catch (error) {
      console.error("Error creating shared goal:", error);
      toast.error("Failed to create shared goal");
    } finally {
      setLoading(false);
    }
  };

  const handlePushToEmployees = async (sharedGoalId: string) => {
    toast.success("Shared goal already pushed to all recipients");
  };

  const thrustAreas = [
    "Strategy",
    "Operations",
    "People",
    "Finance",
    "Customer",
    "Innovation",
    "Compliance",
    "Quality",
  ];

  const uomTypes = [
    { value: "numeric_min", label: "Numeric (Higher is Better)" },
    { value: "numeric_max", label: "Numeric (Lower is Better)" },
    { value: "timeline", label: "Timeline" },
    { value: "zero", label: "Zero-Based" },
  ];

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Goals</h1>
          <p className="text-gray-600 mt-1">
            Create and manage goals shared across multiple employees
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Shared Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Shared Goal</DialogTitle>
              <DialogDescription>
                Create a goal and push it to multiple employees
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Goal Details */}
              <div className="space-y-3">
                <h3 className="font-semibold">Goal Details</h3>

                <div>
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter goal title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter goal description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thrustArea">Thrust Area *</Label>
                    <Select
                      value={formData.thrustArea}
                      onValueChange={(value) =>
                        setFormData({ ...formData, thrustArea: value })
                      }
                    >
                      <SelectTrigger id="thrustArea">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {thrustAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="uomType">UoM Type *</Label>
                    <Select
                      value={formData.uomType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, uomType: value })
                      }
                    >
                      <SelectTrigger id="uomType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uomTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target">Target *</Label>
                    <Input
                      id="target"
                      type="number"
                      placeholder="Enter target value"
                      value={formData.target}
                      onChange={(e) =>
                        setFormData({ ...formData, target: e.target.value })
                      }
                    />
                  </div>

                  {formData.uomType === "timeline" && (
                    <div>
                      <Label htmlFor="targetDate">Target Date *</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="defaultWeightage">Default Weightage (%)</Label>
                  <Input
                    id="defaultWeightage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    value={formData.defaultWeightage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultWeightage: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Each recipient can adjust their own weightage
                  </p>
                </div>
              </div>

              {/* Recipients Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold">Select Recipients</h3>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={selectedEmployees.has(emp._id)}
                          onCheckedChange={() =>
                            handleEmployeeToggle(emp._id)
                          }
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-gray-500">
                            {emp.email} • {emp.department}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No employees found
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  Selected: {selectedEmployees.size} employee(s)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSharedGoal}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Create & Push
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cycle Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="cycle-select" className="whitespace-nowrap">
              Select Cycle:
            </Label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger id="cycle-select" className="w-64">
                <SelectValue placeholder="Select a cycle" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle._id} value={cycle._id}>
                    {cycle.name} ({cycle.year})
                    {cycle.isActive && " - Active"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shared Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : sharedGoals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal Title</TableHead>
                    <TableHead>Thrust Area</TableHead>
                    <TableHead>UoM Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedGoals.map((goal) => (
                    <TableRow key={goal._id}>
                      <TableCell className="font-medium">{goal.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{goal.thrustArea}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {goal.uomType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{goal.target}</TableCell>
                      <TableCell>
                        <Badge>{goal.recipients.length}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {goal.createdBy.name}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePushToEmployees(goal._id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No shared goals yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create a shared goal to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
