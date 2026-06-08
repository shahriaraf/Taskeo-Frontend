"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input, Label, Textarea, Select } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { teamApi, projectsApi } from "@/services/api";
import type { Task, User, Project } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(300),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid("Please select a project"),
  // ✅ Fix: transform empty string to undefined, then validate as UUID only if present
  assigneeId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["todo", "in_progress", "completed"]),
});

type FormData = z.infer<typeof schema>;

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => unknown;
  initialData?: Partial<Task>;
  defaultProjectId?: string;
  loading?: boolean;
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  defaultProjectId,
  loading,
}: TaskFormModalProps) {
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      projectId: defaultProjectId || "",
      assigneeId: "",
      dueDate: "",
      priority: "medium",
      status: "todo",
    },
  });

  const watchedProjectId = watch("projectId");

  // Load projects via React Query so cache is shared across the app
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.getAll({ limit: 100 }),
    enabled: open,
    staleTime: 30_000,
  });
  const projects: Project[] = Array.isArray(projectsData?.data?.data)
    ? (projectsData!.data!.data as unknown as Project[])
    : [];

  // Load members via React Query — uses the same query key that add-member-modal
  // invalidates after a successful add, so this list refreshes automatically.
  const { data: membersData } = useQuery({
    queryKey: ["project-members", watchedProjectId],
    queryFn: () => teamApi.getMembers(watchedProjectId!),
    enabled: !!watchedProjectId,
    staleTime: 0, // always fresh — member list changes often
  });
  const members: Array<{ user: Pick<User, "id" | "name" | "avatarUrl"> }> =
    Array.isArray(membersData?.data?.data)
      ? (membersData!.data!.data as unknown as Array<{ user: Pick<User, "id" | "name" | "avatarUrl"> }>)
      : [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        projectId: initialData.projectId || defaultProjectId || "",
        assigneeId: initialData.assigneeId || "",
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        priority: initialData.priority || "medium",
        status: initialData.status || "todo",
      });
    } else if (open) {
      reset({
        title: "",
        description: "",
        projectId: defaultProjectId || "",
        assigneeId: "",
        dueDate: "",
        priority: "medium",
        status: "todo",
      });
    }
  }, [open, initialData, defaultProjectId, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-4 space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Design landing page"
                {...register("title")}
                error={errors.title?.message}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what needs to be done..."
                {...register("description")}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  id="projectId"
                  {...register("projectId")}
                  error={errors.projectId?.message}
                  // ✅ Disable project select in edit mode
                  disabled={isEdit}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="assigneeId">Assign To</Label>
                <Select id="assigneeId" {...register("assigneeId")}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                  error={errors.dueDate?.message}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" {...register("priority")}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" {...register("status")}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}