// src/app/(dashboard)/members/page.tsx

"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { analyticsApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Progress,
  Avatar,
  Badge,
  Input,
} from "@/components/ui";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ListTodo,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MemberWorkload {
  userId: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    role?: string;
  };
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({
  member,
  rank,
  onClick,
}: {
  member: MemberWorkload;
  rank: number;
  onClick: () => void;
}) {
  const completionPct =
    member.totalTasks > 0
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0;

  const progressColor =
    completionPct >= 80 ? "emerald" : completionPct >= 50 ? "blue" : "amber";

  const getRankBadge = (r: number) => {
    if (r === 1)
      return (
        <span className="text-yellow-400 text-sm font-bold" title="Top performer">
          🥇
        </span>
      );
    if (r === 2)
      return (
        <span className="text-slate-300 text-sm font-bold" title="Second place">
          🥈
        </span>
      );
    if (r === 3)
      return (
        <span className="text-amber-600 text-sm font-bold" title="Third place">
          🥉
        </span>
      );
    return (
      <span className="text-xs text-[var(--text-muted)] font-bold w-5 text-center">
        #{r}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]
                 hover:border-[var(--accent-blue)] hover:shadow-lg hover:shadow-blue-500/5
                 transition-all duration-200 cursor-pointer p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">{getRankBadge(rank)}</div>
        <Avatar name={member.user.name} src={member.user.avatarUrl ?? undefined} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate text-sm">
            {member.user.name}
          </h3>
          {member.user.email && (
            <p className="text-xs text-[var(--text-muted)] truncate">
              {member.user.email}
            </p>
          )}
          {member.user.role && (
            <Badge
              variant={
                member.user.role === "admin"
                  ? "purple"
                  : member.user.role === "project_manager"
                  ? "blue"
                  : "default"
              }
              className="mt-1 text-[10px] py-0"
            >
              {member.user.role.replace("_", " ")}
            </Badge>
          )}
        </div>
        <ChevronRight
          className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)]
                       group-hover:translate-x-0.5 transition-all flex-shrink-0"
        />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Completion Rate</span>
          <span
            className={`text-xs font-bold ${
              completionPct >= 80
                ? "text-emerald-400"
                : completionPct >= 50
                ? "text-blue-400"
                : "text-amber-400"
            }`}
          >
            {completionPct}%
          </span>
        </div>
        <Progress value={completionPct} color={progressColor} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-base font-bold text-[var(--text-primary)]">
            {member.totalTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Total</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-base font-bold text-emerald-400">
            {member.completedTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Done</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-base font-bold text-amber-400">
            {member.pendingTasks}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Pending</p>
        </div>
      </div>

      {/* Overdue warning */}
      {member.overdueTasks > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{member.overdueTasks} overdue task{member.overdueTasks > 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function MemberCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-2 w-full mb-4 rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "completion" | "total" | "pending" | "name"
  >("completion");

  const { data: dashData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 1000 * 60 * 2,
  });

  const workload: MemberWorkload[] =
    (dashData?.data?.data?.memberWorkload as MemberWorkload[]) || [];

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = workload
    .filter((m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.user.email || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const getPct = (m: MemberWorkload) =>
        m.totalTasks > 0
          ? Math.round((m.completedTasks / m.totalTasks) * 100)
          : 0;

      switch (sortBy) {
        case "completion":
          return getPct(b) - getPct(a);
        case "total":
          return b.totalTasks - a.totalTasks;
        case "pending":
          return b.pendingTasks - a.pendingTasks;
        case "name":
          return a.user.name.localeCompare(b.user.name);
        default:
          return 0;
      }
    });

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalTasks = workload.reduce((s, m) => s + m.totalTasks, 0);
  const totalCompleted = workload.reduce((s, m) => s + m.completedTasks, 0);
  const totalPending = workload.reduce((s, m) => s + m.pendingTasks, 0);
  const totalOverdue = workload.reduce((s, m) => s + (m.overdueTasks || 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Team Members"
        subtitle="Member workload and task assignment overview"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── Summary Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Team Members"
                value={workload.length}
                icon={Users}
                color="#4f8ef7"
              />
              <StatCard
                label="Total Tasks"
                value={totalTasks}
                icon={ListTodo}
                color="#8b5cf6"
              />
              <StatCard
                label="Completed"
                value={totalCompleted}
                icon={CheckCircle2}
                color="#34d399"
              />
              <StatCard
                label="Overdue"
                value={totalOverdue}
                icon={AlertTriangle}
                color="#f87171"
              />
            </>
          )}
        </div>

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search members by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2 flex-shrink-0">
            {(
              [
                { key: "completion", label: "Completion" },
                { key: "total", label: "Most Tasks" },
                { key: "pending", label: "Most Pending" },
                { key: "name", label: "Name A–Z" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  sortBy === key
                    ? "bg-[var(--accent-blue)] text-white border-transparent"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-blue)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Member Grid ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              {search ? "No members found" : "No team members yet"}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {search
                ? `No members matching "${search}"`
                : "Add members to projects to see them here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member, index) => (
              <MemberCard
                key={member.user.id}
                member={member}
                rank={index + 1}
                onClick={() =>
                  router.push(`/members/${member.user.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}