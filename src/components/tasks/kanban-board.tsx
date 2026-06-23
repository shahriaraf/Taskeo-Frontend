// src/components/tasks/kanban-board.tsx
"use client";
import React, { useState, useOptimistic } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Circle, Clock, CheckCircle2, GripVertical,
  Calendar, MessageSquare, Paperclip, User,
} from "lucide-react";
import { cn, formatDate, getPriorityColor } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { tasksApi } from "@/services/api";
import toast from "react-hot-toast";
import type { Task, TaskStatus } from "@/types";

// ── Column config ─────────────────────────────────────
const COLUMNS: { id: TaskStatus; label: string; color: string; icon: React.ElementType }[] = [
  { id: "todo",        label: "To Do",       color: "border-slate-500",   icon: Circle       },
  { id: "in_progress", label: "In Progress", color: "border-blue-500",    icon: Clock        },
  { id: "completed",   label: "Completed",   color: "border-emerald-500", icon: CheckCircle2 },
];

// ── Draggable task card ───────────────────────────────
function KanbanCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3",
        "hover:border-[var(--border-default)] transition-colors cursor-pointer group",
        isDragging && "shadow-2xl"
      )}
    >
      {/* Drag handle + priority */}
      <div className="flex items-start justify-between mb-2">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            getPriorityColor(task.priority)
          )}
        >
          {task.priority}
        </span>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--border-strong)] opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1 p-1"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-3">
          <Calendar className="w-3 h-3" />
          <span className={task.isOverdue ? "text-[var(--accent-rose)]" : ""}>
            {formatDate(task.dueDate)}
          </span>
        </div>
      )}

      {/* Footer: assignee + counts */}
      <div className="flex items-center justify-between">
        {task.assignee ? (
          <Avatar
            name={task.assignee.name}
            src={task.assignee.avatarUrl}
            size="xs"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-[var(--border-strong)] flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          </div>
        )}
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare className="w-3 h-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Paperclip className="w-3 h-3" />
              {task._count.attachments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────
function KanbanColumn({
  column,
  tasks,
  activeId,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  activeId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const Icon = column.icon;

  return (
    <div className="flex flex-col flex-1 min-w-[240px] max-w-xs">
      {/* Column header */}
      <div className={cn("flex items-center gap-2 mb-3 pb-3 border-b-2", column.color)}>
        <Icon
          className={cn(
            "w-4 h-4",
            column.id === "completed"   && "text-emerald-400",
            column.id === "in_progress" && "text-blue-400",
            column.id === "todo"        && "text-[var(--text-muted)]"
          )}
        />
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {column.label}
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 min-h-[120px] rounded-[var(--radius-md)] p-1 transition-colors",
          isOver && "bg-[var(--accent-blue-dim)]"
        )}
      >
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            isDragging={activeId === task.id}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            <p className="text-xs text-[var(--text-muted)]">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Kanban board ─────────────────────────────────
interface KanbanBoardProps {
  tasks: Task[];
  queryKey: unknown[];  // the react-query key to invalidate on status change
}

export function KanbanBoard({ tasks, queryKey }: KanbanBoardProps) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Keep local tasks in sync when the prop changes (e.g. after refetch)
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: () => {
      // Revert optimistic update on failure
      setLocalTasks(tasks);
      toast.error("Failed to update task status");
    },
  });

  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);

    if (!over) return;

    const draggedTask = localTasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;

    if (!draggedTask || draggedTask.status === newStatus) return;

    // Optimistic update — update UI immediately before API call
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === draggedTask.id ? { ...t, status: newStatus } : t))
    );

    statusMutation.mutate({ id: draggedTask.id, status: newStatus });
    toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
  }

  const tasksByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = localTasks.filter((t) => t.status === col.id);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByStatus[col.id] ?? []}
            activeId={activeId}
          />
        ))}
      </div>

      {/* Ghost card that follows the cursor while dragging */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90 w-64">
            <KanbanCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
