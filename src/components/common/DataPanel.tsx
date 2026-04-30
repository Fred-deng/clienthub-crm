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
    <div className={cn("bg-card rounded-[32px] border-2 border-foreground/5 overflow-hidden", className)}>
      {(title || actions) && (
        <div className="px-7 py-5 border-b-2 border-foreground/5 flex items-center justify-between gap-3 flex-wrap">
          {typeof title === "string" ? (
            <h3 className="font-display font-bold text-2xl tracking-tight">{title}</h3>
          ) : title}
          {actions}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}
