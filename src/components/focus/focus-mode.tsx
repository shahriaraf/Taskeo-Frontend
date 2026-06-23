"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { tasksApi } from "@/services/api";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import {
  Play, Pause, RotateCcw, SkipForward, X, CheckCircle2,
  Clock, Target, Zap, ChevronDown,
} from "lucide-react";
import type { Task } from "@/types";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────────────────────
const MODES = {
  focus:       { label: "Focus",        duration: 25 * 60, color: "#4f8ef7" },
  short_break: { label: "Short break",  duration:  5 * 60, color: "#34d399" },
  long_break:  { label: "Long break",   duration: 15 * 60, color: "#8b5cf6" },
} as const;
type Mode = keyof typeof MODES;

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Task picker ───────────────────────────────────────────────────────────────
function TaskPicker({ onSelect }: { onSelect: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

const { data } = useQuery({
  queryKey: ["focus-tasks"],
  queryFn: async () => {
    const res = await tasksApi.getAll({ limit: 100 });
    const all = (res.data as any)?.data ?? res.data ?? [];
    return Array.isArray(all)
      ? all.filter((t: Task) => t.status === "todo" || t.status === "in_progress")
      : [];
  },
});


  const tasks: Task[] = Array.isArray(data) ? data : [];
  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-sm text-[var(--text-secondary)] transition-all w-full max-w-sm">
        <Target className="w-4 h-4 flex-shrink-0 text-[var(--accent-blue)]" />
        <span className="truncate flex-1 text-left">Choose a task to focus on…</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 max-w-sm z-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[var(--border-subtle)]">
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none px-2 py-1" />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">No tasks found</p>
            ) : filtered.map((t) => (
              <button key={t.id} onClick={() => { onSelect(t); setOpen(false); setSearch(""); }}
                className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-[var(--bg-elevated)] text-left transition-colors">
                <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                  t.priority === "high" ? "bg-[#f87171]" : t.priority === "medium" ? "bg-[#fbbf24]" : "bg-[#34d399]")} />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{t.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.project.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timer ring ────────────────────────────────────────────────────────────────
function TimerRing({ progress, color, children }: { progress: number; color: string; children: React.ReactNode }) {
  const r = 110, circ = 2 * Math.PI * r;
  const dash = (1 - progress) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="260" height="260" className="-rotate-90">
        <circle cx="130" cy="130" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
        <circle cx="130" cy="130" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${circ - dash} ${dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FocusPage() {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0); // total time on current task
  const [statusUpdate, setStatusUpdate] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = MODES[mode];

  // ── Timer tick ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    setTimeLeft((t) => {
      if (t <= 1) {
        setRunning(false);
        if (mode === "focus") {
          setCompletedPomodoros((p) => p + 1);
          setShowStatusModal(true);
          // Update document title
          document.title = "Taskeo — Break time!";
        } else {
          document.title = "Taskeo — Focus";
          setMode("focus");
          setTimeLeft(MODES.focus.duration);
        }
        return 0;
      }
      return t - 1;
    });
    if (mode === "focus") setSessionSeconds((s) => s + 1);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  // Update document title while running
  useEffect(() => {
    if (running) {
      document.title = `${fmt(timeLeft)} — ${cfg.label} · Taskeo`;
    } else {
      document.title = "Taskeo";
    }
  }, [timeLeft, running, cfg.label]);

  // ── Controls ────────────────────────────────────────────────────────────────
  const switchMode = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setTimeLeft(MODES[m].duration);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(cfg.duration);
  };

  const skip = () => {
    setRunning(false);
    if (mode === "focus") {
      setCompletedPomodoros((p) => p + 1);
      setShowStatusModal(true);
    } else {
      switchMode("focus");
    }
  };

  // ── Mark complete mutation ──────────────────────────────────────────────────
  const markComplete = useMutation({
    mutationFn: (taskId: string) =>
      tasksApi.update(taskId, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focus-tasks"] });
      toast.success("Task marked complete!");
      setFocusedTask(null);
      setSessionSeconds(0);
      setShowStatusModal(false);
    },
  });

  const progress = (cfg.duration - timeLeft) / cfg.duration;

  return (
    <div className="flex flex-col h-full">
      <Header title="Focus mode" subtitle="Deep work with Pomodoro timer — one task at a time" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 flex flex-col items-center gap-8">

          {/* Task selection */}
          <div className="w-full">
            {focusedTask ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--accent-blue-dim)] border border-[rgba(79,142,247,0.25)]">
                <Target className="w-4 h-4 text-[var(--accent-blue)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{focusedTask.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{focusedTask.project.name} · {focusedTask.priority} priority</p>
                </div>
                <button onClick={() => { setFocusedTask(null); setRunning(false); setSessionSeconds(0); }}
                  className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                  <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <TaskPicker onSelect={(t) => { setFocusedTask(t); setRunning(false); setSessionSeconds(0); }} />
            )}
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] w-full">
            {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, val]) => (
              <button key={key} onClick={() => switchMode(key)}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                  mode === key
                    ? "text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
                style={mode === key ? { background: val.color + "22", color: val.color } : undefined}>
                {val.label}
              </button>
            ))}
          </div>

          {/* Timer */}
          <TimerRing progress={progress} color={cfg.color}>
            <span className="text-5xl font-bold tabular-nums" style={{ color: cfg.color }}>
              {fmt(timeLeft)}
            </span>
            <span className="text-xs text-[var(--text-muted)] mt-1">{cfg.label}</span>
          </TimerRing>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={reset}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setRunning((r) => !r)}
              className="px-8 py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95"
              style={{ background: cfg.color }}>
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={skip}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="rounded-xl p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{completedPomodoros}</p>
              <p className="text-xs text-[var(--text-muted)]">Pomodoros</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{Math.floor(sessionSeconds / 60)}m</p>
              <p className="text-xs text-[var(--text-muted)]">On task</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{completedPomodoros * 25}m</p>
              <p className="text-xs text-[var(--text-muted)]">Deep work</p>
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
            Work for 25 min, then take a 5 min break. After 4 pomodoros, take a 15 min break.
          </p>
        </div>
      </div>

      {/* Session end modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl p-6 border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#fbbf24]" />
              <h2 className="font-bold text-[var(--text-primary)]">Pomodoro complete!</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {completedPomodoros} pomodoro{completedPomodoros !== 1 ? "s" : ""} done.{" "}
              {focusedTask ? `How did "${focusedTask.title}" go?` : "Great work!"}
            </p>

            {focusedTask && (
              <div className="space-y-3 mb-4">
                <textarea
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  placeholder="Quick note about your progress (optional)…"
                  rows={2}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)] resize-none transition-colors"
                />
                <button
                  onClick={() => markComplete.mutate(focusedTask.id)}
                  disabled={markComplete.isPending}
                  className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "#34d399" }}>
                  <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                  Mark task complete
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setShowStatusModal(false); switchMode("short_break"); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors">
                Short break (5m)
              </button>
              {completedPomodoros % 4 === 0 && (
                <button onClick={() => { setShowStatusModal(false); switchMode("long_break"); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "#8b5cf6" }}>
                  Long break (15m)
                </button>
              )}
              <button onClick={() => { setShowStatusModal(false); switchMode("focus"); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: "#4f8ef7" }}>
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
