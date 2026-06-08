"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, BarChart2 } from "lucide-react";
import { usersApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { Input, Skeleton, EmptyState, Avatar, Progress, Badge } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { User } from "@/types";

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch],          // ← use debouncedSearch
    queryFn: () => usersApi.getAll({ search: debouncedSearch, limit: 50 }),
  });

  const users: User[] = (data?.data?.data as unknown as { users: User[] })?.users || [];

  const roleOrder = ["admin", "project_manager", "team_member"];
  const sorted = [...users].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  );

  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Team"
        subtitle={`${users.length} members`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="max-w-sm">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search style={{ width: 13, height: 13 }} />}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={<Users className="w-6 h-6" />} title="No members found" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((user, i) => (
              <MemberCard key={user.id} user={user} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ user, index }: { user: User; index: number }) {
  const { data: statsData } = useQuery({
    queryKey: ["user-stats", user.id],
    queryFn: () => usersApi.getStats(user.id),
  });

  const stats = statsData?.data?.data;
  const pct = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const roleBadge: Record<string, { label: string; className: string }> = {
    admin: { label: "Admin", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    project_manager: { label: "PM", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    team_member: { label: "Member", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  };

  const badge = roleBadge[user.role] || roleBadge.team_member;

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 hover:border-[var(--border-default)] transition-all duration-200 hover:shadow-md animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
          <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${user.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
      </div>

      {stats && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-muted)]">Task completion</span>
              <span className="font-semibold text-[var(--text-primary)]">{pct}%</span>
            </div>
            <Progress value={pct} color={pct >= 75 ? "emerald" : pct >= 40 ? "blue" : "amber"} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "Total", value: stats.total, color: "text-[var(--text-primary)]" },
              { label: "Done", value: stats.completed, color: "text-emerald-400" },
              { label: "Overdue", value: stats.overdue, color: "text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]">
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
