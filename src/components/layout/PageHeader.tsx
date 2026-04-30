import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 pt-8 flex-wrap relative">
      <div className="min-w-0">
        {meta && (
          <div className="flex items-center gap-2.5 mb-4">
            <span className="size-1.5 rounded-full bg-tomato animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/55 font-mono">
              {meta}
            </span>
            <span className="h-px w-10 bg-foreground/20" />
          </div>
        )}
        <div className="flex items-end gap-4">
          <h1 className="font-display font-black text-5xl lg:text-[56px] text-foreground -tracking-[0.025em] leading-[0.95]">
            {title}
          </h1>
          <span className="font-display italic text-foreground/30 text-lg pb-2 hidden sm:inline">
            ／ Overview
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-1.5 w-16 bg-mint rounded-full" />
          <div className="h-1.5 w-6 bg-mustard rounded-full" />
          <div className="h-1.5 w-2 bg-tomato rounded-full" />
        </div>
        {subtitle && (
          <p className="text-sm text-foreground/55 mt-4 max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
