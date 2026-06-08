"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "amber" | "rose" | "violet";
  trend?: { value: number; label: string };
  loading?: boolean;
  suffix?: string;
}

const colorMap = {
  blue: {
    icon: "text-blue-400 bg-blue-500/10",
    glow: "shadow-blue-500/5",
    bar: "bg-blue-500",
    border: "border-blue-500/10",
  },
  emerald: {
    icon: "text-emerald-400 bg-emerald-500/10",
    glow: "shadow-emerald-500/5",
    bar: "bg-emerald-500",
    border: "border-emerald-500/10",
  },
  amber: {
    icon: "text-amber-400 bg-amber-500/10",
    glow: "shadow-amber-500/5",
    bar: "bg-amber-500",
    border: "border-amber-500/10",
  },
  rose: {
    icon: "text-rose-400 bg-rose-500/10",
    glow: "shadow-rose-500/5",
    bar: "bg-rose-500",
    border: "border-rose-500/10",
  },
  violet: {
    icon: "text-violet-400 bg-violet-500/10",
    glow: "shadow-violet-500/5",
    bar: "bg-violet-500",
    border: "border-violet-500/10",
  },
};

export function KPICard({ title, value, icon, color, trend, loading, suffix }: KPICardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group",
        c.glow
      )}
    >
      {/* Subtle top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", c.bar, "opacity-60")} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
        <div className={cn("w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center", c.icon)}>
          {icon}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {suffix && <span className="text-sm text-[var(--text-muted)] mb-0.5">{suffix}</span>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend.value >= 0 ? (
            <TrendingUp style={{ width: 12, height: 12 }} className="text-emerald-400" />
          ) : (
            <TrendingDown style={{ width: 12, height: 12 }} className="text-rose-400" />
          )}
          <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-[var(--text-muted)]">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
