"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { activityApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { Skeleton, EmptyState, Avatar } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

const actionEmoji: Record<string, string> = {
  PROJECT_CREATED: "📁",
  PROJECT_UPDATED: "✏️",
  PROJECT_DELETED: "🗑️",
  TASK_CREATED: "✅",
  TASK_UPDATED: "✏️",
  TASK_ASSIGNED: "🎯",
  TASK_STATUS_CHANGED: "🔄",
  TASK_DELETED: "🗑️",
  MEMBER_ADDED: "👥",
  MEMBER_REMOVED: "👤",
  COMMENT_ADDED: "💬",
  COMMENT_DELETED: "🗑️",
};

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs-full"],
    queryFn: () => activityApi.getAll({ limit: 50 }),
  });

  type LogEntry = {
    id: string;
    action: string;
    metadata?: Record<string, string>;
    createdAt: string;
    user?: { id: string; name: string; avatarUrl?: string };
  };
  const logs: LogEntry[] = (data?.data?.data as unknown as { logs: LogEntry[] })?.logs || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Activity Log" subtitle="Recent system activity" />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3 max-w-2xl">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title="No activity yet"
            description="System activity will appear here as your team works."
          />
        ) : (
          <div className="max-w-2xl relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />

            <div className="space-y-1">
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 pl-1 animate-fade-in"
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-sm flex-shrink-0">
                    {actionEmoji[log.action] || "📌"}
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2">
                        {log.user && (
                          <Avatar name={log.user.name} src={log.user.avatarUrl} size="sm" />
                        )}
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {log.user?.name || "System"}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed ml-9">
                      <span className="capitalize">{log.action.replace(/_/g, " ").toLowerCase()}</span>
                      {log.metadata?.projectName && (
                        <> in <span className="text-[var(--accent-blue)] font-medium">"{log.metadata.projectName}"</span></>
                      )}
                      {log.metadata?.taskTitle && (
                        <>: <span className="text-[var(--text-primary)] font-medium">"{log.metadata.taskTitle}"</span></>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
