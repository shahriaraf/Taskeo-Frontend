"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { projectsApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import {
  FileText, ChevronRight, CheckCircle2, Clock, Users,
  TrendingUp, AlertTriangle, Lightbulb, Star, BarChart2, ArrowLeft,
} from "lucide-react";
import type { Project } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PostMortemReport {
  project: { id: string; name: string; description?: string; status: string; deadline: string; createdAt: string; owner: { id: string; name: string } };
  summary: { totalTasks: number; completedTasks: number; incompleteTasks: number; completionRate: number; totalMembers: number; plannedDeadline: string; wasOnTime: boolean; daysOverdue: number };
  taskBreakdown: {
    byPriority: { high: number; medium: number; low: number };
    byStatus: { completed: number; in_progress: number; todo: number };
    overdueTasks: { id: string; title: string; assignee?: string; dueDate: string; daysOverdue: number }[];
    unassignedTasks: { id: string; title: string; status: string }[];
  };
  memberContributions: { userId: string; name: string; avatarUrl?: string; assigned: number; completed: number; completionRate: number; tasksOverdue: number }[];
  timeline: { action: string; actor: string; entityType: string; timestamp: string; note: string }[];
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = "sm" }: { name: string; src?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className={cn(sz, "rounded-full object-cover flex-shrink-0")} />;
  return (
    <div className={cn(sz, "rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center font-bold text-[var(--accent-blue)] flex-shrink-0")}>
      {initials}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Report view ───────────────────────────────────────────────────────────────
function ReportView({ report, onBack }: { report: PostMortemReport; onBack: () => void }) {
  const cr = report.summary.completionRate;
  const crColor = cr >= 80 ? "#34d399" : cr >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </button>

      {/* Project header */}
      <div className="rounded-xl p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{report.project.name}</h2>
            {report.project.description && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{report.project.description}</p>
            )}
          </div>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0",
            report.summary.wasOnTime ? "bg-[rgba(52,211,153,0.12)] text-[#34d399]" : "bg-[rgba(248,113,113,0.12)] text-[#f87171]")}>
            {report.summary.wasOnTime ? "On time" : `${report.summary.daysOverdue}d overdue`}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Generated {new Date(report.generatedAt).toLocaleString()} · Owner: {report.project.owner.name}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Completion rate" value={`${cr}%`} sub={`${report.summary.completedTasks} of ${report.summary.totalTasks} tasks`} color={crColor} />
        <StatCard label="Total tasks" value={report.summary.totalTasks} />
        <StatCard label="Team size" value={report.summary.totalMembers} sub="members" />
        <StatCard label="Overdue tasks" value={report.taskBreakdown.overdueTasks.length}
          color={report.taskBreakdown.overdueTasks.length > 0 ? "#f87171" : "#34d399"} />
      </div>

      {/* Progress bar */}
      <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Overall completion</span>
          <span className="text-sm font-bold" style={{ color: crColor }}>{cr}%</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${cr}%`, background: crColor }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[var(--text-muted)]">
          <span className="text-[#34d399]">■ Completed: {report.taskBreakdown.byStatus.completed}</span>
          <span className="text-[#4f8ef7]">■ In progress: {report.taskBreakdown.byStatus.in_progress}</span>
          <span className="text-[var(--text-muted)]">■ Todo: {report.taskBreakdown.byStatus.todo}</span>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[var(--accent-amber)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Key insights</h3>
        </div>
        <ul className="space-y-2">
          {report.insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent-amber)] mt-0.5 flex-shrink-0">·</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-[rgba(79,142,247,0.06)] rounded-xl p-4 border border-[rgba(79,142,247,0.2)]">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[var(--accent-blue)]" />
          <h3 className="font-semibold text-[var(--accent-blue)]">Recommendations for next project</h3>
        </div>
        <ul className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent-blue)] font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Member contributions */}
      <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Member contributions</h3>
        </div>
        <div className="space-y-3">
          {report.memberContributions.sort((a, b) => b.assigned - a.assigned).map((m) => {
            const mc = m.completionRate >= 80 ? "#34d399" : m.completionRate >= 50 ? "#fbbf24" : "#f87171";
            return (
              <div key={m.userId} className="flex items-center gap-3">
                <Avatar name={m.name} src={m.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">{m.name}</span>
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: mc }}>{m.completionRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.completionRate}%`, background: mc }} />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {m.completed}/{m.assigned} tasks · {m.tasksOverdue > 0 ? `${m.tasksOverdue} overdue` : "no overdue"}
                  </p>
                </div>
              </div>
            );
          })}
          {report.memberContributions.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No members found.</p>
          )}
        </div>
      </div>

      {/* Overdue tasks */}
      {report.taskBreakdown.overdueTasks.length > 0 && (
        <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Missed deadlines</h3>
          </div>
          <div className="space-y-2">
            {report.taskBreakdown.overdueTasks.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-sm text-[var(--text-secondary)] truncate">{t.title}</span>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-[var(--text-muted)]">
                  {t.assignee && <span>{t.assignee}</span>}
                  <span className="text-[#f87171]">{t.daysOverdue}d late</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {report.timeline.length > 0 && (
        <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Project timeline</h3>
          </div>
          <div className="relative pl-5 space-y-3">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-[var(--border-subtle)]" />
            {report.timeline.slice(0, 20).map((e, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)]" />
                <p className="text-sm text-[var(--text-secondary)]">{e.note}</p>
                <p className="text-xs text-[var(--text-muted)]">{e.actor} · {new Date(e.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project picker ────────────────────────────────────────────────────────────
function ProjectPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["projects-all"],
    queryFn: () => projectsApi.getAll({ limit: 50 }).then((r) => r.data),
  });

  const projects = (data as any)?.data ?? data ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        Choose a project to generate a blame-free retrospective report.
      </p>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-[var(--bg-surface)] animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {projects.map((p: Project) => (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all text-left group">
              <FileText className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {p._count?.tasks ?? 0} tasks · Deadline {new Date(p.deadline).toLocaleDateString()}
                  {" · "}<span className={cn(p.status === "completed" ? "text-[#34d399]" : p.status === "on_hold" ? "text-[#fbbf24]" : "text-[var(--accent-blue)]")}>{p.status}</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] flex-shrink-0" />
            </button>
          ))}
          {projects.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-10">No projects found.</p>}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PostMortemPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: report, isLoading } = useQuery<PostMortemReport>({
    queryKey: ["postmortem", selectedProjectId],
    queryFn: async () => {
      const res = await apiClient.get(`/postmortem/${selectedProjectId}`);
      return res.data;
    },
    enabled: !!selectedProjectId,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Post-mortem report"
        subtitle="Auto-generated, blame-free retrospective for any project"
      />
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedProjectId ? (
          <ProjectPicker onSelect={setSelectedProjectId} />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
            ))}
          </div>
        ) : report ? (
          <ReportView report={report} onBack={() => setSelectedProjectId(null)} />
        ) : null}
      </div>
    </div>
  );
}
