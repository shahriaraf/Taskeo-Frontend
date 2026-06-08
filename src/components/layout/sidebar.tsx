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
  ChevronRight,
  Activity,
  Zap,
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

// ─── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[]; // which roles can see this item
}

const ALL_ROLES: UserRole[] = ["admin", "project_manager", "team_member"];

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ALL_ROLES,
  },
  {
    href: "/projects",
    icon: FolderKanban,
    label: "Projects",
    // TM can see projects they're a member of
    roles: ALL_ROLES,
  },
  {
    href: "/tasks",
    icon: CheckSquare,
    label: "Tasks",
    // TM sees only assigned tasks — still useful to show
    roles: ALL_ROLES,
  },
  {
    href: "/team",
    icon: Group,
    label: "Team",
    // Only Admin & PM manage team membership
    roles: ["admin", "project_manager"],
  },
  {
    href: "/members",
    icon: Users2,
    label: "Members",
    // Admin & PM see all members/workload
    roles: ["admin", "project_manager"],
  },
  {
    href: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    // TM only sees their own task stats — not useful enough to show
    roles: ["admin", "project_manager"],
  },
  {
    href: "/activity",
    icon: Activity,
    label: "Activity",
    // TM sees their own activity; Admin/PM see all
    roles: ALL_ROLES,
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    href: "/notifications",
    icon: Bell,
    label: "Notifications",
    roles: ALL_ROLES,
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ALL_ROLES,
  },
];

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  project_manager: {
    label: "Manager",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  team_member: {
    label: "Member",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const role = user?.role ?? "team_member";
  const roleStyle = ROLE_STYLES[role];

  // Filter items to only those the current role can access
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const visibleBottom = BOTTOM_ITEMS.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    router.push("/login");
    toast.success("Logged out");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] sidebar-transition overflow-hidden flex-shrink-0",
        sidebarOpen ? "w-56" : "w-[60px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0 shadow-lg">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap animate-fade-in">
            FlowBoard
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5">
          {visibleNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Tooltip key={item.href} label={!sidebarOpen ? item.label : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[var(--accent-blue)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    )}
                    style={{ width: 18, height: 18 }}
                  />
                  {sidebarOpen && (
                    <span className="whitespace-nowrap truncate animate-fade-in">
                      {item.label}
                    </span>
                  )}
                  {isActive && sidebarOpen && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] flex-shrink-0" />
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-[var(--border-subtle)]" />

        <div className="space-y-0.5">
          {visibleBottom.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href} label={!sidebarOpen ? item.label : ""}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <item.icon
                    style={{ width: 18, height: 18 }}
                    className="flex-shrink-0"
                  />
                  {sidebarOpen && (
                    <span className="whitespace-nowrap truncate animate-fade-in">
                      {item.label}
                    </span>
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* User + Role badge + Collapse */}
      <div className="border-t border-[var(--border-subtle)] p-2 flex-shrink-0">
        {user && (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2",
              sidebarOpen && "mb-1"
            )}
          >
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="sm"
              className="flex-shrink-0"
            />
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user.name}
                </p>
                {/* Role badge */}
                <span
                  className={cn(
                    "inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                    roleStyle.className
                  )}
                >
                  {roleStyle.label}
                </span>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log out"
              >
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        )}

        {/* Collapsed: show role dot */}
        {!sidebarOpen && user && (
          <Tooltip label={roleStyle.label}>
            <div className="flex justify-center mb-1">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  role === "admin"
                    ? "bg-rose-400"
                    : role === "project_manager"
                    ? "bg-amber-400"
                    : "bg-blue-400"
                )}
              />
            </div>
          </Tooltip>
        )}

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center rounded-[var(--radius-md)] py-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft style={{ width: 14, height: 14 }} />
          ) : (
            <ChevronRight style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </aside>
  );
}