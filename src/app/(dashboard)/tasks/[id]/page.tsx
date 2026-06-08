"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Calendar, User, Flag, Clock,
  MessageSquare, Send, Pencil, Trash2,
} from "lucide-react";
import { tasksApi, commentsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { Header } from "@/components/layout/header";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import {
  Avatar, Badge, Skeleton, Separator, Textarea,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  cn, formatDate, getPriorityColor,
  getStatusColor, getStatusLabel, timeAgo,
} from "@/lib/utils";
import type { Comment } from "@/types";
import toast from "react-hot-toast";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { canEditTask, canDeleteTask } = usePermissions();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.getOne(id),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => commentsApi.getByTask(id, { limit: 50 }),
  });

  const task = taskData?.data?.data;
  const comments: Comment[] = commentsData?.data?.data?.comments ?? [];

  const updateMutation = useMutation({
    mutationFn: (d: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task", id] }); setEditOpen(false); toast.success("Task updated!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => { toast.success("Task deleted."); router.back(); },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => tasksApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task", id] }); toast.success("Status updated"); },
  });

  const addCommentMutation = useMutation({
    mutationFn: () => commentsApi.create({ taskId: id, content: comment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", id] }); setComment(""); },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ cid, content }: { cid: string; content: string }) =>
      commentsApi.update(cid, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", id] }); setEditCommentId(null); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (cid: string) => commentsApi.remove(cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", id] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Loading…" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const statusOptions = [
    { value: "todo",        label: "To Do"       },
    { value: "in_progress", label: "In Progress" },
    { value: "completed",   label: "Completed"   },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={task.title}
        subtitle={`in ${task.project.name}`}
        // Only Admin/PM see the "Edit Task" button in the header
        action={
          canEditTask
            ? {
                label: "Edit Task",
                onClick: () => setEditOpen(true),
                icon: <Pencil style={{ width: 14, height: 14 }} />,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title + badges */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border capitalize", getPriorityColor(task.priority))}>
                  {task.priority} priority
                </span>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", getStatusColor(task.status))}>
                  {getStatusLabel(task.status)}
                </span>
                {task.isOverdue && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Overdue
                  </span>
                )}
              </div>

              <h1 className="text-lg font-bold text-[var(--text-primary)] mb-3">{task.title}</h1>

              {task.description ? (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">No description provided.</p>
              )}
            </div>

            {/* Status change — all roles can change status on tasks they have access to */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Change Status
              </p>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => statusMutation.mutate(s.value)}
                    disabled={task.status === s.value || statusMutation.isPending}
                    className={cn(
                      "px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all border",
                      task.status === s.value
                        ? getStatusColor(s.value)
                        : "text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments — all roles can comment */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare style={{ width: 15, height: 15 }} className="text-[var(--text-muted)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Comments <span className="text-[var(--text-muted)] font-normal">({comments.length})</span>
                </p>
              </div>

              {/* Add comment */}
              <div className="flex gap-3 mb-5">
                {user && <Avatar name={user.name} src={user.avatarUrl} size="sm" className="flex-shrink-0 mt-1" />}
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[70px] text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={() => addCommentMutation.mutate()}
                      disabled={!comment.trim()}
                      loading={addCommentMutation.isPending}
                    >
                      <Send style={{ width: 13, height: 13 }} />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Comment list */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => {
                    // User can edit/delete their own comments; Admin can edit/delete any
                    const isOwner = c.userId === user?.id;
                    const canModifyComment = isOwner || user?.role === "admin";

                    return (
                      <div key={c.id} className="flex gap-3 group">
                        <Avatar name={c.user.name} src={c.user.avatarUrl} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{c.user.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(c.createdAt)}</span>
                            {canModifyComment && (
                              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditCommentId(c.id); setEditCommentContent(c.content); }}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                  <Pencil style={{ width: 11, height: 11 }} />
                                </button>
                                <button
                                  onClick={() => deleteCommentMutation.mutate(c.id)}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 style={{ width: 11, height: 11 }} />
                                </button>
                              </div>
                            )}
                          </div>
                          {editCommentId === c.id ? (
                            <div>
                              <Textarea
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                className="text-sm min-h-[60px]"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => editCommentMutation.mutate({ cid: c.id, content: editCommentContent })}
                                  loading={editCommentMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setEditCommentId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attachments */}
            <TaskAttachments taskId={id} />
          </div>

          {/* Sidebar meta */}
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Details</p>

              {[
                {
                  icon: <User style={{ width: 13, height: 13 }} />,
                  label: "Assignee",
                  value: task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
                      <span className="text-xs text-[var(--text-primary)]">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Unassigned</span>
                  ),
                },
                {
                  icon: <Calendar style={{ width: 13, height: 13 }} />,
                  label: "Due Date",
                  value: (
                    <span className={cn("text-xs", task.isOverdue ? "text-rose-400" : "text-[var(--text-primary)]")}>
                      {formatDate(task.dueDate)}
                    </span>
                  ),
                },
                {
                  icon: <Flag style={{ width: 13, height: 13 }} />,
                  label: "Priority",
                  value: (
                    <span className={cn("text-xs font-medium capitalize", getPriorityColor(task.priority).split(" ")[0])}>
                      {task.priority}
                    </span>
                  ),
                },
                {
                  icon: <Clock style={{ width: 13, height: 13 }} />,
                  label: "Created",
                  value: <span className="text-xs text-[var(--text-secondary)]">{formatDate(task.createdAt)}</span>,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
                    {item.icon}
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                  </div>
                  {item.value}
                  <div className="mt-3 h-px bg-[var(--border-subtle)]" />
                </div>
              ))}
            </div>

            {/* Project link */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Project</p>
              <button
                onClick={() => router.push(`/projects/${task.project.id}`)}
                className="text-sm font-medium text-[var(--accent-blue)] hover:underline"
              >
                {task.project.name}
              </button>
            </div>

            {/* Actions — only visible to Admin/PM */}
            {(canEditTask || canDeleteTask) && (
              <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Actions</p>
                <div className="space-y-2">
                  {canEditTask && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil style={{ width: 13, height: 13 }} /> Edit Task
                    </Button>
                  )}
                  {canDeleteTask && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} /> Delete Task
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canEditTask && (
        <TaskFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={(d) => updateMutation.mutateAsync(d)}
          initialData={task}
          loading={updateMutation.isPending}
        />
      )}

      {canDeleteTask && (
        <ConfirmDeleteModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutateAsync()}
          title="Delete Task"
          description={`Delete "${task.title}"? This cannot be undone.`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}