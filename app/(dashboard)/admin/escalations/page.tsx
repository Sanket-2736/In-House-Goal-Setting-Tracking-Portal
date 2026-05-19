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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Play,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface EscalationRule {
  _id: string;
  triggerType: "goal_not_submitted" | "goal_not_approved" | "checkin_not_completed";
  daysAfterTrigger: number;
  notifyRecipients: string[];
  escalationChain: Array<{
    tier: number;
    daysAfter: number;
    notifyRecipients: string[];
  }>;
  isActive: boolean;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface EscalationLog {
  _id: string;
  userId: { name: string; email: string; employeeId: string };
  managerId?: { name: string; email: string };
  triggerType: string;
  daysSinceTrigger: number;
  notificationSentTo: string[];
  status: "pending" | "notified" | "resolved";
  notifiedAt?: string;
  createdAt: string;
}

export default function EscalationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logTriggerFilter, setLogTriggerFilter] = useState<string>("all");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [formData, setFormData] = useState({
    triggerType: "goal_not_submitted",
    daysAfterTrigger: 7,
    notifyRecipients: ["employee", "manager"],
    escalationChain: [] as Array<{
      tier: number;
      daysAfter: number;
      notifyRecipients: string[];
    }>,
  });

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  // Fetch rules and logs
  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/escalations");
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Failed to load escalation rules");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (logFilter) params.append("status", logFilter);
      if (logTriggerFilter) params.append("triggerType", logTriggerFilter);

      const res = await fetch(`/api/admin/escalations/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load escalation logs");
    }
  };

  const handleRunEscalations = async () => {
    try {
      setRunning(true);
      const res = await fetch("/api/escalations/run");
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Escalations triggered: ${data.data.triggered}, Notifications sent: ${data.data.notifications}`
        );
        fetchLogs();
      } else {
        toast.error("Failed to run escalations");
      }
    } catch (error) {
      console.error("Error running escalations:", error);
      toast.error("Failed to run escalations");
    } finally {
      setRunning(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      if (!formData.triggerType || !formData.daysAfterTrigger) {
        toast.error("Please fill in all required fields");
        return;
      }

      const method = editingRule ? "PUT" : "POST";
      const url = editingRule
        ? `/api/admin/escalations/${editingRule._id}`
        : "/api/admin/escalations";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(
          editingRule ? "Rule updated successfully" : "Rule created successfully"
        );
        setFormOpen(false);
        setEditingRule(null);
        setFormData({
          triggerType: "goal_not_submitted",
          daysAfterTrigger: 7,
          notifyRecipients: ["employee", "manager"],
          escalationChain: [],
        });
        fetchRules();
      } else {
        toast.error("Failed to save rule");
      }
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error("Failed to save rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const res = await fetch(`/api/admin/escalations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Rule deleted successfully");
        fetchRules();
      } else {
        toast.error("Failed to delete rule");
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to delete rule");
    }
  };

  const handleEditRule = (rule: EscalationRule) => {
    setEditingRule(rule);
    setFormData({
      triggerType: rule.triggerType,
      daysAfterTrigger: rule.daysAfterTrigger,
      notifyRecipients: rule.notifyRecipients,
      escalationChain: rule.escalationChain,
    });
    setFormOpen(true);
  };

  const toggleLogExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      goal_not_submitted: "Goal Not Submitted",
      goal_not_approved: "Goal Not Approved",
      checkin_not_completed: "Check-in Not Completed",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "notified":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Escalation Management</h1>
          <p className="text-gray-600 mt-1">
            Configure escalation rules and view escalation logs
          </p>
        </div>
        <Button onClick={handleRunEscalations} disabled={running} className="gap-2">
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Escalations
            </>
          )}
        </Button>
      </div>

      {/* Escalation Rules Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Escalation Rules</CardTitle>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setFormData({
                    triggerType: "goal_not_submitted",
                    daysAfterTrigger: 7,
                    notifyRecipients: ["employee", "manager"],
                    escalationChain: [],
                  });
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Escalation Rule" : "Create Escalation Rule"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Trigger Type */}
                <div>
                  <Label>Trigger Type *</Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, triggerType: value as any })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goal_not_submitted">
                        Goal Not Submitted
                      </SelectItem>
                      <SelectItem value="goal_not_approved">
                        Goal Not Approved
                      </SelectItem>
                      <SelectItem value="checkin_not_completed">
                        Check-in Not Completed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Days After Trigger */}
                <div>
                  <Label>Days After Trigger *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.daysAfterTrigger}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daysAfterTrigger: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>

                {/* Notify Recipients */}
                <div>
                  <Label>Notify Recipients *</Label>
                  <div className="space-y-2 mt-2">
                    {["employee", "manager", "skip_level", "hr"].map((recipient) => (
                      <label key={recipient} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.notifyRecipients.includes(recipient)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...formData.notifyRecipients, recipient]
                              : formData.notifyRecipients.filter((r) => r !== recipient);
                            setFormData({
                              ...formData,
                              notifyRecipients: updated,
                            });
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">
                          {recipient.replace("_", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Escalation Chain */}
                <div>
                  <Label>Escalation Chain (Optional)</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Add up to 3 tiers of escalation
                  </p>
                  {formData.escalationChain.map((tier, idx) => (
                    <div key={idx} className="mt-3 p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Tier {tier.tier}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              escalationChain: formData.escalationChain.filter(
                                (_, i) => i !== idx
                              ),
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Days After Previous</Label>
                          <Input
                            type="number"
                            min="1"
                            value={tier.daysAfter}
                            onChange={(e) => {
                              const updated = [...formData.escalationChain];
                              updated[idx].daysAfter = parseInt(e.target.value);
                              setFormData({
                                ...formData,
                                escalationChain: updated,
                              });
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notify</Label>
                          <div className="space-y-1 mt-1">
                            {["employee", "manager", "skip_level", "hr"].map(
                              (recipient) => (
                                <label
                                  key={recipient}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={tier.notifyRecipients.includes(
                                      recipient
                                    )}
                                    onChange={(e) => {
                                      const updated = [...formData.escalationChain];
                                      updated[idx].notifyRecipients = e.target.checked
                                        ? [
                                            ...tier.notifyRecipients,
                                            recipient,
                                          ]
                                        : tier.notifyRecipients.filter(
                                            (r) => r !== recipient
                                          );
                                      setFormData({
                                        ...formData,
                                        escalationChain: updated,
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <span className="capitalize">
                                    {recipient.replace("_", " ")}
                                  </span>
                                </label>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.escalationChain.length < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          escalationChain: [
                            ...formData.escalationChain,
                            {
                              tier: formData.escalationChain.length + 1,
                              daysAfter: 3,
                              notifyRecipients: ["manager"],
                            },
                          ],
                        });
                      }}
                      className="mt-2 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tier
                    </Button>
                  )}
                </div>

                {/* Save Button */}
                <Button onClick={handleSaveRule} className="w-full">
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rules.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger Type</TableHead>
                    <TableHead>Days After</TableHead>
                    <TableHead>Notify</TableHead>
                    <TableHead>Escalation Chain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">
                        {getTriggerTypeLabel(rule.triggerType)}
                      </TableCell>
                      <TableCell>{rule.daysAfterTrigger} days</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {rule.notifyRecipients.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs">
                              {r.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.escalationChain.length > 0 ? (
                          <Badge variant="secondary">
                            {rule.escalationChain.length} tier(s)
                          </Badge>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.isActive ? "default" : "secondary"}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.createdBy.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No escalation rules configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={logFilter} onValueChange={(v) => {
                setLogFilter(v);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Trigger Type</Label>
              <Select value={logTriggerFilter} onValueChange={(v) => {
                setLogTriggerFilter(v);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="goal_not_submitted">
                    Goal Not Submitted
                  </SelectItem>
                  <SelectItem value="goal_not_approved">
                    Goal Not Approved
                  </SelectItem>
                  <SelectItem value="checkin_not_completed">
                    Check-in Not Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs Table */}
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Trigger Type</TableHead>
                    <TableHead>Days Since</TableHead>
                    <TableHead>Notified To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleLogExpand(log._id)}
                    >
                      <TableCell className="font-medium">
                        <div>{log.userId.name}</div>
                        <div className="text-xs text-gray-500">
                          {log.userId.employeeId}
                        </div>
                      </TableCell>
                      <TableCell>{log.managerId?.name || "-"}</TableCell>
                      <TableCell>
                        {getTriggerTypeLabel(log.triggerType)}
                      </TableCell>
                      <TableCell>{log.daysSinceTrigger} days</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {log.notificationSentTo.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs">
                              {r.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No escalation logs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
