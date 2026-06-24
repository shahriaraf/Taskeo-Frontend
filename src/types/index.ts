// src/types/index.ts  (Phase 1 additions — add these to your existing types file)
// Only the NEW types are shown here. Keep everything else in your existing file.

// ── Add these to the existing Task interface ─────────────────────────────────
// (These are NEW fields added to the Task type)
//
//   parentId?: string;
//   subTasks?: SubTask[];        // preview list (up to 3, non-completed only)
//   _count: { comments: number; attachments: number; subTasks: number; };
//                                                              ^^^^^^^^^^^^ NEW

// ── NEW type ─────────────────────────────────────────────────────────────────
export interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: Pick<User, "id" | "name" | "avatarUrl">;
  dueDate: string;
  projectId: string;
  parentId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count: { comments: number };
}

// ── Re-export all existing types ─────────────────────────────────────────────
// (Keep this in sync with whatever you already export from this file)

export type UserRole = "admin" | "project_manager" | "team_member";
export type ProjectStatus = "active" | "completed" | "on_hold";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type ProjectMemberRole = "owner" | "manager" | "member";
export type NotificationType =
  | "task_assigned" | "task_updated" | "task_completed"
  | "member_added" | "deadline_alert" | "comment_added" | "project_updated";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: { assignedTasks: number; ownedProjects: number; comments?: number };
}

export interface ProjectMember {
  id: string; projectId: string; userId: string;
  role: ProjectMemberRole; joinedAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">;
  workload?: { total: number; completed: number; pending: number };
}

export interface Project {
  id: string; name: string; description?: string;
  deadline: string; status: ProjectStatus; ownerId: string;
  createdAt: string; updatedAt: string;
  owner: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  members: ProjectMember[]; tasks?: Task[];
  isOverdue: boolean; daysUntilDeadline: number;
  _count: { tasks: number; members: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;              // NEW — null for top-level tasks
  order?: number;                 // NEW — for ordering within parent
  project: Pick<Project, "id" | "name">;
  assignee?: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  creator: Pick<User, "id" | "name">;
  subTasks?: SubTask[];           // NEW — preview list
  isOverdue: boolean;
  _count: { comments: number; attachments: number; subTasks: number };  // subTasks NEW
}

export interface Comment {
  id: string; taskId: string; userId: string;
  content: string; createdAt: string; updatedAt: string;
  user: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface Attachment {
  id: string; taskId: string; uploadedBy: string;
  filename: string; url: string; size?: number; mimeType?: string; createdAt: string;
  uploader: Pick<User, "id" | "name">;
}

export interface Notification {
  id: string; userId: string; title: string; message: string;
  type: NotificationType; isRead: boolean;
  entityType?: string; entityId?: string; createdAt: string;
}

export interface ActivityLog {
  id: string; userId?: string; action: string;
  entityType?: string; entityId?: string; metadata?: Record<string, any>;
  createdAt: string; user?: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface DashboardData {
  kpis: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  };

  projectSummaries: Array<{
    id: string;
    name: string;
    status: string;
    deadline: string;
    daysUntilDeadline: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionPercent: number;  // ← note: backend uses "completionPercent"
    isOverdue: boolean;
  }>;

  memberWorkload: Array<{
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface LoginResponse {
  user: User; accessToken: string;
}

export type AuthUser = User;
