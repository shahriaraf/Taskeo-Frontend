"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";
import type { Notification } from "@/types";
import toast from "react-hot-toast";

const typeIcon: Record<string, string> = {
  task_assigned: "🎯",
  task_updated: "✏️",
  task_completed: "✅",
  member_added: "👥",
  deadline_alert: "⏰",
  comment_added: "💬",
  project_updated: "📁",
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll({ limit: 50 }),
  });

  const notifications: Notification[] = (data?.data?.data as unknown as { notifications: Notification[] })?.notifications || [];
  const unreadCount = (data?.data?.data as unknown as { unreadCount: number })?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-count"] });
      toast.success("All notifications marked as read");
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} />

      <div className="flex-1 overflow-y-auto p-6">
        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="secondary" size="sm" onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
              <CheckCheck style={{ width: 13, height: 13 }} />
              Mark all as read
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-6 h-6" />}
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
          />
        ) : (
          <div className="space-y-2 max-w-2xl">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border transition-all duration-150 cursor-pointer animate-fade-in",
                  n.isRead
                    ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60"
                    : "bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--border-strong)]"
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-base flex-shrink-0">
                  {typeIcon[n.type] || "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{n.title}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
