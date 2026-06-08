"use client";
import Link from "next/link";
import {
  Calendar, MessageSquare, Paperclip, MoreHorizontal,
  Pencil, Trash2, ArrowRight,
} from "lucide-react";
import {
  cn, formatDate, getPriorityColor, getStatusColor, getStatusLabel,
} from "@/lib/utils";
import { Avatar } from "@/components/ui";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, status: string) => void;
}

const statusFlow = [
  { value: "todo",        label: "To Do"       },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed"   },
];

function getProgressFromStatus(status: string): number {
  switch (status) {
    case "todo":        return 0;
    case "in_progress": return 50;
    case "completed":   return 100;
    default:            return 0;
  }
}

function getProgressConfig(status: string) {
  if (status === "completed") return { barColor: "bg-emerald-500", trackColor: "bg-emerald-500/10", label: "Completed",   labelColor: "text-emerald-400" };
  if (status === "in_progress") return { barColor: "bg-blue-500",  trackColor: "bg-blue-500/10",   label: "In Progress", labelColor: "text-blue-400"    };
  return { barColor: "bg-slate-500", trackColor: "bg-slate-500/10", label: "Not started", labelColor: "text-[var(--text-muted)]" };
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { canEditTask, canDeleteTask } = usePermissions();

  const priorityColor = getPriorityColor(task.priority);
  const statusColor   = getStatusColor(task.status);
  const progress      = getProgressFromStatus(task.status);
  const progressCfg   = getProgressConfig(task.status);

  const availableStatuses = statusFlow.filter((s) => s.value !== task.status);

  // Show dropdown only if there's at least one action available
  const hasStatusActions = onStatusChange && availableStatuses.length > 0;
  const showMenu = hasStatusActions || canEditTask || canDeleteTask;

  return (
    <div className="group rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-200 hover:shadow-md p-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize", priorityColor)}>
            {task.priority}
          </span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusColor)}>
            {getStatusLabel(task.status)}
          </span>
          {task.isOverdue && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Overdue
            </span>
          )}
        </div>

        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all flex-shrink-0">
                <MoreHorizontal style={{ width: 14, height: 14 }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Status options — available to all roles */}
              {hasStatusActions && (
                <>
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  {availableStatuses.map((s) => (
                    <DropdownMenuItem key={s.value} onClick={() => onStatusChange?.(task, s.value)}>
                      <ArrowRight style={{ width: 14, height: 14 }} />
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Edit/Delete — Admin and PM only */}
              {(canEditTask || canDeleteTask) && hasStatusActions && <DropdownMenuSeparator />}
              {canEditTask && (
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Pencil style={{ width: 14, height: 14 }} />
                  Edit Task
                </DropdownMenuItem>
              )}
              {canDeleteTask && (
                <DropdownMenuItem danger onClick={() => onDelete?.(task)}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                  Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title */}
      <Link href={`/tasks/${task.id}`}>
        <h3 className={cn(
          "text-sm font-medium hover:text-[var(--accent-blue)] transition-colors mb-1 leading-snug line-clamp-2",
          task.status === "completed"
            ? "line-through text-[var(--text-muted)]"
            : "text-[var(--text-primary)]"
        )}>
          {task.title}
        </h3>
      </Link>

      {task.description && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Project tag */}
      <Link href={`/projects/${task.project.id}`}>
        <span className="inline-flex items-center text-[10px] font-medium text-[var(--accent-blue)] bg-[var(--accent-blue-dim)] px-2 py-0.5 rounded mb-3 hover:bg-blue-500/20 transition-colors">
          {task.project.name}
        </span>
      </Link>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[var(--text-muted)]">Progress</span>
          <span className={cn("text-[10px] font-semibold", progressCfg.labelColor)}>{progress}%</span>
        </div>
        <div className={cn("w-full h-1.5 rounded-full overflow-hidden", progressCfg.trackColor)}>
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", progressCfg.barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={cn("text-[9px] mt-0.5", progressCfg.labelColor)}>{progressCfg.label}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <Calendar style={{ width: 11, height: 11 }} />
            <span className={cn("text-[11px]", task.isOverdue ? "text-rose-400 font-medium" : "")}>
              {formatDate(task.dueDate)}
            </span>
          </div>
          {task._count?.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare style={{ width: 11, height: 11 }} />
              <span className="text-[11px]">{task._count.comments}</span>
            </div>
          )}
          {task._count?.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip style={{ width: 11, height: 11 }} />
              <span className="text-[11px]">{task._count.attachments}</span>
            </div>
          )}
        </div>
        {task.assignee && (
          <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
        )}
      </div>
    </div>
  );
}