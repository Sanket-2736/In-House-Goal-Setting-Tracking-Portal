"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon } from "lucide-react";

interface SharedGoal {
  _id: string;
  title: string;
  description?: string;
  thrustArea: string;
  uomType: string;
  target: number;
  targetDate?: string;
  recipients: Array<{
    employeeId: {
      _id: string;
      name: string;
      email: string;
      department: string;
    };
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

export default function TeamGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [loading, setLoading] = useState(false);

  // Redirect if not manager
  useEffect(() => {
    if (session && session.user.role !== "manager") {
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
            // Filter to only show goals where team members are recipients
            const filteredGoals = data.data?.filter((goal: SharedGoal) =>
              goal.recipients.some(
                (r) => r.employeeId._id === session?.user.id
              )
            ) || [];
            setSharedGoals(filteredGoals);
          }
        } catch (error) {
          console.error("Error fetching shared goals:", error);
          toast.error("Failed to fetch team goals");
        } finally {
          setLoading(false);
        }
      };
      fetchSharedGoals();
    }
  }, [selectedCycle, session?.user.id]);

  const getUoMLabel = (uomType: string) => {
    const labels: Record<string, string> = {
      numeric_min: "Numeric (Higher is Better)",
      numeric_max: "Numeric (Lower is Better)",
      timeline: "Timeline",
      zero: "Zero-Based",
    };
    return labels[uomType] || uomType;
  };

  if (!session || session.user.role !== "manager") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Shared Goals</h1>
        <p className="text-gray-600 mt-1">
          View shared goals assigned to your team members
        </p>
      </div>

      {/* Cycle Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label htmlFor="cycle-select" className="whitespace-nowrap font-medium">
              Select Cycle:
            </label>
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

      {/* Shared Goals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : sharedGoals.length > 0 ? (
          sharedGoals.map((goal) => (
            <Card key={goal._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <Badge variant="outline" className="gap-1">
                        <LinkIcon className="w-3 h-3" />
                        Shared Goal
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="text-gray-600 mt-2">{goal.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Goal Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Thrust Area</p>
                      <Badge variant="secondary" className="mt-1">
                        {goal.thrustArea}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">UoM Type</p>
                      <p className="font-medium mt-1">
                        {getUoMLabel(goal.uomType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Target</p>
                      <p className="font-medium mt-1">{goal.target}</p>
                    </div>
                    {goal.targetDate && (
                      <div>
                        <p className="text-sm text-gray-600">Target Date</p>
                        <p className="font-medium mt-1">
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recipients Table */}
                  <div>
                    <h4 className="font-semibold mb-3">Team Members</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Weightage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {goal.recipients.map((recipient) => (
                            <TableRow key={recipient.employeeId._id}>
                              <TableCell className="font-medium">
                                {recipient.employeeId.name}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {recipient.employeeId.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {recipient.employeeId.department}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge>{recipient.weightage}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Created Info */}
                  <div className="text-sm text-gray-500 pt-2 border-t">
                    Created by {goal.createdBy.name} on{" "}
                    {new Date(goal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg">
                  No shared goals for your team yet
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Shared goals will appear here when admins create them
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
