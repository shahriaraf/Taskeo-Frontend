"use client";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/lib/api-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,       // 30 seconds before data is considered stale
      retry: 1,                    // Retry once on failure
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
    },
  },
});

/**
 * TokenRestorer — runs once on app startup.
 *
 * Since we no longer store the access token in localStorage (to reduce XSS risk),
 * we need to restore it from the server on page load using the HttpOnly refresh
 * token cookie. This component handles that silently in the background.
 *
 * Flow:
 * 1. Page loads — user is marked as isAuthenticated in localStorage (from last session).
 * 2. accessToken is null in memory (it was never persisted).
 * 3. This component calls /auth/refresh using the HttpOnly cookie.
 * 4. The new access token is stored in memory via setAccessToken.
 * 5. If refresh fails (cookie expired), the user is logged out.
 */
function TokenRestorer() {
  const { isAuthenticated, accessToken, setAccessToken, logout, _hasHydrated } =
    useAuthStore();

  useEffect(() => {
    // Wait for Zustand to finish reading from localStorage
    if (!_hasHydrated) return;

    // Only attempt restore if user was authenticated but has no token in memory
    if (isAuthenticated && !accessToken) {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        logout();
        return;
      }

      apiClient
        .post("/auth/refresh", { userId })
        .then((res) => {
          const newToken = res.data?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
          } else {
            logout();
          }
        })
        .catch(() => {
          // Refresh token expired or invalid — log the user out
          logout();
        });
    }
  }, [_hasHydrated, isAuthenticated, accessToken, setAccessToken, logout]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TokenRestorer />
      {children}
    </QueryClientProvider>
  );
}
