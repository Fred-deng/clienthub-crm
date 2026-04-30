import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataPanelProps {
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  accent?: "tomato" | "mustard" | "mint" | "cobalt";
}

const accentMap: Record<string, string> = {
  tomato: "bg-tomato",
  mustard: "bg-mustard",
  mint: "bg-mint",
  cobalt: "bg-cobalt",
};

export function DataPanel({ title, subtitle, actions, children, className, bodyClassName, accent }: DataPanelProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-[28px] border border-foreground/8 overflow-hidden shadow-[0_1px_0_0_hsl(0_0%_0%/0.03)] hover:shadow-[0_4px_20px_-8px_hsl(0_0%_0%/0.08)] transition-shadow",
        className,
      )}
    >
      {(title || actions) && (
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {accent && (
              <span className={cn("h-6 w-1 rounded-full", accentMap[accent])} />
            )}
            <div className="min-w-0">
              {typeof title === "string" ? (
                <h3 className="font-display font-bold text-xl tracking-tight leading-none">{title}</h3>
              ) : title}
              {subtitle && (
                <p className="text-[11px] text-foreground/45 mt-1 font-mono uppercase tracking-wider">{subtitle}</p>
              )}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}
