// src/components/tasks/subtask-list.tsx
"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, CheckCircle2, Circle, ChevronDown, ChevronRight,
  Trash2, Pencil, GripVertical,
} from "lucide-react";
import { cn, getPriorityColor, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { tasksApi } from "@/services/api";
import toast from "react-hot-toast";
import type { Task } from "@/types";

interface SubTaskListProps {
  parentTask: Task;
}

function SubTaskItem({
  subTask,
  onStatusToggle,
  onDelete,
  isDeleting,
}: {
  subTask: any;
  onStatusToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { canEditTask, canDeleteTask } = usePermissions();
  const isDone = subTask.status === "completed";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] group transition-colors">
      {/* Drag handle (visual only — connect dnd-kit for real drag) */}
      <GripVertical className="w-4 h-4 text-[var(--border-strong)] opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />

      {/* Status toggle */}
      <button
        onClick={() =>
          onStatusToggle(subTask.id, isDone ? "todo" : "completed")
        }
        className="flex-shrink-0 text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
        ) : (
          <Circle className="w-4.5 h-4.5" />
        )}
      </button>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-sm",
          isDone
            ? "line-through text-[var(--text-muted)]"
            : "text-[var(--text-primary)]"
        )}
      >
        {subTask.title}
      </span>

      {/* Priority dot */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          getPriorityDot(subTask.priority)
        )}
        title={subTask.priority}
      />

      {/* Due date */}
      {subTask.dueDate && (
        <span className="text-xs text-[var(--text-muted)] flex-shrink-0 hidden sm:block">
          {formatDate(subTask.dueDate)}
        </span>
      )}

      {/* Assignee avatar */}
      {subTask.assignee && (
        <Avatar
          name={subTask.assignee.name}
          src={subTask.assignee.avatarUrl}
          size="xs"
        />
      )}

      {/* Actions */}
      {canDeleteTask && (
        <button
          onClick={() => onDelete(subTask.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent-rose)] transition-all flex-shrink-0"
          aria-label="Delete sub-task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function getPriorityDot(priority: string) {
  if (priority === "high")   return "bg-[var(--accent-rose)]";
  if (priority === "medium") return "bg-[var(--accent-amber)]";
  return "bg-[var(--text-muted)]";
}

export function SubTaskList({ parentTask }: SubTaskListProps) {
  const qc = useQueryClient();
  const { canEditTask } = usePermissions();
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");

  // Fetch sub-tasks
  const { data: subTasks = [], isLoading } = useQuery({
    queryKey: ["subtasks", parentTask.id],
    queryFn: () =>
      tasksApi
        .getSubTasks(parentTask.id)
        .then((r) => r.data.data ?? []),
  });

  const completedCount = subTasks.filter(
    (s: any) => s.status === "completed"
  ).length;

  // Create sub-task mutation
  const createMutation = useMutation({
    mutationFn: (title: string) =>
      tasksApi.createSubTask(parentTask.id, {
        title,
        dueDate: newDue || parentTask.dueDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks", parentTask.id] });
      setNewTitle("");
      setNewDue("");
      setAdding(false);
      toast.success("Sub-task added");
    },
    onError: () => toast.error("Failed to add sub-task"),
  });

  // Toggle status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateSubTaskStatus(id, status as any),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["subtasks", parentTask.id] }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      tasksApi.deleteSubTask(parentTask.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks", parentTask.id] });
      toast.success("Sub-task removed");
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

  return (
    <div className="mt-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        )}
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Sub-tasks
        </span>
        {subTasks.length > 0 && (
          <span className="text-xs text-[var(--text-muted)] ml-1">
            {completedCount}/{subTasks.length}
          </span>
        )}
        {subTasks.length > 0 && (
          <div className="flex-1 ml-2 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${Math.round((completedCount / subTasks.length) * 100)}%`,
              }}
            />
          </div>
        )}
      </button>

      {expanded && (
        <div className="space-y-0.5">
          {isLoading && (
            <p className="text-xs text-[var(--text-muted)] px-3 py-2">
              Loading…
            </p>
          )}

          {subTasks.map((s: any) => (
            <SubTaskItem
              key={s.id}
              subTask={s}
              onStatusToggle={(id, status) =>
                statusMutation.mutate({ id, status })
              }
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}

          {/* Add sub-task form */}
          {adding ? (
            <form
              onSubmit={handleAddSubmit}
              className="flex items-center gap-2 px-3 py-2"
            >
              <Circle className="w-4 h-4 text-[var(--border-strong)] flex-shrink-0" />
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Sub-task title…"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b border-[var(--border-default)] pb-0.5"
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-[var(--text-secondary)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newTitle.trim()}
                className="text-xs px-2.5 py-1 bg-[var(--accent-blue)] text-white rounded-md disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </form>
          ) : (
            canEditTask && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors w-full"
              >
                <Plus className="w-3.5 h-3.5" />
                Add sub-task
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
