"use client";
import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, X, Check } from "lucide-react";
import { teamApi } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, Label, Select } from "@/components/ui";
import type { User, ProjectMember, ProjectMemberRole } from "@/types";
import toast from "react-hot-toast";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  existingMembers: ProjectMember[];
}

export function AddMemberModal({
  open,
  onClose,
  projectId,
  existingMembers,
}: AddMemberModalProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<ProjectMemberRole>("member");

  const existingIds = new Set(existingMembers.map((m) => m.userId));

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["user-search", search],
    queryFn: () => teamApi.searchUsers(search),
    enabled: search.trim().length >= 2,
    staleTime: 10_000,
  });

  const users: User[] = searchData?.data?.data ?? [];
  const availableUsers = users.filter((u) => !existingIds.has(u.id));

  const addMutation = useMutation({
    mutationFn: () =>
      teamApi.addMember({ projectId, userId: selectedUser!.id, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast.success(`${selectedUser?.name} added to project!`);
      handleClose();
    },
    onError: () => {
      toast.error("Failed to add member. Please try again.");
    },
  });

  const handleClose = useCallback(() => {
    setSearch("");
    setSelectedUser(null);
    setRole("member");
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Project</DialogTitle>
          <DialogDescription>
            Search for a user and assign them a role in this project.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Search input */}
          <div>
            <Label htmlFor="member-search">Search Users</Label>
            <div className="relative mt-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                style={{ width: 14, height: 14 }}
              />
              <input
                id="member-search"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Type a name or email..."
                className="w-full pl-8 pr-4 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
              />
            </div>
          </div>

          {/* Search results */}
          {search.trim().length >= 2 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {isFetching && (
                <p className="text-xs text-[var(--text-muted)] py-2 text-center">
                  Searching...
                </p>
              )}
              {!isFetching && availableUsers.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] py-2 text-center">
                  No users found or all are already members.
                </p>
              )}
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-left transition-colors ${
                    selectedUser?.id === user.id
                      ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
                      : "hover:bg-[var(--bg-overlay)] border border-transparent"
                  }`}
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {user.email}
                    </p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check
                      className="text-[var(--color-primary)] shrink-0"
                      style={{ width: 14, height: 14 }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected user + role */}
          {selectedUser && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={selectedUser.name}
                  src={selectedUser.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>

              <div>
                <Label htmlFor="member-role">Role</Label>
                <Select
                  id="member-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => addMutation.mutate()}
            disabled={!selectedUser}
            loading={addMutation.isPending}
          >
            <UserPlus style={{ width: 14, height: 14 }} />
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}