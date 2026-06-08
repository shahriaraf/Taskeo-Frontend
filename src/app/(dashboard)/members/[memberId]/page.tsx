// src/app/(dashboard)/members/[memberId]/page.tsx

"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { tasksApi, analyticsApi, usersApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Badge,
  Avatar,
  Progress,
  Input,
} from "@/components/ui";
import type { Task } from "@/types";
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Flame,
  Minus,
  ArrowDown,
  Calendar,
  FolderOpen,
  ListTodo,
  SlidersHorizontal,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "default" as const,
    icon: ListTodo,
    dotColor: "#94a3b8",
  },
  in_progress: {
    label: "In Progress",
    color: "info" as const,
    icon: Clock,
    dotColor: "#4f8ef7",
  },
  completed: {
    label: "Completed",
    color: "success" as const,
    icon: CheckCircle2,
    dotColor: "#34d399",
  },
} as const;

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    color: "danger" as const,
    icon: Flame,
    dotColor: "#f87171",
  },
  medium: {
    label: "Medium",
    color: "warning" as const,
    icon: Minus,
    dotColor: "#fbbf24",
  },
  low: {
    label: "Low",
    color: "default" as const,
    icon: ArrowDown,
    dotColor: "#94a3b8",
  },
} as const;

function getDueDateLabel(date: Date): { label: string; urgent: boolean } {
  if (isPast(date) && !isToday(date))
    return { label: "Overdue", urgent: true };
  if (isToday(date)) return { label: "Due today", urgent: true };
  if (isTomorrow(date)) return { label: "Due tomorrow", urgent: false };
  const days = differenceInDays(date, new Date());
  return { label: `${days}d left`, urgent: false };
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ task }: { task: Task }) {
  const status =
    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.todo;
  const priority =
    PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ||
    PRIORITY_CONFIG.medium;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueInfo = dueDate ? getDueDateLabel(dueDate) : null;
  const isOverdue =
    dueDate &&
    isPast(dueDate) &&
    !isToday(dueDate) &&
    task.status !== "completed";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-[var(--radius-lg)] border transition-all
                  hover:border-[var(--accent-blue)]/40 hover:bg-[var(--bg-elevated)]/50
                  ${
                    isOverdue
                      ? "border-rose-500/20 bg-rose-500/5"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  }`}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon
          className="w-4 h-4"
          style={{ color: status.dotColor }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1.5">
          <h4
            className={`font-medium text-sm leading-snug ${
              task.status === "completed"
                ? "line-through text-[var(--text-muted)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {task.title}
          </h4>
          <Badge variant={priority.color} className="text-[10px] py-0 px-1.5 flex-shrink-0">
            <PriorityIcon className="w-2.5 h-2.5 mr-0.5" />
            {priority.label}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-[var(--text-muted)] mb-2 line-clamp-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Project */}
          {task.project && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <FolderOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">
                {(task.project as { name: string }).name}
              </span>
            </div>
          )}

          {/* Due date */}
          {dueDate && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? "text-rose-400"
                  : dueInfo?.urgent
                  ? "text-amber-400"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{format(dueDate, "MMM d, yyyy")}</span>
              {dueInfo && (
                <span
                  className={`font-medium ${
                    isOverdue
                      ? "text-rose-400"
                      : dueInfo.urgent
                      ? "text-amber-400"
                      : ""
                  }`}
                >
                  · {dueInfo.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        <Badge variant={status.color} className="text-[10px]">
          {status.label}
        </Badge>
      </div>
    </div>
  );
}

// ─── Filter Button ────────────────────────────────────────────────────────────
function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? "bg-[var(--accent-blue)] text-white border-transparent"
          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-blue)]"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Task Skeleton ────────────────────────────────────────────────────────────
function TaskRowSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <Skeleton className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">(
    "dueDate"
  );
  const [showFilters, setShowFilters] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["member-tasks", memberId],
    queryFn: () =>
      tasksApi.getAll({
        assigneeId: memberId,
        limit: 100,
      }),
    enabled: !!memberId,
  });

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 1000 * 60 * 2,
  });

  // ── Resolve member info from workload ────────────────────────────────────────
  const workload = dashData?.data?.data?.memberWorkload || [];
  const memberWorkload = workload.find(
    (m: { user: { id: string } }) => m.user.id === memberId
  );
  const memberInfo = memberWorkload?.user;

  // ── Tasks ────────────────────────────────────────────────────────────────────
  const allTasks: Task[] = (tasksData?.data?.data as Task[]) || [];

  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Search
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          ((t.project as { name: string })?.name || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      tasks = tasks.filter((t) => t.priority === priorityFilter);
    }

    // Sort
    tasks.sort((a, b) => {
      if (sortBy === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return (
          (order[a.priority as keyof typeof order] ?? 1) -
          (order[b.priority as keyof typeof order] ?? 1)
        );
      }
      if (sortBy === "status") {
        const order = { in_progress: 0, todo: 1, completed: 2 };
        return (
          (order[a.status as keyof typeof order] ?? 1) -
          (order[b.status as keyof typeof order] ?? 1)
        );
      }
      return 0;
    });

    return tasks;
  }, [allTasks, search, statusFilter, priorityFilter, sortBy]);

  // ── Derived counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const now = new Date();
    return {
      total: allTasks.length,
      completed: allTasks.filter((t) => t.status === "completed").length,
      inProgress: allTasks.filter((t) => t.status === "in_progress").length,
      todo: allTasks.filter((t) => t.status === "todo").length,
      overdue: allTasks.filter(
        (t) =>
          t.dueDate &&
          isPast(new Date(t.dueDate)) &&
          !isToday(new Date(t.dueDate)) &&
          t.status !== "completed"
      ).length,
      high: allTasks.filter((t) => t.priority === "high").length,
    };
  }, [allTasks]);

  const completionPct =
    counts.total > 0
      ? Math.round((counts.completed / counts.total) * 100)
      : 0;

  // ── Group tasks by status ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    if (statusFilter !== "all") return { all: filteredTasks };
    return {
      overdue: filteredTasks.filter(
        (t) =>
          t.dueDate &&
          isPast(new Date(t.dueDate)) &&
          !isToday(new Date(t.dueDate)) &&
          t.status !== "completed"
      ),
      in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
      todo: filteredTasks.filter(
        (t) =>
          t.status === "todo" &&
          !(
            t.dueDate &&
            isPast(new Date(t.dueDate)) &&
            !isToday(new Date(t.dueDate))
          )
      ),
      completed: filteredTasks.filter((t) => t.status === "completed"),
    };
  }, [filteredTasks, statusFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <Header
        title={memberInfo ? `${memberInfo.name}'s Tasks` : "Member Tasks"}
        subtitle={`Viewing task breakdown for this team member`}
        action={{
          label: "Back",
          onClick: () => router.back(),
          icon: <ArrowLeft style={{ width: 14, height: 14 }} />,
        }}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* ── Member Profile Card ────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5">
            {tasksLoading && !memberInfo ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Avatar + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar
                    name={memberInfo?.name || "Member"}
                    src={memberInfo?.avatarUrl}
                    size="xl"
                    className="rounded-2xl flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
                      {memberInfo?.name || "Team Member"}
                    </h2>
                    {memberInfo?.email && (
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {memberInfo.email}
                      </p>
                    )}
                    {memberInfo?.role && (
                      <Badge
                        variant={
                          memberInfo.role === "admin"
                            ? "danger"
                            : memberInfo.role === "project_manager"
                            ? "info"
                            : "default"
                        }
                        className="mt-1.5"
                      >
                        {memberInfo.role.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="sm:w-64">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-muted)]">
                      Overall Progress
                    </span>
                    <span
                      className={`font-bold ${
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
                  <Progress
                    value={completionPct}
                    color={
                      completionPct >= 80
                        ? "emerald"
                        : completionPct >= 50
                        ? "blue"
                        : "amber"
                    }
                    className="h-2.5"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {counts.completed} of {counts.total} tasks completed
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── KPI Row ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: "Total",
              value: counts.total,
              color: "text-[var(--text-primary)]",
              bg: "bg-[var(--bg-surface)]",
            },
            {
              label: "In Progress",
              value: counts.inProgress,
              color: "text-blue-400",
              bg: "bg-blue-500/5",
            },
            {
              label: "To Do",
              value: counts.todo,
              color: "text-slate-400",
              bg: "bg-[var(--bg-surface)]",
            },
            {
              label: "Completed",
              value: counts.completed,
              color: "text-emerald-400",
              bg: "bg-emerald-500/5",
            },
            {
              label: "Overdue",
              value: counts.overdue,
              color: "text-rose-400",
              bg: "bg-rose-500/5",
            },
            {
              label: "High Priority",
              value: counts.high,
              color: "text-orange-400",
              bg: "bg-orange-500/5",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-3 text-center`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="Search tasks by title, description or project…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                showFilters
                  ? "bg-[var(--accent-blue)] text-white border-transparent"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-blue)]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Status:
                </span>
                {["all", "todo", "in_progress", "completed"].map((s) => (
                  <FilterBtn
                    key={s}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "all"
                      ? "All"
                      : s === "in_progress"
                      ? "In Progress"
                      : s === "todo"
                      ? "To Do"
                      : "Completed"}
                  </FilterBtn>
                ))}
              </div>

              <div className="w-px h-6 bg-[var(--border-subtle)] self-center mx-1" />

              {/* Priority */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Priority:
                </span>
                {["all", "high", "medium", "low"].map((p) => (
                  <FilterBtn
                    key={p}
                    active={priorityFilter === p}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {p === "all"
                      ? "All"
                      : p.charAt(0).toUpperCase() + p.slice(1)}
                  </FilterBtn>
                ))}
              </div>

              <div className="w-px h-6 bg-[var(--border-subtle)] self-center mx-1" />

              {/* Sort */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Sort:
                </span>
                {(
                  [
                    { key: "dueDate", label: "Due Date" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                  ] as const
                ).map(({ key, label }) => (
                  <FilterBtn
                    key={key}
                    active={sortBy === key}
                    onClick={() => setSortBy(key)}
                  >
                    {label}
                  </FilterBtn>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Task List ──────────────────────────────────────────────────────── */}
        {tasksLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <TaskRowSkeleton key={i} />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
              <ListTodo className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              No tasks found
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {search || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "This member has no tasks assigned yet"}
            </p>
          </div>
        ) : statusFilter !== "all" ? (
          // Flat list when a status filter is active
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-muted)] px-1">
              Showing {filteredTasks.length} task
              {filteredTasks.length !== 1 ? "s" : ""}
            </p>
            {filteredTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          // Grouped list
          <div className="space-y-6">
            {/* Overdue */}
            {grouped.overdue && grouped.overdue.length > 0 && (
              <TaskSection
                title="Overdue"
                count={grouped.overdue.length}
                tasks={grouped.overdue}
                titleColor="text-rose-400"
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
              />
            )}

            {/* In Progress */}
            {grouped.in_progress && grouped.in_progress.length > 0 && (
              <TaskSection
                title="In Progress"
                count={grouped.in_progress.length}
                tasks={grouped.in_progress}
                titleColor="text-blue-400"
                icon={<Clock className="w-4 h-4 text-blue-400" />}
              />
            )}

            {/* To Do */}
            {grouped.todo && grouped.todo.length > 0 && (
              <TaskSection
                title="To Do"
                count={grouped.todo.length}
                tasks={grouped.todo}
                titleColor="text-[var(--text-secondary)]"
                icon={<ListTodo className="w-4 h-4 text-[var(--text-muted)]" />}
              />
            )}

            {/* Completed */}
            {grouped.completed && grouped.completed.length > 0 && (
              <TaskSection
                title="Completed"
                count={grouped.completed.length}
                tasks={grouped.completed}
                titleColor="text-emerald-400"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                defaultCollapsed
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Section (grouped) ───────────────────────────────────────────────────
function TaskSection({
  title,
  count,
  tasks,
  titleColor,
  icon,
  defaultCollapsed = false,
}: {
  title: string;
  count: number;
  tasks: Task[];
  titleColor: string;
  icon: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        {icon}
        <h3 className={`font-semibold text-sm ${titleColor}`}>{title}</h3>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full px-2 py-0.5 font-medium">
          {count}
        </span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
          {collapsed ? "Show" : "Hide"}
        </span>
      </button>

      {/* Tasks */}
      {!collapsed && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}