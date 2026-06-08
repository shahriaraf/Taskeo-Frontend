"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, CheckSquare, Trash2, CheckCheck,
  Clock, Square, ChevronDown, X, ListChecks,
} from "lucide-react";
import { tasksApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";
import { Input, Select, Skeleton, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import type { Task } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Bulk Action Bar (Admin/PM only) ──────────────────────────────────────────
function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearAll,
  onBulkStatus,
  onBulkDelete,
  bulkLoading,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBulkStatus: (status: string) => void;
  onBulkDelete: () => void;
  bulkLoading: boolean;
}) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusOptions = [
    { value: "todo",        label: "To Do",       color: "text-slate-400"   },
    { value: "in_progress", label: "In Progress", color: "text-blue-400"    },
    { value: "completed",   label: "Completed",   color: "text-emerald-400" },
  ];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border transition-all duration-300",
        "bg-[var(--accent-blue-dim)] border-[var(--accent-blue)]/30",
        selectedCount > 0
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <ListChecks className="w-4 h-4 text-[var(--accent-blue)]" />
        <span className="text-sm font-semibold text-[var(--accent-blue)]">
          {selectedCount} selected
        </span>
      </div>

      <div className="w-px h-4 bg-[var(--border-default)]" />

      <div className="flex items-center gap-2">
        {selectedCount < totalCount && (
          <button
            onClick={onSelectAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            Select all {totalCount}
          </button>
        )}
        <button
          onClick={onClearAll}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-[var(--bg-surface)] border border-[var(--border-subtle)]
                       text-[var(--text-secondary)] hover:border-[var(--accent-blue)]
                       transition-all disabled:opacity-50"
          >
            <Clock className="w-3 h-3" />
            Set Status
            <ChevronDown className="w-3 h-3" />
          </button>

          {statusDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 rounded-[var(--radius-md)]
                              bg-[var(--bg-elevated)] border border-[var(--border-default)]
                              shadow-xl z-20 overflow-hidden">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onBulkStatus(opt.value); setStatusDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs
                               hover:bg-[var(--bg-surface)] transition-colors text-left"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full",
                      opt.value === "completed" ? "bg-emerald-400" :
                      opt.value === "in_progress" ? "bg-blue-400" : "bg-slate-400"
                    )} />
                    <span className={opt.color}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onBulkDelete}
          disabled={bulkLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-rose-500/10 border border-rose-500/20 text-rose-400
                     hover:bg-rose-500/20 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          Delete ({selectedCount})
        </button>
      </div>
    </div>
  );
}

// ─── Selectable Task Card Wrapper ─────────────────────────────────────────────
function SelectableTaskCard({
  task, selected, onToggle, onEdit, onDelete, onStatusChange, bulkMode,
}: {
  task: Task;
  selected: boolean;
  onToggle: () => void;
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
  onStatusChange: (t: Task, s: string) => void;
  bulkMode: boolean;
}) {
  return (
    <div className="relative group/selectable">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "absolute top-3 left-3 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          selected
            ? "bg-[var(--accent-blue)] border-[var(--accent-blue)]"
            : "bg-[var(--bg-elevated)] border-[var(--border-default)] opacity-0 group-hover/selectable:opacity-100",
          bulkMode && "opacity-100"
        )}
      >
        {selected && <CheckCheck className="w-3 h-3 text-white" />}
      </button>
      <div className={cn(
        "rounded-[var(--radius-lg)] transition-all",
        selected && "ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-base)]"
      )}>
        <TaskCard
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

