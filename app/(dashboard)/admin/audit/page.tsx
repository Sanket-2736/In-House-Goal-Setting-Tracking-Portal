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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ChevronDown, Download } from "lucide-react";

/**
 * Convert audit logs to CSV format
 */
function convertAuditToCSV(logs: AuditLog[]): string {
  if (logs.length === 0) return "";

  const headers = [
    "Timestamp",
    "Changed By",
    "Email",
    "Entity Type",
    "Entity ID",
    "Change Type",
    "Reason",
  ];

  const csvHeaders = headers.map((h) => `"${h}"`).join(",");

  const csvRows = logs.map((log) => {
    return [
      new Date(log.timestamp).toLocaleString(),
      log.changedBy.name,
      log.changedBy.email,
      log.entityType,
      log.entityId,
      log.changeType,
      log.reason || "",
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

interface AuditLog {
  _id: string;
  timestamp: string;
  changedBy: {
    name: string;
    email: string;
  };
  entityType: string;
  entityId: string;
  changeType: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
}

export default function AuditTrailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [users, setUsers] = useState<Array<{ _id: string; name: string }>>([]);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  // Fetch users for filter
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      if (selectedUser && selectedUser !== "all") params.append("userId", selectedUser);
      if (selectedEntityType && selectedEntityType !== "all") params.append("entityType", selectedEntityType);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
        toast.success(`Loaded ${data.data?.length || 0} audit logs`);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const csv = convertAuditToCSV(auditLogs);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit trail exported successfully");
    } catch (error) {
      console.error("Error exporting audit trail:", error);
      toast.error("Failed to export audit trail");
    }
  };

  const getChangeTypeBadge = (changeType: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      approve: "default",
      reject: "destructive",
      submit: "secondary",
      lock: "default",
    };
    return (
      <Badge variant={variants[changeType] || "outline"}>
        {changeType.charAt(0).toUpperCase() + changeType.slice(1)}
      </Badge>
    );
  };

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <p className="text-gray-600 mt-1">
          Track all changes made to the system
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user" className="mt-1">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger id="entity-type" className="mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="GoalSheet">Goal Sheet</SelectItem>
                  <SelectItem value="GoalItem">Goal Item</SelectItem>
                  <SelectItem value="CheckIn">Check-in</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="GoalCycle">Goal Cycle</SelectItem>
                  <SelectItem value="SharedGoal">Shared Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchAuditLogs}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={auditLogs.length === 0}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export to CSV
      </Button>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.changedBy.name}</div>
                        <div className="text-xs text-gray-500">
                          {log.changedBy.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entityType}</Badge>
                      </TableCell>
                      <TableCell>{getChangeTypeBadge(log.changeType)}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {log.reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                          className="gap-1"
                        >
                          <ChevronDown className="w-4 h-4" />
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
              <p className="text-gray-500">
                {loading ? "Loading audit logs..." : "No audit logs found"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Set filters and click "Search" to view audit logs
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Full details of the change
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Timestamp</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Changed By</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLog.changedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Entity Type</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Change Type</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLog.changeType}</p>
                </div>
              </div>

              {selectedLog.reason && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Reason</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.previousValue && Object.keys(selectedLog.previousValue).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Previous Value
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.previousValue, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.newValue && Object.keys(selectedLog.newValue).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    New Value
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {(!selectedLog.previousValue || Object.keys(selectedLog.previousValue).length === 0) &&
                (!selectedLog.newValue || Object.keys(selectedLog.newValue).length === 0) && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No value changes recorded for this audit log</p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
