"use client";
import React, { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip, Upload, Trash2, Download, FileText,
  FileImage, FileSpreadsheet, FileArchive, File, X, AlertCircle,
} from "lucide-react";
import { attachmentsApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import type { Attachment } from "@/types";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null | undefined) {
  if (!mimeType) return <File className="w-4 h-4" />;
  if (mimeType.startsWith("image/"))          return <FileImage className="w-4 h-4 text-blue-400" />;
  if (mimeType === "application/pdf")          return <FileText className="w-4 h-4 text-rose-400" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
                                               return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  if (mimeType === "application/zip")          return <FileArchive className="w-4 h-4 text-amber-400" />;
  if (mimeType.includes("word"))               return <FileText className="w-4 h-4 text-blue-300" />;
  return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
}

function getFileLabel(mimeType: string | null | undefined): string {
  if (!mimeType) return "File";
  if (mimeType.startsWith("image/"))           return mimeType.split("/")[1].toUpperCase();
  if (mimeType === "application/pdf")          return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "Excel";
  if (mimeType.includes("wordprocessingml"))   return "Word";
  if (mimeType === "application/msword")       return "Word";
  if (mimeType === "application/zip")          return "ZIP";
  if (mimeType === "text/plain")               return "TXT";
  return "File";
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  uploading: boolean;
}

function UploadZone({ onFiles, uploading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const validate = (files: File[]): File[] => {
    return files.filter((f) => {
      if (!ALLOWED_MIME_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" — unsupported file type.`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`"${f.name}" exceeds the 10 MB limit.`);
        return false;
      }
      return true;
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const valid = validate(Array.from(e.dataTransfer.files));
      if (valid.length) onFiles(valid);
    },
    [onFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valid = validate(Array.from(e.target.files ?? []));
    if (valid.length) onFiles(valid);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)]
        border-2 border-dashed px-4 py-6 cursor-pointer transition-all duration-200
        ${dragging
          ? "border-[var(--accent-blue)] bg-blue-500/5"
          : "border-[var(--border-default)] hover:border-[var(--accent-blue)] hover:bg-blue-500/3"
        }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleChange}
        className="hidden"
      />
      <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center">
        {uploading
          ? <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
          : <Upload className="w-4 h-4 text-[var(--text-muted)]" />
        }
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {uploading ? "Uploading…" : "Drop files here or click to browse"}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          Images, PDF, Word, Excel, ZIP · Max 10 MB
        </p>
      </div>
    </div>
  );
}

// ─── Attachment Row ───────────────────────────────────────────────────────────

interface AttachmentRowProps {
  attachment: Attachment;
  canDelete: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function AttachmentRow({ attachment, canDelete, onDelete, deleting }: AttachmentRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] group hover:border-[var(--border-default)] transition-colors">
      {/* Icon + type badge */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center">
        {getFileIcon(attachment.mimeType)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate" title={attachment.filename}>
          {attachment.filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[var(--text-muted)]">
            {getFileLabel(attachment.mimeType)}
          </span>
          <span className="text-[var(--border-default)]">·</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {formatBytes(attachment.size)}
          </span>
          <span className="text-[var(--border-default)]">·</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {timeAgo(attachment.createdAt)}
          </span>
          <span className="text-[var(--border-default)]">·</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            by {attachment.uploader.name}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-blue-500/10 transition-colors"
          title="Download / View"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(attachment.id)}
            disabled={deleting}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TaskAttachmentsProps {
  taskId: string;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => attachmentsApi.getByTask(taskId),
    staleTime: 0,
  });

  const attachments: Attachment[] = Array.isArray(data?.data?.data)
    ? (data!.data!.data as unknown as Attachment[])
    : [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: (_, file) => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      qc.invalidateQueries({ queryKey: ["task", taskId] }); // refresh _count
      toast.success(`"${file.name}" uploaded!`);
    },
    onError: () => {
      // error toast handled by api interceptor
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Attachment deleted.");
      setDeletingId(null);
    },
  });

  const handleFiles = async (files: File[]) => {
    // Upload sequentially so toast messages are clear
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const canDelete = (attachment: Attachment) =>
    attachment.uploadedBy === user?.id ||
    user?.role === "admin" ||
    user?.role === "project_manager";

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Attachments{" "}
          <span className="text-[var(--text-muted)] font-normal">
            ({attachments.length})
          </span>
        </p>
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={handleFiles} uploading={uploadMutation.isPending} />

      {/* File list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-2">
          No attachments yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <AttachmentRow
              key={a.id}
              attachment={a}
              canDelete={canDelete(a)}
              onDelete={(id) => {
                setDeletingId(id);
                deleteMutation.mutate(id);
              }}
              deleting={deletingId === a.id && deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}