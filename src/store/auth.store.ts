"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAuth: (user: AuthUser, token: string) => void;
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
        localStorage.setItem("access_token", token);
        localStorage.setItem("user_id", user.id);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("access_token");
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called once Zustand finishes reading from localStorage
        state?.setHasHydrated(true);
      },
    }
  )
);