import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Input ────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-9 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] transition-colors",
          "focus:outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          icon ? "pl-9 pr-3" : "px-3",
          error && "border-rose-500/50 focus:border-rose-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[80px] rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] px-3 py-2.5 transition-colors resize-none",
        "focus:outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30",
        error && "border-rose-500/50",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(({ className, error, children, ...props }, ref) => (
  <div className="w-full">
    <select
      ref={ref}
      className={cn(
        "w-full h-9 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm px-3 transition-colors appearance-none cursor-pointer",
        "focus:outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30",
        error && "border-rose-500/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
  </div>
));
Select.displayName = "Select";

// ─── Label ────────────────────────────────────────────────────────────────────
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-xs font-medium text-[var(--text-secondary)] mb-1.5 block", className)}
    {...props}
  />
));
Label.displayName = "Label";

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    outline: "border-[var(--border-default)] text-[var(--text-secondary)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] transition-all duration-150",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────
export function Separator({ className }: { className?: string }) {
  return (
    <div className={cn("h-px bg-[var(--border-subtle)]", className)} />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const avatarSizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base", xl: "h-14 w-14 text-lg" };

const avatarColors = [
  "from-blue-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-1 ring-white/10", avatarSizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white ring-1 ring-white/10 flex-shrink-0",
        getAvatarColor(name),
        avatarSizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: "blue" | "emerald" | "amber" | "rose";
}

const progressColors = {
  blue: "bg-[var(--accent-blue)]",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function Progress({ value, max = 100, className, color = "blue" }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full h-1.5 rounded-full bg-[var(--bg-overlay)]", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", progressColors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Switch ───────────────────────────────────────────────────────────────────
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]",
        checked ? "bg-[var(--accent-blue)]" : "bg-[var(--bg-overlay)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-overlay)]" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] mb-4">
        {icon}
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{title}</p>
      {description && <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
