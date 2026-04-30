import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataPanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DataPanel({ title, actions, children, className, bodyClassName }: DataPanelProps) {
  return (
    <div className={cn("bg-card border border-border", className)}>
      {(title || actions) && (
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2">
          {typeof title === "string" ? (
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">{title}</h3>
          ) : title}
          {actions}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}
