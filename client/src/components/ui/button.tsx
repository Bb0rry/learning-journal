import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "primary" && "bg-emerald-500 text-slate-950 shadow-glow hover:bg-emerald-400",
        variant === "secondary" && "glass text-slate-900 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800",
        variant === "ghost" && "text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-white/10",
        variant === "danger" && "bg-rose-500 text-white hover:bg-rose-400",
        className
      )}
      {...props}
    />
  );
}
