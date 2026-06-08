import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "MMM dd, yyyy 'at' h:mm a");
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDeadline(date: string | Date) {
  const d = new Date(date);
  if (isPast(d)) return `Overdue by ${formatDistanceToNow(d)}`;
  if (isToday(d)) return "Due today";
  if (isTomorrow(d)) return "Due tomorrow";
  return `Due ${formatDistanceToNow(d, { addSuffix: true })}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "low": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "in_progress": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "todo": return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    case "active": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "on_hold": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}

export function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPriorityWeight(priority: string): number {
  switch (priority) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 0;
  }
}
