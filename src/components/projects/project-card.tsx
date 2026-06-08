"use client";
import React from "react";
import Link from "next/link";
import { Calendar, CheckSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Progress, Avatar } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { canEditProject, canDeleteProject } = usePermissions();

  const totalTasks = project._count.tasks;
  const completedTasks =
    project.tasks?.filter((t) => t.status === "completed").length ?? 0;
  const completionPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const statusColor = getStatusColor(project.status);

  // Whether to show the dropdown at all
  const showMenu = canEditProject || canDeleteProject;

  return (
    <div className="group rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden">
      {/* Status strip */}
      <div
        className={cn(
          "h-0.5",
          project.status === "completed"
            ? "bg-emerald-500"
            : project.status === "on_hold"
            ? "bg-amber-500"
            : "bg-[var(--accent-blue)]"
        )}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusColor)}>
                {getStatusLabel(project.status)}
              </span>
              {project.isOverdue && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Overdue
                </span>
              )}
            </div>
            <Link href={`/projects/${project.id}`}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors truncate">
                {project.name}
              </h3>
            </Link>
          </div>

          {/* Only render the dropdown if the role can do something */}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all">
                  <MoreHorizontal style={{ width: 14, height: 14 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditProject && (
                  <DropdownMenuItem onClick={() => onEdit?.(project)}>
                    <Pencil style={{ width: 14, height: 14 }} />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {canEditProject && canDeleteProject && <DropdownMenuSeparator />}
                {canDeleteProject && (
                  <DropdownMenuItem danger onClick={() => onDelete?.(project)}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                    Delete Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {project.description && (
          <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-muted)]">Progress</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{completionPct}%</span>
          </div>
          <Progress
            value={completionPct}
            color={completionPct >= 100 ? "emerald" : completionPct >= 50 ? "blue" : "amber"}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <CheckSquare style={{ width: 12, height: 12 }} />
              <span className="text-xs">{project._count.tasks} tasks</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <Calendar style={{ width: 12, height: 12 }} />
              <span className="text-xs">{formatDate(project.deadline)}</span>
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                name={m.user.name}
                src={m.user.avatarUrl}
                size="sm"
                className="ring-2 ring-[var(--bg-surface)]"
              />
            ))}
            {project.members.length > 4 && (
              <div className="h-7 w-7 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--bg-surface)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                +{project.members.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}