"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/app-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}