import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";

export function usePermissions() {
  const { user } = useAuthStore();
  const role: UserRole = user?.role ?? "team_member";

  return {
    role,

    // ── Projects ────────────────────────────────────────────
    canCreateProject:   role === "admin" || role === "project_manager",
    canEditProject:     role === "admin" || role === "project_manager",
    canDeleteProject:   role === "admin" || role === "project_manager",

    // ── Tasks ───────────────────────────────────────────────
    canCreateTask:      role === "admin" || role === "project_manager",
    canEditTask:        role === "admin" || role === "project_manager",
    canDeleteTask:      role === "admin" || role === "project_manager",
    // Team members can only change status on their own tasks
    // (backend enforces the "own" part; frontend just shows the control)
    canChangeTaskStatus: true,

    // ── Team / Members ──────────────────────────────────────
    canManageMembers:   role === "admin" || role === "project_manager",

    // ── Comments ────────────────────────────────────────────
    // Anyone can comment; edit/delete own is handled per-comment
    canComment: true,

    // ── Bulk actions ────────────────────────────────────────
    canBulkEdit:        role === "admin" || role === "project_manager",
    canBulkDelete:      role === "admin" || role === "project_manager",
  };
}