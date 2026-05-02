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
        "bg-card rounded-2xl border border-foreground/[0.07] overflow-hidden",
        "shadow-[0_1px_2px_0_hsl(var(--ink)/0.03)] hover:shadow-[0_4px_18px_-10px_hsl(var(--ink)/0.1)] transition-shadow",
        className,
      )}
    >
      {(title || actions) && (
        <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 flex items-start md:items-center justify-between gap-3 flex-wrap border-b border-foreground/[0.05]">
          <div className="flex items-center gap-2.5 min-w-0">
            {accent && (
              <span className={cn("size-2 rounded-full shrink-0", accentMap[accent])} />
            )}
            <div className="min-w-0">
              {typeof title === "string" ? (
                <h3 className="font-display font-bold text-[15px] md:text-[17px] tracking-tight leading-none">{title}</h3>
              ) : title}
              {subtitle && (
                <p className="text-[10px] text-foreground/45 mt-1.5 font-mono uppercase tracking-[0.15em]">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="w-full md:w-auto flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}
