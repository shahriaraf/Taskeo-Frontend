"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Activity,
  Users2,
  Group,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Avatar, Tooltip } from "@/components/ui";
import { authApi } from "@/services/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = ["admin", "project_manager", "team_member"];

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ALL_ROLES },
  { href: "/projects",  icon: FolderKanban,    label: "Projects",  roles: ALL_ROLES },
  { href: "/tasks",     icon: CheckSquare,      label: "Tasks",     roles: ALL_ROLES },
  { href: "/team",      icon: Group,            label: "Team",      roles: ["admin", "project_manager"] },
  { href: "/members",   icon: Users2,           label: "Members",   roles: ["admin", "project_manager"] },
  { href: "/analytics", icon: BarChart3,        label: "Analytics", roles: ["admin", "project_manager"] },
  { href: "/activity",  icon: Activity,         label: "Activity",  roles: ALL_ROLES },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/notifications", icon: Bell,     label: "Notifications", roles: ALL_ROLES },
  { href: "/settings",      icon: Settings, label: "Settings",      roles: ALL_ROLES },
];

const ROLE_STYLES: Record<UserRole, { label: string; className: string; dot: string }> = {
  admin:           { label: "Admin",   className: "bg-rose-500/10 text-rose-400 border-rose-500/20",   dot: "bg-rose-400"  },
  project_manager: { label: "Manager", className: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  team_member:     { label: "Member",  className: "bg-blue-500/10 text-blue-400 border-blue-500/20",   dot: "bg-blue-400"  },
};

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout }               = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const role          = user?.role ?? "team_member";
  const roleStyle     = ROLE_STYLES[role];
  const visibleNav    = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const visibleBottom = BOTTOM_ITEMS.filter((i) => i.roles.includes(role));

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    router.push("/login");
    toast.success("Logged out");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] sidebar-transition overflow-hidden flex-shrink-0",
        sidebarOpen ? "sidebar-open w-[168px]" : "sidebar-closed w-[76px]"
      )}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-[22px] h-14 border-b border-[var(--border-subtle)] flex-shrink-0 overflow-hidden">
        <svg
          style={{ width: 26, height: 26, flexShrink: 0 }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <polygon points="20,20 58,20 58,31 42,44 20,44" />
          <rect x="61" y="20" width="22" height="24" />
          <polygon points="61,44 83,44 83,82 61,82 61,57 42,44" />
        </svg>
        <span className="sidebar-label text-sm font-bold text-[var(--text-primary)]">
          Taskeo
        </span>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-7 px-[14px] overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Tooltip key={item.href} label={!sidebarOpen ? item.label : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-colors duration-150 group overflow-hidden",
                    isActive
                      ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <item.icon
                    style={{ width: 18, height: 18, flexShrink: 0 }}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-[var(--accent-blue)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    )}
                  />
                  <span className="sidebar-label flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="sidebar-label ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </div>

        <div className="my-4 h-px bg-[var(--border-subtle)]" />

        <div className="space-y-0.5">
          {visibleBottom.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href} label={!sidebarOpen ? item.label : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-colors duration-150 overflow-hidden",
                    isActive
                      ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <item.icon style={{ width: 19, height: 19, flexShrink: 0 }} />
                  <span className="sidebar-label truncate">{item.label}</span>
                </Link>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* ── User footer ──────────────────────────────────────────────────── */}
      <div className="border-t border-[var(--border-subtle)] p-2 flex-shrink-0">
        {user && (
          <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 mb-1 overflow-hidden">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" className="flex-shrink-0" />

            {/* Name + role badge — always in DOM, transitions with sidebar */}
            <div className="sidebar-label flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
              <span className={cn("inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border", roleStyle.className)}>
                {roleStyle.label}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="sidebar-label p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
              title="Log out"
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Role dot — cross-fades when collapsed */}
        <div
          className="flex justify-center mb-1 transition-opacity duration-150"
          style={{
            opacity: sidebarOpen ? 0 : 1,
            transitionDelay: sidebarOpen ? "0s" : "0.13s",
            pointerEvents: sidebarOpen ? "none" : "auto",
          }}
        >
          <Tooltip label={roleStyle.label}>
            <span className={cn("w-2 h-2 rounded-full block", roleStyle.dot)} />
          </Tooltip>
        </div>

        {/* Collapse toggle — chevron rotates */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center rounded-[var(--radius-md)] py-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          <ChevronLeft
            style={{ width: 14, height: 14 }}
            className={cn(
              "transition-transform duration-[280ms] ease-in-out",
              sidebarOpen ? "rotate-0" : "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}