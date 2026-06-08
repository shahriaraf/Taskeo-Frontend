"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Grid3x3, List, FolderKanban } from "lucide-react";
import { projectsApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal";
import { Input, Select, Skeleton, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import type { Project } from "@/types";
import toast from "react-hot-toast";

type View = "grid" | "list";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { canCreateProject, canEditProject, canDeleteProject } = usePermissions();

  const [view, setView] = useState<View>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, statusFilter, page],
    queryFn: () =>
      projectsApi.getAll({ search, status: statusFilter, page, limit: 12 }),
  });

  const projects = (data?.data?.data as Project[] | undefined) ?? [];
  const meta = data?.data?.meta;

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setFormOpen(false);
      toast.success("Project created!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof projectsApi.update>[1] }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setEditProject(null);
      toast.success("Project updated!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteProject(null);
      toast.success("Project deleted.");
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Projects"
        subtitle={meta ? `${meta.total} projects total` : ""}
        // Only show the "New Project" button for roles that can create
        action={
          canCreateProject
            ? {
                label: "New Project",
                onClick: () => setFormOpen(true),
                icon: <Plus style={{ width: 14, height: 14 }} />,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search style={{ width: 13, height: 13 }} />}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </Select>
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded transition-colors ${view === "grid" ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              <Grid3x3 style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded transition-colors ${view === "list" ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              <List style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="w-6 h-6" />}
            title={search ? "No projects found" : "No projects yet"}
            description={
              search
                ? "Try adjusting your search."
                : canCreateProject
                ? "Create your first project to get started."
                : "You haven't been added to any projects yet."
            }
            action={
              !search && canCreateProject ? (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus style={{ width: 14, height: 14 }} /> Create Project
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {projects.map((project, i) => (
                <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <ProjectCard
                    project={project}
                    onEdit={canEditProject ? (p) => setEditProject(p) : undefined}
                    onDelete={canDeleteProject ? (p) => setDeleteProject(p) : undefined}
                  />
                </div>
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-xs text-[var(--text-muted)]">
                  Page {page} of {meta.totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {canCreateProject && (
        <ProjectFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(d) => createMutation.mutateAsync(d)}
          loading={createMutation.isPending}
        />
      )}

      {canEditProject && (
        <ProjectFormModal
          open={!!editProject}
          onClose={() => setEditProject(null)}
          onSubmit={(d) => updateMutation.mutateAsync({ id: editProject!.id, data: d })}
          initialData={editProject || undefined}
          loading={updateMutation.isPending}
        />
      )}

      {canDeleteProject && (
        <ConfirmDeleteModal
          open={!!deleteProject}
          onClose={() => setDeleteProject(null)}
          onConfirm={async () => { await deleteMutation.mutateAsync(deleteProject!.id); }}
          title="Delete Project"
          description={`Are you sure you want to delete "${deleteProject?.name}"? This will also delete all tasks and cannot be undone.`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}