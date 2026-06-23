import axios, { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

// Always use the versioned API base URL.
// NEXT_PUBLIC_API_URL should be your backend root, e.g. https://api.taskeo.com
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_URL = `${API_BASE}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,       // Sends cookies (refresh_token HttpOnly cookie)
  headers: { "Content-Type": "application/json" },
  timeout: 15000,              // 15 second timeout — prevents hanging requests
});

// ── Request interceptor: attach access token from Zustand (in memory) ────────
// The access token lives in memory only (not localStorage) for XSS safety.
// See src/store/auth.store.ts for the rationale.
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 with token refresh ─────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };
    const url = originalRequest?.url || "";

    // Never try to refresh on auth endpoints themselves — prevents infinite loops.
    const isAuthCall =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/demo-login") ||
      url.includes("/auth/logout");

    // ── Handle token expiry (401) ────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      // If another refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userId =
          typeof window !== "undefined"
            ? localStorage.getItem("user_id")
            : null;

        if (!userId) {
          // No user ID means we were never logged in — redirect immediately
          clearAuthAndRedirect();
          return Promise.reject(error);
        }

        // The refresh token is sent automatically as an HttpOnly cookie
        // (withCredentials: true). We only need to pass userId in the body.
        const res = await apiClient.post("/auth/refresh", { userId });
        const newToken = res.data?.data?.accessToken;

        if (newToken) {
          // Update Zustand (in memory). NOT written to localStorage by design.
          useAuthStore.getState().setAccessToken(newToken);
          originalRequest.headers!.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }

        throw new Error("Refresh response did not contain an access token");
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Handle other errors with toast messages ──────────
    if (error.response?.status !== 401) {
      const data = error.response?.data as {
        error?: { message?: string };
        message?: string;
      };
      const message =
        data?.error?.message ||
        data?.message ||
        getDefaultErrorMessage(error.response?.status);

      // Don't show toast for network errors (server offline) — show a different message
      if (!error.response) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);

function getDefaultErrorMessage(status?: number): string {
  switch (status) {
    case 400: return "Invalid request. Please check your input.";
    case 403: return "You do not have permission to do that.";
    case 404: return "The requested resource was not found.";
    case 409: return "This record already exists.";
    case 422: return "The data provided is invalid.";
    case 429: return "Too many requests. Please slow down.";
    case 500: return "Server error. Please try again later.";
    default:  return "Something went wrong. Please try again.";
  }
}

function clearAuthAndRedirect() {
  // logout() clears the store + removes user_id from localStorage
  useAuthStore.getState().logout();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export default apiClient;