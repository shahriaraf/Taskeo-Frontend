export type UserRole = "admin" | "project_manager" | "team_member";
export type ProjectStatus = "active" | "completed" | "on_hold";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type ProjectMemberRole = "owner" | "manager" | "member";
export type NotificationType =
  | "task_assigned"
  | "task_updated"
  | "task_completed"
  | "member_added"
  | "deadline_alert"
  | "comment_added"
  | "project_updated";

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
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">;
  workload?: { total: number; completed: number; pending: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  members: ProjectMember[];
  tasks?: Task[];
  isOverdue: boolean;
  daysUntilDeadline: number;
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
  project: Pick<Project, "id" | "name">;
  assignee?: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  creator: Pick<User, "id" | "name">;
  isOverdue: boolean;
  _count: { comments: number; attachments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DashboardKPIs {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  projectSummaries: Array<{
    id: string;
    name: string;
    status: ProjectStatus;
    completionPercentage: number;
    pendingTasks: number;
    deadline: string;
    isOverdue: boolean;
    daysUntilDeadline: number;
    _count: { tasks: number; members: number };
  }>;
  memberWorkload: Array<{
    userId: string;
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  }>;
}

export interface Attachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  filename: string;
  url: string;
  publicId?: string | null;
  size?: number | null;
  mimeType?: string | null;
  createdAt: string;
  uploader: { id: string; name: string };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}