"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, EmptyState, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { BarChart2, Users, CheckCircle2, Clock } from "lucide-react";

// ─── Color constants ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#34d399",
};
const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#4f8ef7",
  completed: "#34d399",
};
const WORKLOAD_COLORS = ["#4f8ef7", "#34d399", "#f87171"];

// ─── Tiny stat pill ───────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="text-xs font-semibold text-[var(--text-primary)] ml-auto">
        {value}
      </span>
    </div>
  );
}

// ─── Member workload row ──────────────────────────────────────────────────────
function WorkloadRow({
  member,
}: {
  member: {
    user: { id: string; name: string; avatarUrl?: string };
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
}) {
  const pct =
    member.totalTasks > 0
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {member.user.name}
          </span>
          <span className="text-xs text-[var(--text-muted)] ml-2 flex-shrink-0">
            {pct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background:
                pct >= 80
                  ? "#34d399"
                  : pct >= 40
                  ? "#4f8ef7"
                  : "#fbbf24",
            }}
          />
        </div>
      </div>
      <div className="flex gap-3 flex-shrink-0 ml-2">
        <div className="text-center">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {member.totalTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">total</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-emerald-400">
            {member.completedTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">done</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-amber-400">
            {member.pendingTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">pending</p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && (
        <p className="text-[var(--text-muted)] mb-1 font-medium">{label}</p>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-[var(--text-secondary)] capitalize">
            {p.name}:
          </span>
          <span className="font-semibold text-[var(--text-primary)]">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  // All analytics queries
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const { data: priorityData, isLoading: priorityLoading } = useQuery({
    queryKey: ["analytics-priority"],
    queryFn: () => analyticsApi.getTasksByPriority(),
  });

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["analytics-status"],
    queryFn: () => analyticsApi.getStatusDistribution(),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => analyticsApi.getProgressTrend(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: workloadData, isLoading: workloadLoading } = useQuery({
    queryKey: ["analytics-workload"],
    queryFn: () => analyticsApi.getMemberWorkload(),
  });

  // ── Data extraction ──────────────────────────────────────────────────────
  const kpis = (dashData?.data?.data as { kpis?: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  } } | undefined)?.kpis;

  const rawPriority = (priorityData?.data?.data as { priority: string; count: number }[] | undefined) ?? [];
  const priorityChartData = [
    { name: "High", value: rawPriority.find((p) => p.priority === "high")?.count ?? 0, color: PRIORITY_COLORS.high },
    { name: "Medium", value: rawPriority.find((p) => p.priority === "medium")?.count ?? 0, color: PRIORITY_COLORS.medium },
    { name: "Low", value: rawPriority.find((p) => p.priority === "low")?.count ?? 0, color: PRIORITY_COLORS.low },
  ];

  const rawStatus = (statusData?.data?.data as { status: string; count: number }[] | undefined) ?? [];
  const statusChartData = [
    { name: "Todo", value: rawStatus.find((s) => s.status === "todo")?.count ?? 0, color: STATUS_COLORS.todo },
    { name: "In Progress", value: rawStatus.find((s) => s.status === "in_progress")?.count ?? 0, color: STATUS_COLORS.in_progress },
    { name: "Completed", value: rawStatus.find((s) => s.status === "completed")?.count ?? 0, color: STATUS_COLORS.completed },
  ];

  const trendChartData = (trendData?.data?.data as { week: string; created: number; completed: number }[] | undefined) ?? [];

  const workload = (workloadData?.data?.data as {
    user: { id: string; name: string; avatarUrl?: string };
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }[] | undefined) ?? [];

  // For team productivity bar chart — members with at least 1 task
  const productivityChartData = workload
    .filter((m) => m.totalTasks > 0)
    .map((m) => ({
      name: m.user.name.split(" ")[0], // first name for chart axis
      fullName: m.user.name,
      completed: m.completedTasks,
      pending: m.pendingTasks,
      total: m.totalTasks,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // ── KPI summary cards ────────────────────────────────────────────────────
  const kpiCards = [
    { label: "Total Projects", value: kpis?.totalProjects ?? 0, icon: <BarChart2 className="w-4 h-4" />, color: "text-blue-400" },
    { label: "Total Tasks", value: kpis?.totalTasks ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-purple-400" },
    { label: "Completed", value: kpis?.completedTasks ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400" },
    { label: "Pending", value: kpis?.pendingTasks ?? 0, icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
    { label: "Overdue", value: kpis?.overdueTasks ?? 0, icon: <Clock className="w-4 h-4" />, color: "text-red-400" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Analytics" subtitle="Team productivity and project insights" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── KPI Summary ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {kpiCards.map((card) =>
            dashLoading ? (
              <Skeleton key={card.label} className="h-20" />
            ) : (
              <div
                key={card.label}
                className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4"
              >
                <div className={cn("mb-1", card.color)}>{card.icon}</div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {card.value}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {card.label}
                </p>
              </div>
            )
          )}
        </div>

        {/* ── Row 1: Priority Pie + Status Distribution ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Tasks by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              {priorityLoading ? (
                <Skeleton className="h-52" />
              ) : priorityChartData.every((d) => d.value === 0) ? (
                <EmptyState
                  icon={<BarChart2 className="w-5 h-5" />}
                  title="No task data"
                  description="Tasks will appear here once created."
                />
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {priorityChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 flex-1">
                    {priorityChartData.map((d) => (
                      <StatPill key={d.name} label={d.name} value={d.value} color={d.color} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-52" />
              ) : statusChartData.every((d) => d.value === 0) ? (
                <EmptyState
                  icon={<BarChart2 className="w-5 h-5" />}
                  title="No task data"
                  description="Tasks will appear here once created."
                />
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 flex-1">
                    {statusChartData.map((d) => (
                      <StatPill key={d.name} label={d.name} value={d.value} color={d.color} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: Progress Trend ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress Trend (Last 6 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-56" />
            ) : trendChartData.length === 0 ? (
              <EmptyState
                icon={<BarChart2 className="w-5 h-5" />}
                title="No trend data"
                description="Trend data will populate after tasks are created and completed."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#4f8ef7" strokeWidth={2} fill="url(#colorCreated)" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" strokeWidth={2} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Row 3: Team Productivity Overview ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Team Productivity Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team Productivity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {workloadLoading ? (
                <Skeleton className="h-56" />
              ) : productivityChartData.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="No team data"
                  description="Add members and assign tasks to see productivity insights."
                />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={productivityChartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    barSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="completed" name="Completed" fill={WORKLOAD_COLORS[1]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill={WORKLOAD_COLORS[0]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Member Workload Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Member Workload Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {workloadLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : workload.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="No members"
                  description="Add team members to projects to see their workload."
                />
              ) : (
                <div className="overflow-y-auto max-h-[260px] pr-1">
                  {workload.map((member) => (
                    <WorkloadRow key={member.user.id} member={member} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}