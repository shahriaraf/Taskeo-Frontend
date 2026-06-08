import axios, { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — refresh token and retry
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
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userId = localStorage.getItem("user_id");
        const res = await apiClient.post("/auth/refresh", { userId });
        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem("access_token", newToken);
          originalRequest.headers!.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        window.location.href = "/login";
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const message =
        (error.response?.data as { error?: { message?: string }; message?: string })?.error
          ?.message ||
        (error.response?.data as { message?: string })?.message ||
        "Something went wrong";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
