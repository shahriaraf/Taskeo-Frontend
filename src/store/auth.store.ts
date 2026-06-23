"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";

/**
 * Auth store improvements:
 *
 * 1. Access token is stored in MEMORY (Zustand state) only — not in localStorage.
 *    This reduces XSS risk. The access token cannot be stolen by injected scripts.
 *
 * 2. Only non-sensitive data (user profile, isAuthenticated flag) is persisted
 *    to localStorage so the UI can restore the session on page reload.
 *
 * 3. The access token is kept in memory and refreshed on page load via the
 *    /auth/refresh endpoint (which uses the HttpOnly cookie).
 *
 * 4. user_id is still stored in localStorage because it is not sensitive —
 *    it is a public identifier needed to call /auth/refresh on page load.
 */

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;       // In memory only — not persisted to localStorage
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;  // Update token without touching user
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setAuth: (user, token) => {
        // Store user ID in localStorage for refresh-on-reload.
        // Access token stays in memory only.
        localStorage.setItem("user_id", user.id);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      logout: () => {
        localStorage.removeItem("user_id");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      // Only persist the user profile and auth flag to localStorage.
      // The access token is NOT persisted — it lives in memory only.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // accessToken intentionally excluded
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Note: after rehydration, accessToken will be null in memory.
        // The app should call /auth/refresh on startup if isAuthenticated is true.
        // See providers.tsx for the token restore logic.
      },
    },
  ),
);
