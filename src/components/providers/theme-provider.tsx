// src/components/providers/theme-provider.tsx
"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
  }, [isDark]);

  return <>{children}</>;
}