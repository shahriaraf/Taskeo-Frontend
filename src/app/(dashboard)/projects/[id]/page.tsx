"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Users, Calendar, CheckSquare,
} from "lucide-react";
import { projectsApi, tasksApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";
import {
  Card, CardHeader, CardTitle, CardContent,
  Avatar, Progress, Skeleton, EmptyState,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { AddMemberModal } from "@/components/projects/add-member-modal";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Task } from "@/types";
import toast from "react-hot-toast";

const KANBAN_COLS = [
  { id: "todo",        label: "To Do",       color: "border-slate-500/30"   },
  { id: "in_progress", label: "In Progress", color: "border-blue-500/30"    },
  { id: "completed",   label: "Completed",   color: "border-emerald-500/30" },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { canCreateTask, canEditTask, canDeleteTask, canManageMembers } = usePermissions();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<"kanban" | "list">("kanban");

  const { data: projData, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getOne(id),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () => tasksApi.getAll({ projectId: id, limit: 100 }),
  });

  const project = projData?.data?.data;
  const allTasks: Task[] = Array.isArray(tasksData?.data?.data)
    ? tasksData.data.data
    : [];

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", id] });
      setTaskFormOpen(false);
      toast.success("Task created!");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ tid, data }: { tid: string; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(tid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", id] });
      setEditTask(null);
      toast.success("Task updated!");
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ tid, status }: { tid: string; status: string }) =>
      tasksApi.updateStatus(tid, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", id] });
      toast.success("Status updated");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (tid: string) => tasksApi.remove(tid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", id] });
      setDeleteTask(null);
      toast.success("Task deleted.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Loading..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const pct = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={project.name}
        subtitle={`${allTasks.length} tasks · ${project.members.length} members`}
        // Only Admin/PM see the "Add Task" button in the header
        action={
          canCreateTask
            ? {
                label: "Add Task",
                onClick: () => setTaskFormOpen(true),
                icon: <Plus style={{ width: 14, height: 14 }} />,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Project overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", getStatusColor(project.status))}>
                      {getStatusLabel(project.status)}
                    </span>
                    {project.isOverdue && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-[var(--text-muted)] mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar style={{ width: 12, height: 12 }} />
                  <span>Deadline: <span className="text-[var(--text-primary)]">{formatDate(project.deadline)}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare style={{ width: 12, height: 12 }} />
                  <span><span className="text-[var(--text-primary)]">{completedTasks}</span> of {allTasks.length} tasks done</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--text-muted)]">Overall Progress</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{pct}%</span>
                </div>
                <Progress value={pct} color={pct >= 100 ? "emerald" : pct >= 50 ? "blue" : "amber"} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{project.members.length} members</span>
                  {canManageMembers && (
                    <button
                      onClick={() => setAddMemberOpen(true)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
                      title="Add member"
                    >
                      <Plus style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {project.members.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} src={m.user.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{m.user.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
              {project.members.length > 6 && (
                <p className="text-[10px] text-[var(--text-muted)] pt-1">+{project.members.length - 6} more</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-1">
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors capitalize",
                  activeView === v
                    ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban view */}
        {activeView === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KANBAN_COLS.map((col) => {
              const colTasks = allTasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className={cn("rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border p-3", col.color)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{col.label}</span>
                      <span className="text-xs bg-[var(--bg-overlay)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    {/* Only show the "+" add button in kanban columns for Admin/PM */}
                    {canCreateTask && (
                      <button
                        onClick={() => setTaskFormOpen(true)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
                      >
                        <Plus style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={canEditTask ? (t) => setEditTask(t) : undefined}
                        onDelete={canDeleteTask ? (t) => setDeleteTask(t) : undefined}
                        onStatusChange={(t, s) =>
                          statusChangeMutation.mutate({ tid: t.id, status: s })
                        }
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="py-8 text-center text-xs text-[var(--text-muted)]">No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {activeView === "list" && (
          <div className="space-y-2.5">
            {allTasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="w-5 h-5" />}
                title="No tasks yet"
                description={
                  canCreateTask
                    ? "Add your first task to this project."
                    : "No tasks have been assigned to this project yet."
                }
                action={
                  canCreateTask ? (
                    <Button onClick={() => setTaskFormOpen(true)}>
                      <Plus style={{ width: 14, height: 14 }} /> Add Task
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              allTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={canEditTask ? (t) => setEditTask(t) : undefined}
                  onDelete={canDeleteTask ? (t) => setDeleteTask(t) : undefined}
                  onStatusChange={(t, s) =>
                    statusChangeMutation.mutate({ tid: t.id, status: s })
                  }
                />
              ))
            )}
          </div>
        )}
      </div>

      {canManageMembers && (
        <AddMemberModal
          open={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          projectId={id}
          existingMembers={project.members}
        />
      )}

      {canCreateTask && (
        <TaskFormModal
          open={taskFormOpen}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={(d) =>
            createTaskMutation.mutateAsync({
              ...d,
              // ensure assigneeId is undefined instead of null to satisfy mutation typing
              assigneeId: d.assigneeId ?? undefined,
            })
          }
          defaultProjectId={id}
          loading={createTaskMutation.isPending}
        />
      )}

      {canEditTask && (
        <TaskFormModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSubmit={(d) =>
            updateTaskMutation.mutateAsync({
              tid: editTask!.id,
              data: {
                ...d,
                // ensure assigneeId is undefined instead of null to satisfy mutation typing
                assigneeId: d.assigneeId ?? undefined,
              },
            })
          }
          initialData={editTask || undefined}
          loading={updateTaskMutation.isPending}
        />
      )}

      {canDeleteTask && (
        <ConfirmDeleteModal
          open={!!deleteTask}
          onClose={() => setDeleteTask(null)}
          onConfirm={() => deleteTaskMutation.mutateAsync(deleteTask!.id)}
          title="Delete Task"
          description={`Delete "${deleteTask?.title}"? This cannot be undone.`}
          loading={deleteTaskMutation.isPending}
        />
      )}
    </div>
  );
}