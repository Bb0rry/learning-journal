import * as React from "react";
import { cn } from "../../lib/utils";

export const inputClass =
  "focus-ring h-11 w-full rounded-lg border border-slate-200 bg-white/80 px-3 text-sm text-slate-950 placeholder:text-slate-400 transition dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClass, className)} {...props} />
);
Input.displayName = "Input";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-36 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-950 placeholder:text-slate-400 transition dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, className)} {...props} />;
}
