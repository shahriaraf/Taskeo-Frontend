// src/components/shared/global-search.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, FolderKanban, CheckSquare, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchApi } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut: Cmd/Ctrl + K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      searchApi.search(debouncedQuery).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const hasResults =
    data && (data.tasks.length > 0 || data.projects.length > 0);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setOpen(false);
      setQuery("");
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)]",
          "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
          "text-[var(--text-muted)] text-sm transition-colors",
          "hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
          "w-48 md:w-64"
        )}
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden md:inline-flex items-center gap-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-2xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)] flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, projects…"
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {query.length < 2 && (
              <p className="px-4 py-3 text-xs text-[var(--text-muted)]">
                Type at least 2 characters to search
              </p>
            )}

            {query.length >= 2 && !isLoading && !hasResults && (
              <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {/* Projects */}
            {data?.projects.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Projects
                </p>
                {data.projects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-elevated)] text-left transition-colors"
                  >
                    <FolderKanban className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0",
                        p.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      )}
                    >
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Tasks */}
            {data?.tasks.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Tasks
                </p>
                {data.tasks.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-elevated)] text-left transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-[var(--accent-violet)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {t.project.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0",
                        t.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : t.status === "in_progress"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      )}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
