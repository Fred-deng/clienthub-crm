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
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className="size-1.5 rounded-full bg-tomato" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/50 font-mono">
              {meta}
            </span>
            <span className="h-px w-8 bg-foreground/15" />
          </div>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="font-display font-black text-4xl lg:text-[44px] text-foreground -tracking-[0.02em] leading-[1]">
            {title}
          </h1>
          <span className="font-display italic text-foreground/30 text-base hidden sm:inline">
            ／ Overview
          </span>
        </div>
        {subtitle && (
          <p className="text-[13px] text-foreground/55 mt-3 max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
