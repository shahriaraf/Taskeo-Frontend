import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  LoginResponse,
  User,
  Project,
  Task,
  Comment,
  Attachment,
  Notification,
  ActivityLog,
  DashboardData,
} from "@/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/signup", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/login", data),

  demoLogin: () =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/demo-login"),

  logout: () => apiClient.post("/auth/logout"),

  me: () => apiClient.get<ApiResponse<User>>("/auth/me"),

  refresh: (userId: string) =>
    apiClient.post<ApiResponse<{ accessToken: string }>>("/auth/refresh", { userId }),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Project[]>>("/projects", { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Project>>(`/projects/${id}`),

  create: (data: {
    name: string;
    description?: string;
    deadline: string;
    status?: string;
  }) => apiClient.post<ApiResponse<Project>>("/projects", data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      deadline: string;
      status: string;
    }>
  ) => apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data),

  remove: (id: string) => apiClient.delete(`/projects/${id}`),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<{
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      overdueTasks: number;
      completionPercentage: number;
    }>>(`/projects/${id}/stats`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Task[]>>("/tasks", { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (data: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string;
    dueDate: string;
    priority: string;
    status?: string;
  }) => apiClient.post<ApiResponse<Task>>("/tasks", data),

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      assigneeId: string;
      dueDate: string;
      priority: string;
      status: string;
    }>
  ) => apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status }),

  remove: (id: string) => apiClient.delete(`/tasks/${id}`),
};

// ─── Team ─────────────────────────────────────────────────────────────────────
export const teamApi = {
  addMember: (data: { projectId: string; userId: string; role?: string }) =>
    apiClient.post("/team/members", data),

  getMembers: (projectId: string) =>
    apiClient.get<ApiResponse<unknown[]>>(`/team/project/${projectId}/members`),

  getWorkload: (projectId: string) =>
    apiClient.get<ApiResponse<unknown[]>>(`/team/project/${projectId}/workload`),

  updateRole: (projectId: string, userId: string, role: string) =>
    apiClient.patch(`/team/project/${projectId}/members/${userId}/role`, { role }),

  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/team/project/${projectId}/members/${userId}`),

  searchUsers: (q: string) =>
    apiClient.get<ApiResponse<User[]>>("/team/users/search", { params: { q } }),

  getMemberTasks: (memberId: string, params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Task[]>>("/tasks", {
      params: { assigneeId: memberId, ...params }
    }),

  getMemberById: (memberId: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${memberId}`),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<{ users: User[]; total: number }>>("/users", { params }),

  getOne: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}`, data),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<{ total: number; completed: number; inProgress: number; todo: number; overdue: number }>>(`/users/${id}/stats`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ notifications: Notification[]; total: number; unreadCount: number }>>("/notifications", { params }),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch("/notifications/read-all"),
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ logs: ActivityLog[]; total: number }>>(
      "/activity-logs",
      { params }
    ),

  getByEntity: (entityType: string, entityId: string) =>
    apiClient.get<ApiResponse<ActivityLog[]>>(
      `/activity-logs/entity/${entityType}/${entityId}`
    ),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardData>>("/analytics/dashboard"),

  getKPIs: () =>
    apiClient.get<ApiResponse<DashboardData["kpis"]>>("/analytics/kpis"),

  getTasksByPriority: () =>
    apiClient.get<ApiResponse<{ priority: string; count: number }[]>>(
      "/analytics/tasks-by-priority"
    ),

  getStatusDistribution: () =>
    apiClient.get<ApiResponse<{ status: string; count: number }[]>>(
      "/analytics/task-status-distribution"
    ),

  getMemberWorkload: () =>
    apiClient.get<ApiResponse<{
      user: { id: string; name: string; avatarUrl?: string };
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
    }[]>>("/analytics/member-workload"),

  getUpcomingDeadlines: () =>
    apiClient.get<ApiResponse<Task[]>>("/analytics/upcoming-deadlines"),

  getHighPriorityTasks: () =>
    apiClient.get<ApiResponse<Task[]>>("/analytics/high-priority-tasks"),

  getProjectProgress: () =>
    apiClient.get<ApiResponse<unknown[]>>("/analytics/project-progress"),

  getProgressTrend: () =>
    apiClient.get<ApiResponse<{ week: string; created: number; completed: number }[]>>(
      "/analytics/progress-trend"
    ),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  getByTask: (taskId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ comments: Comment[]; total: number }>>(`/comments/task/${taskId}`, { params }),

  create: (data: { taskId: string; content: string }) =>
    apiClient.post<ApiResponse<Comment>>("/comments", data),

  update: (id: string, content: string) =>
    apiClient.patch<ApiResponse<Comment>>(`/comments/${id}`, { content }),

  remove: (id: string) => apiClient.delete(`/comments/${id}`),
};

// ─── Attachments ──────────────────────────────────────────────────────────────
export const attachmentsApi = {
  getByTask: (taskId: string) =>
    apiClient.get<ApiResponse<Attachment[]>>(`/attachments/task/${taskId}`),

  upload: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", taskId);
    return apiClient.post<ApiResponse<Attachment>>("/attachments/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  remove: (id: string) =>
    apiClient.delete(`/attachments/${id}`),
};