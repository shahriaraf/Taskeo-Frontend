"use client";
import React, { useState } from "react";
import { Search, Bell, Plus, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/services/api";
import { useThemeStore } from "@/store/theme.store";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { isDark, toggleTheme } = useThemeStore();

  const { data: notifData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => notificationsApi.getAll({ limit: 1 }),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.data?.data?.unreadCount || 0;

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-4 px-6 flex-shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 h-8 w-56 focus-within:border-[var(--accent-blue)] transition-colors">
        <Search style={{ width: 13, height: 13 }} className="text-[var(--text-muted)] flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1 min-w-0"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {action && (
          <Button size="sm" onClick={action.onClick} className="gap-1.5">
            {action.icon || <Plus style={{ width: 14, height: 14 }} />}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        )}

        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)]
                     hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]
                     transition-colors"
        >
          {isDark ? (
            <Sun style={{ width: 16, height: 16 }} />
          ) : (
            <Moon style={{ width: 16, height: 16 }} />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Bell style={{ width: 16, height: 16 }} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent-blue)] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        {user && (
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2 rounded-[var(--radius-md)] p-1.5 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          </button>
        )}
      </div>
    </header>
  );
}
