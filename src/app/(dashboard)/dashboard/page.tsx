"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle,
  TrendingUp, ArrowRight, Activity, Plus,
} from "lucide-react";
import { analyticsApi, activityLogsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { Header } from "@/components/layout/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Card, CardHeader, CardTitle, CardContent,
  Avatar, Progress, Badge, Skeleton, EmptyState,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatDeadline, getStatusColor, getStatusLabel, timeAgo } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#4f8ef7", "#34d399", "#fbbf24", "#f87171", "#8b5cf6"];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const { data: logsData } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => activityLogsApi.getAll({ limit: 8 }),
  });


  const { data: priorityApiData } = useQuery({
    queryKey: ["tasks-by-priority"],
    queryFn: () => analyticsApi.getTasksByPriority(),
  });

  const { data: trendApiData } = useQuery({
    queryKey: ["progress-trend"],
    queryFn: () => analyticsApi.getProgressTrend(),
    staleTime: 1000 * 60 * 5,
  });

  const dash = dashData?.data?.data;
  const kpis = dash?.kpis;
  const logs = logsData?.data?.data?.logs || [];

  // Chart data
  const rawPriority = (priorityApiData?.data?.data as { priority: string; count: number }[]) || [];

  const priorityData = [
    {
      name: "High",
      value: rawPriority.find((p) => p.priority === "high")?.count ?? 0,
      color: "#f87171",
    },
    {
      name: "Medium",
      value: rawPriority.find((p) => p.priority === "medium")?.count ?? 0,
      color: "#fbbf24",
    },
    {
      name: "Low",
      value: rawPriority.find((p) => p.priority === "low")?.count ?? 0,
      color: "#34d399",
    },
  ];

  const progressTrend = (
    trendApiData?.data?.data as
    | { week: string; created: number; completed: number }[]
    | undefined
  ) ?? [
      { week: "W1", completed: 0, created: 0 },
      { week: "W2", completed: 0, created: 0 },
      { week: "W3", completed: 0, created: 0 },
      { week: "W4", completed: 0, created: 0 },
      { week: "W5", completed: 0, created: 0 },
      { week: "W6", completed: 0, created: 0 },
    ];

  const memberWorkload = dash?.memberWorkload?.slice(0, 5) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's what's happening with your projects today."
        action={{ label: "New Project", onClick: () => router.push("/projects"), icon: <Plus style={{ width: 14, height: 14 }} /> }}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Projects"
            value={kpis?.totalProjects ?? 0}
            icon={<FolderKanban style={{ width: 16, height: 16 }} />}
            color="blue"
            loading={isLoading}
            trend={{ value: 12, label: "this month" }}
          />
          <KPICard
            title="Total Tasks"
            value={kpis?.totalTasks ?? 0}
            icon={<CheckSquare style={{ width: 16, height: 16 }} />}
            color="violet"
            loading={isLoading}
          />
          <KPICard
            title="Completed"
            value={kpis?.completedTasks ?? 0}
            icon={<TrendingUp style={{ width: 16, height: 16 }} />}
            color="emerald"
            loading={isLoading}
            suffix={`/ ${kpis?.totalTasks ?? 0}`}
          />
          <KPICard
            title="Pending"
            value={kpis?.pendingTasks ?? 0}
            icon={<Clock style={{ width: 16, height: 16 }} />}
            color="amber"
            loading={isLoading}
          />
          <KPICard
            title="Overdue"
            value={kpis?.overdueTasks ?? 0}
            icon={<AlertTriangle style={{ width: 16, height: 16 }} />}
            color="rose"
            loading={isLoading}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Area Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={progressTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#4f8ef7" strokeWidth={2} fill="url(#colorCompleted)" />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#34d399" strokeWidth={2} fill="url(#colorCreated)" />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {priorityData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-[var(--text-muted)]">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Project Summaries */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects Overview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
                View all <ArrowRight style={{ width: 12, height: 12 }} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : dash?.projectSummaries?.length === 0 ? (
                <EmptyState
                  icon={<FolderKanban className="w-5 h-5" />}
                  title="No projects yet"
                  description="Create your first project to see it here."
                  action={<Button size="sm" onClick={() => router.push("/projects")}>Create Project</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {dash?.projectSummaries?.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer transition-colors group"
                      onClick={() => router.push(`/projects/${p.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-blue)] transition-colors">
                            {p.name}
                          </span>
                          {p.isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                              Overdue
                            </span>
                          )}
                        </div>
                        <Progress value={p.completionPercentage} />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{p.completionPercentage}%</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{p.pendingTasks} pending</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/activity")}>
                <Activity style={{ width: 12, height: 12 }} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {logs.length === 0 ? (
                <EmptyState icon={<Activity className="w-5 h-5" />} title="No activity yet" />
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      {log.user ? (
                        <Avatar name={log.user.name} src={log.user.avatarUrl} size="sm" className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                          <Activity style={{ width: 12, height: 12 }} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                          {log.action.replace(/_/g, " ").toLowerCase()}
                          {(log.metadata as Record<string, string>)?.projectName && (
                            <span className="text-[var(--accent-blue)] font-medium">
                              {" "}&ldquo;{(log.metadata as Record<string, string>).projectName}&rdquo;
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{timeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Workload */}
        {memberWorkload.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Workload</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/team")}>
                View team <ArrowRight style={{ width: 12, height: 12 }} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {memberWorkload.map((m,index) => {
                  const pct = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
                  return (
                    <div key={index} className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                      <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" className="mx-auto mb-2" />
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate mb-1">{m.user.name}</p>
                      <Progress value={pct} className="mb-1.5" />
                      <p className="text-[10px] text-[var(--text-muted)]">{m.completedTasks}/{m.totalTasks} done</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