// ─── Bulk Delete Confirm Modal ────────────────────────────────────────────────
function BulkDeleteConfirmModal({
  open, count, onConfirm, onClose, loading,
}: {
  open: boolean; count: number; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
          Delete {count} Task{count !== 1 ? "s" : ""}?
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          This will permanently delete {count} selected task{count !== 1 ? "s" : ""}. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            Delete {count} Task{count !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient();
  const { canCreateTask, canEditTask, canDeleteTask, canBulkEdit, canBulkDelete } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  // Bulk selection — only meaningful for roles that can act on it
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", search, statusFilter, priorityFilter, page],
    queryFn: () =>
      tasksApi.getAll({ search, status: statusFilter, priority: priorityFilter, page, limit: 20 }),
  });

  const tasks: Task[] = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setFormOpen(false); toast.success("Task created!"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setEditTask(null); toast.success("Task updated!"); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Status updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setDeleteTask(null); toast.success("Task deleted."); },
  });

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => tasksApi.updateStatus(id, status)));
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${selectedIds.size} task${selectedIds.size !== 1 ? "s" : ""} updated`);
      setSelectedIds(new Set());
    } catch { toast.error("Some tasks failed to update"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => tasksApi.remove(id)));
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${selectedIds.size} task${selectedIds.size !== 1 ? "s" : ""} deleted`);
      setSelectedIds(new Set()); setBulkDeleteOpen(false);
    } catch { toast.error("Some tasks failed to delete"); }
    finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const selectAll = () => setSelectedIds(new Set(tasks.map((t) => t.id)));
  const clearAll  = () => setSelectedIds(new Set());
  const bulkMode  = selectedIds.size > 0;

  // Bulk actions are only available to Admin/PM
  const showBulkControls = canBulkEdit || canBulkDelete;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Tasks"
        subtitle={meta ? `${meta.total} tasks total` : ""}
        action={
          canCreateTask
            ? {
                label: "New Task",
                onClick: () => setFormOpen(true),
                icon: <Plus style={{ width: 14, height: 14 }} />,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); clearAll(); }}
              icon={<Search style={{ width: 13, height: 13 }} />}
            />
          </div>
          <div className="w-36">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); clearAll(); }}>
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div className="w-36">
            <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); clearAll(); }}>
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>

          {/* Bulk select toggle — only shown to Admin/PM */}
          {showBulkControls && tasks.length > 0 && (
            <button
              onClick={bulkMode ? clearAll : selectAll}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                bulkMode
                  ? "bg-[var(--accent-blue-dim)] border-[var(--accent-blue)]/40 text-[var(--accent-blue)]"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--text-secondary)]"
              )}
            >
              {bulkMode ? <X className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {bulkMode ? `${selectedIds.size} selected` : "Select"}
            </button>
          )}
        </div>

        {/* Bulk Action Bar — Admin/PM only */}
        {showBulkControls && (
          <div className="mb-4">
            <BulkActionBar
              selectedCount={selectedIds.size}
              totalCount={tasks.length}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onBulkStatus={handleBulkStatus}
              onBulkDelete={() => setBulkDeleteOpen(true)}
              bulkLoading={bulkLoading}
            />
          </div>
        )}

        {/* Task grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-6 h-6" />}
            title={search ? "No tasks found" : "No tasks yet"}
            description={
              search
                ? "Try adjusting your search or filters."
                : canCreateTask
                ? "Create your first task."
                : "You have no assigned tasks yet."
            }
            action={
              !search && canCreateTask ? (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus style={{ width: 14, height: 14 }} /> Create Task
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task, i) => (
                <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  {showBulkControls ? (
                    <SelectableTaskCard
                      task={task}
                      selected={selectedIds.has(task.id)}
                      onToggle={() => toggleSelect(task.id)}
                      onEdit={canEditTask ? (t) => setEditTask(t) : undefined}
                      onDelete={canDeleteTask ? (t) => setDeleteTask(t) : undefined}
                      onStatusChange={(t, s) => statusMutation.mutate({ id: t.id, status: s })}
                      bulkMode={bulkMode}
                    />
                  ) : (
                    <TaskCard
                      task={task}
                      onStatusChange={(t, s) => statusMutation.mutate({ id: t.id, status: s })}
                    />
                  )}
                </div>
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="secondary" size="sm" disabled={page <= 1}
                  onClick={() => { setPage((p) => p - 1); clearAll(); }}>Previous</Button>
                <span className="text-xs text-[var(--text-muted)]">Page {page} of {meta.totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= meta.totalPages}
                  onClick={() => { setPage((p) => p + 1); clearAll(); }}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      {canCreateTask && (
        <TaskFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(d) => createMutation.mutateAsync(d)}
          loading={createMutation.isPending}
        />
      )}

      {canEditTask && (
        <TaskFormModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSubmit={(d) => updateMutation.mutateAsync({ id: editTask!.id, d })}
          initialData={editTask || undefined}
          loading={updateMutation.isPending}
        />
      )}

      {canDeleteTask && (
        <ConfirmDeleteModal
          open={!!deleteTask}
          onClose={() => setDeleteTask(null)}
          onConfirm={async () => { await deleteMutation.mutateAsync(deleteTask!.id); }}
          title="Delete Task"
          description={`Delete "${deleteTask?.title}"? This cannot be undone.`}
          loading={deleteMutation.isPending}
        />
      )}

      {canBulkDelete && (
        <BulkDeleteConfirmModal
          open={bulkDeleteOpen}
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onClose={() => setBulkDeleteOpen(false)}
          loading={bulkLoading}
        />
      )}
    </div>
  );
}