import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98]",
        secondary:
          "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)] active:scale-[0.98]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-[0.98]",
        danger:
          "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-[0.98]",
        success:
          "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]",
        link: "text-[var(--accent-blue)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-xs",
        default: "h-9 rounded-[var(--radius-md)] px-4 text-sm",
        lg: "h-11 rounded-[var(--radius-md)] px-6 text-sm",
        icon: "h-9 w-9 rounded-[var(--radius-md)]",
        "icon-sm": "h-7 w-7 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {children}
          </>
        ) : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
