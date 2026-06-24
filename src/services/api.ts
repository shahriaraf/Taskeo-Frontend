// src/services/api.ts  (Phase 1 additions — append/replace the relevant sections)
// Add these exports to your existing api.ts file.
// The sections marked NEW are the only additions.

import apiClient from "@/lib/api-client";
import type {
  ApiResponse, LoginResponse, User, Project, Task,
  Comment, Attachment, Notification, ActivityLog, DashboardData,
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

  // ── NEW ──────────────────────────────────────────────────────────────────────
  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<ApiResponse<{ message: string }>>("/auth/reset-password", { token, password }),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Project[]>>("/projects", { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Project>>(`/projects/${id}`),

  create: (data: { name: string; description?: string; deadline: string; status?: string }) =>
    apiClient.post<ApiResponse<Project>>("/projects", data),

  update: (id: string, data: Partial<{ name: string; description: string; deadline: string; status: string }>) =>
    apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data),

  remove: (id: string) => apiClient.delete(`/projects/${id}`),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<{
      totalTasks: number; completedTasks: number; pendingTasks: number;
      overdueTasks: number; completionPercentage: number;
    }>>(`/projects/${id}/stats`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Task[]>>("/tasks", { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (data: {
    title: string; description?: string; projectId: string;
    assigneeId?: string; dueDate: string; priority?: string; status?: string;
  }) => apiClient.post<ApiResponse<Task>>("/tasks", data),

  update: (id: string, data: Partial<{
    title: string; description: string; assigneeId: string;
    dueDate: string; priority: string; status: string;
  }>) => apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data),

  updateTaskStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status }),

  remove: (id: string) => apiClient.delete(`/tasks/${id}`),

  // ── NEW: Sub-tasks ──────────────────────────────────────────────────────────
  getSubTasks: (parentTaskId: string) =>
    apiClient.get<ApiResponse<Task[]>>(`/tasks/${parentTaskId}/subtasks`),

  createSubTask: (
    parentTaskId: string,
    data: { title: string; description?: string; assigneeId?: string; dueDate: string; priority?: string }
  ) => apiClient.post<ApiResponse<Task>>(`/tasks/${parentTaskId}/subtasks`, data),

  updateSubTask: (
    parentTaskId: string,
    subTaskId: string,
    data: Partial<{ title: string; description: string; assigneeId: string; dueDate: string; priority: string; status: string }>
  ) => apiClient.patch<ApiResponse<Task>>(`/tasks/${parentTaskId}/subtasks/${subTaskId}`, data),

  updateSubTaskStatus: (subTaskId: string, status: string) =>
    // Sub-task status uses the same PATCH /tasks/:id/status endpoint
    apiClient.patch<ApiResponse<Task>>(`/tasks/${subTaskId}/status`, { status }),

  deleteSubTask: (parentTaskId: string, subTaskId: string) =>
    apiClient.delete(`/tasks/${parentTaskId}/subtasks/${subTaskId}`),

  reorderSubTasks: (parentTaskId: string, ids: string[]) =>
    apiClient.patch(`/tasks/${parentTaskId}/subtasks/reorder`, { ids }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  getByTask: (taskId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Comment[]>>(`/comments/task/${taskId}`, { params }),

  create: (data: { taskId: string; content: string }) =>
    apiClient.post<ApiResponse<Comment>>("/comments", data),

  update: (id: string, content: string) =>
    apiClient.patch<ApiResponse<Comment>>(`/comments/${id}`, { content }),

  remove: (id: string) => apiClient.delete(`/comments/${id}`),
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<ApiResponse<Notification[]>>("/notifications", { params }),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch("/notifications/read-all"),

  remove: (id: string) => apiClient.delete(`/notifications/${id}`),
};

// ─── Activity Logs ─────────────────────────────────────────────────────────────
export const activityApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<ActivityLog[]>>("/activity-logs", { params }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardData>>("/analytics/dashboard"),

  getTasksByPriority: () =>
    apiClient.get<ApiResponse<{ priority: string; count: number }[]>>(
      "/analytics/tasks-by-priority"
    ),

  getStatusDistribution: () =>
    apiClient.get<ApiResponse<{ status: string; count: number }[]>>(
      "/analytics/status-distribution"
    ),

  getProgressTrend: (params?: { weeks?: number }) =>
    apiClient.get<ApiResponse<{ week: string; created: number; completed: number }[]>>(
      "/analytics/progress-trend",
      { params }
    ),

  getMemberWorkload: () =>
    apiClient.get<ApiResponse<{
      user: { id: string; name: string; avatarUrl?: string };
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
    }[]>>("/analytics/member-workload"),
};

// ─── Team ─────────────────────────────────────────────────────────────────────
export const teamApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<User[]>>("/team", { params }),
};

// ─── Attachments ─────────────────────────────────────────────────────────────
export const attachmentsApi = {
  upload: (taskId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<ApiResponse<Attachment>>(`/attachments/${taskId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (id: string) => apiClient.delete(`/attachments/${id}`),
};

// ─── NEW: Global Search ───────────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, limit = 5) =>
    apiClient.get<ApiResponse<{
      tasks: any[];
      projects: any[];
      total: number;
    }>>("/search", { params: { q, limit } }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<{ users: User[] }>>("/users", { params }),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<{
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      completionPercentage: number;
    }>>(`/users/${id}/stats`),
};
