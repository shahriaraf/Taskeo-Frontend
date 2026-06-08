"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  description: z.string().max(1000).optional(),
  deadline: z.string().min(1, "Deadline is required"),
  status: z.enum(["active", "completed", "on_hold"]),
});

type FormData = z.infer<typeof schema>;

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => unknown;
  initialData?: Partial<Project>;
  loading?: boolean;
}

export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: ProjectFormModalProps) {
  const isEdit = !!initialData?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      deadline: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split("T")[0]
          : "",
        status: initialData.status || "active",
      });
    } else if (open) {
      reset({ name: "", description: "", deadline: "", status: "active" });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the project details below." : "Fill in the details to create a new project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="px-6 py-4 space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g. E-Commerce Platform"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the project goals and scope..."
                {...register("description")}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  {...register("deadline")}
                  error={errors.deadline?.message}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" {...register("status")} error={errors.status?.message}>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
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
              {isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
