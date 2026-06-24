"use client";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Shield, Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Header } from "@/components/layout/header";
import { Input, Label, Avatar } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi, usersApi } from "@/services/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await usersApi.update(user.id, { name });
      updateUser({ name: (res.data?.data as { name: string })?.name || name });
      toast.success("Profile updated!");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    router.push("/login");
    toast.success("Logged out");
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl space-y-5">
          {/* Profile card */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center gap-3 mb-1">
              <User style={{ width: 15, height: 15 }} className="text-[var(--accent-blue)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-5 ml-6">Manage your personal information</p>

            <div className="flex items-center gap-4 mb-6">
              <Avatar name={user.name} src={user.avatarUrl} size="xl" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                  {user.role.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled className="opacity-50 cursor-not-allowed" />
              </div>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>

          {/* Role card */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center gap-3 mb-1">
              <Shield style={{ width: 15, height: 15 }} className="text-[var(--accent-violet)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Permissions</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 ml-6">Your role and access level</p>
            <div className="ml-6 space-y-2">
              {[
                { label: "Role", value: user.role.replace(/_/g, " "), cap: true },
                { label: "Access Level", value: user.role === "admin" ? "Full system access" : user.role === "project_manager" ? "Create & manage projects" : "View & update assigned tasks" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                  <span className={`text-xs font-medium text-[var(--text-primary)] ${item.cap ? "capitalize" : ""}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-[var(--radius-lg)] bg-rose-500/5 border border-rose-500/15 p-6">
            <div className="flex items-center gap-3 mb-1">
              <LogOut style={{ width: 15, height: 15 }} className="text-rose-400" />
              <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 ml-6">Irreversible actions</p>
            <div className="ml-6">
              <Button variant="danger" onClick={handleLogout}>
                <LogOut style={{ width: 14, height: 14 }} />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
