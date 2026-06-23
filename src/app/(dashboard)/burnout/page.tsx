"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { AlertTriangle, Flame, Moon, Clock, TrendingUp, CheckCircle2, RefreshCw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BurnoutSignal {
  userId: string;
  userName: string;
  avatarUrl?: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  signals: {
    overdueTaskCount: number;
    deadlinePushCount: number;
    lateNightActivityDays: number;
    taskAccumulationRate: number;
    consecutiveOverdueDays: number;
  };
  recommendation: string;
}

// ── Risk config ───────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  critical: { label: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  high:     { label: "High",     color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  medium:   { label: "Medium",   color: "#4f8ef7", bg: "rgba(79,142,247,0.12)",  border: "rgba(79,142,247,0.3)"  },
  low:      { label: "Healthy",  color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, src }: { name: string; src?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center text-xs font-bold text-[var(--accent-blue)] flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, level }: { score: number; level: string }) {
  const cfg = RISK_CONFIG[level as keyof typeof RISK_CONFIG];
  const r = 24, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={cfg.color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold"
        style={{ color: cfg.color }}>
        {score}
      </span>
    </div>
  );
}

// ── Signal pill ───────────────────────────────────────────────────────────────
function SignalPill({ icon: Icon, label, value, warn }: { icon: React.ElementType; label: string; value: number; warn: boolean }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
      warn ? "bg-[rgba(248,113,113,0.10)] text-[#f87171]" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]")}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{label}: <strong>{value}</strong></span>
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({ signal }: { signal: BurnoutSignal }) {
  const cfg = RISK_CONFIG[signal.riskLevel];
  return (
    <div className="rounded-xl p-4 border" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={signal.userName} src={signal.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text-primary)] truncate">{signal.userName}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: cfg.border, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{signal.recommendation}</p>
        </div>
        <ScoreRing score={signal.riskScore} level={signal.riskLevel} />
      </div>

      <div className="flex flex-wrap gap-2">
        <SignalPill icon={AlertTriangle} label="Overdue" value={signal.signals.overdueTaskCount} warn={signal.signals.overdueTaskCount >= 3} />
        <SignalPill icon={Moon} label="Late nights" value={signal.signals.lateNightActivityDays} warn={signal.signals.lateNightActivityDays >= 3} />
        <SignalPill icon={TrendingUp} label="Accumulating" value={signal.signals.taskAccumulationRate} warn={signal.signals.taskAccumulationRate >= 3} />
        <SignalPill icon={Clock} label="Deadline pushes" value={signal.signals.deadlinePushCount} warn={signal.signals.deadlinePushCount >= 2} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BurnoutPage() {
  const { data, isLoading, refetch, isFetching } = useQuery<BurnoutSignal[]>({
    queryKey: ["burnout-team"],
    queryFn: async () => {
      const res = await apiClient.get("/burnout/team");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const critical = data?.filter((s) => s.riskLevel === "critical") ?? [];
  const high     = data?.filter((s) => s.riskLevel === "high") ?? [];
  const medium   = data?.filter((s) => s.riskLevel === "medium") ?? [];
  const low      = data?.filter((s) => s.riskLevel === "low") ?? [];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Burnout early warning"
        subtitle="Real-time workload health based on task patterns and activity"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Top stat bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Critical risk", count: critical.length, color: "#f87171" },
            { label: "High risk",     count: high.length,     color: "#fbbf24" },
            { label: "Medium risk",   count: medium.length,   color: "#4f8ef7" },
            { label: "Healthy",       count: low.length,      color: "#34d399" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Refresh + note */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Scores are calculated from overdue tasks, late-night activity, and deadline patterns. No blame — just data.
          </p>
          <button onClick={() => refetch()}
            className={cn("flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors",
              isFetching && "opacity-50 pointer-events-none")}>
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {critical.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-[#f87171]" />
                  <h2 className="text-sm font-semibold text-[#f87171]">Critical risk — act now</h2>
                </div>
                <div className="space-y-3">{critical.map((s) => <MemberCard key={s.userId} signal={s} />)}</div>
              </section>
            )}
            {high.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
                  <h2 className="text-sm font-semibold text-[#fbbf24]">High risk — check in soon</h2>
                </div>
                <div className="space-y-3">{high.map((s) => <MemberCard key={s.userId} signal={s} />)}</div>
              </section>
            )}
            {medium.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Medium risk — monitor</h2>
                <div className="space-y-3">{medium.map((s) => <MemberCard key={s.userId} signal={s} />)}</div>
              </section>
            )}
            {low.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                  <h2 className="text-sm font-semibold text-[var(--text-muted)]">Healthy</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {low.map((s) => <MemberCard key={s.userId} signal={s} />)}
                </div>
              </section>
            )}
            {data?.length === 0 && (
              <div className="text-center py-20 text-[var(--text-muted)] text-sm">
                No team members found. Add members to projects to see burnout analysis.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
