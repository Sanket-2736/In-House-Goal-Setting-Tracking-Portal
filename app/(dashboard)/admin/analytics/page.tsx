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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Download, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GoalCycle {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

interface AnalyticsData {
  overview?: any;
  trends?: any;
  distribution?: any;
  managerEffectiveness?: any;
  heatmap?: any;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const DEPARTMENT_COLORS: Record<string, string> = {
  Sales: "#3b82f6",
  Engineering: "#ef4444",
  Marketing: "#10b981",
  HR: "#f59e0b",
  Finance: "#8b5cf6",
  Operations: "#ec4899",
};

export default function AnalyticsDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Fetch analytics data
  useEffect(() => {
    if (selectedCycle) {
      fetchAnalytics();
    }
  }, [selectedCycle]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?cycleId=${selectedCycle}&view=all`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.data);
      } else {
        toast.error("Failed to load analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into goal achievement and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Cycle Selector */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="whitespace-nowrap font-medium">Select Cycle:</label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select cycle" />
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : analyticsData ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 print:hidden">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>

          {/* TAB 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            {analyticsData.overview?.kpis && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {analyticsData.overview.kpis.avgAchievement}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Avg Goal Achievement
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsData.overview.kpis.topDepartment}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Top Performing Dept
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsData.overview.kpis.mostCommonThrustArea}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Most Common Thrust Area
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {analyticsData.overview.kpis.submissionRate}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Submission Rate
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Department Progress Chart */}
            {analyticsData.overview?.departmentProgress && (
              <Card>
                <CardHeader>
                  <CardTitle>Department Progress by Quarter</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.overview.departmentProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Q1" fill="#3b82f6" />
                      <Bar dataKey="Q2" fill="#10b981" />
                      <Bar dataKey="Q3" fill="#f59e0b" />
                      <Bar dataKey="Q4" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: Trends */}
          <TabsContent value="trends" className="space-y-6">
            {/* Quarterly Trend */}
            {analyticsData.trends?.quarterlyTrend && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Quarter-on-Quarter Achievement Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.trends.quarterlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Department Trends */}
            {analyticsData.trends?.departmentTrends && (
              <Card>
                <CardHeader>
                  <CardTitle>Department Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.trends.departmentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {analyticsData.trends.departmentTrends.map(
                        (dept: any, idx: number) => (
                          <Line
                            key={dept.department}
                            type="monotone"
                            dataKey={dept.department}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                          />
                        )
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: Distribution */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thrust Area Pie Chart */}
              {analyticsData.distribution?.thrustAreaPie && (
                <Card>
                  <CardHeader>
                    <CardTitle>Goals by Thrust Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.distribution.thrustAreaPie}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.distribution.thrustAreaPie.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* UoM Type Bar Chart */}
              {analyticsData.distribution?.uomTypeBar && (
                <Card>
                  <CardHeader>
                    <CardTitle>Goals by UoM Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.distribution.uomTypeBar}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Thrust Area Radar Chart */}
            {analyticsData.distribution?.thrustAreaRadar && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Achievement per Thrust Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={analyticsData.distribution.thrustAreaRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Achievement %"
                        dataKey="achievement"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 4: Manager Effectiveness */}
          <TabsContent value="manager" className="space-y-6">
            {/* Manager Completion Rate Chart */}
            {analyticsData.managerEffectiveness?.managers && (
              <Card>
                <CardHeader>
                  <CardTitle>Manager Check-in Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.managerEffectiveness.managers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="managerName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completionRate" fill="#10b981" name="Completion %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top and Bottom Managers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Managers */}
              {analyticsData.managerEffectiveness?.topManagers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Top 3 Managers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analyticsData.managerEffectiveness.topManagers.map(
                      (mgr: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{mgr.managerName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {mgr.checkInsCompleted}/{mgr.teamSize} check-ins completed
                            </p>
                          </div>
                          <Badge className="bg-green-600 text-white ml-4 whitespace-nowrap">
                            {mgr.completionRate}%
                          </Badge>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bottom Managers */}
              {analyticsData.managerEffectiveness?.bottomManagers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Bottom 3 Managers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analyticsData.managerEffectiveness.bottomManagers.map(
                      (mgr: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{mgr.managerName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {mgr.checkInsCompleted}/{mgr.teamSize} check-ins completed
                            </p>
                          </div>
                          <Badge className="bg-red-600 text-white ml-4 whitespace-nowrap">
                            {mgr.completionRate}%
                          </Badge>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Manager Details Table */}
            {analyticsData.managerEffectiveness?.managers && (
              <Card>
                <CardHeader>
                  <CardTitle>Manager Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-3">Manager</th>
                          <th className="text-center py-2 px-3">Team Size</th>
                          <th className="text-center py-2 px-3">Check-ins</th>
                          <th className="text-center py-2 px-3">Completion %</th>
                          <th className="text-center py-2 px-3">Avg Approval Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.managerEffectiveness.managers.map(
                          (mgr: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3">{mgr.managerName}</td>
                              <td className="text-center py-2 px-3">{mgr.teamSize}</td>
                              <td className="text-center py-2 px-3">
                                {mgr.checkInsCompleted}
                              </td>
                              <td className="text-center py-2 px-3">
                                <Badge
                                  variant={
                                    mgr.completionRate >= 80
                                      ? "default"
                                      : mgr.completionRate >= 50
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {mgr.completionRate}%
                                </Badge>
                              </td>
                              <td className="text-center py-2 px-3">
                                {mgr.avgApprovalTime} days
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 5: Heatmap */}
          <TabsContent value="heatmap" className="space-y-6">
            {analyticsData.heatmap?.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Employee Progress Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">Employee</th>
                          <th className="border p-2 text-center">Q1</th>
                          <th className="border p-2 text-center">Q2</th>
                          <th className="border p-2 text-center">Q3</th>
                          <th className="border p-2 text-center">Q4</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.heatmap.data.map((row: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border p-2 font-medium">{row.employee}</td>
                            {["Q1", "Q2", "Q3", "Q4"].map((quarter) => {
                              const score = row[quarter];
                              let bgColor = "bg-gray-100";
                              if (score !== null) {
                                if (score > 80) bgColor = "bg-green-200";
                                else if (score >= 50) bgColor = "bg-yellow-200";
                                else bgColor = "bg-red-200";
                              }
                              return (
                                <td
                                  key={quarter}
                                  className={`border p-2 text-center ${bgColor}`}
                                  title={score !== null ? `${score}%` : "Not submitted"}
                                >
                                  {score !== null ? `${Math.round(score)}%` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="mt-6 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-200 border border-green-400 rounded"></div>
                      <span className="text-sm">&gt;80% (Excellent)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-200 border border-yellow-400 rounded"></div>
                      <span className="text-sm">50-80% (Good)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-200 border border-red-400 rounded"></div>
                      <span className="text-sm">&lt;50% (Needs Improvement)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded"></div>
                      <span className="text-sm">Not Submitted</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500">No analytics data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a cycle to view analytics
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
