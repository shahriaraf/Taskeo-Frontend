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
    canChangeTaskStatus: true,

    // ── Team / Members ──────────────────────────────────────
    canManageMembers:   role === "admin" || role === "project_manager",

    // ── Comments ────────────────────────────────────────────
    canComment: true,

    // ── Bulk actions ────────────────────────────────────────
    canBulkEdit:        role === "admin" || role === "project_manager",
    canBulkDelete:      role === "admin" || role === "project_manager",
  };
}