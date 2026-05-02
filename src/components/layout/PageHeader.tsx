import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-5 md:mb-8 pt-5 md:pt-8 relative">
      <div className="min-w-0">
        {meta && (
          <div className="flex items-center gap-2.5 mb-2.5 md:mb-3.5">
            <span className="size-1.5 rounded-full bg-tomato" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/50 font-mono">
              {meta}
            </span>
            <span className="h-px w-8 bg-foreground/15" />
          </div>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="font-display font-black text-[28px] md:text-4xl lg:text-[44px] text-foreground -tracking-[0.02em] leading-[1]">
            {title}
          </h1>
          <span className="font-display italic text-foreground/30 text-base hidden sm:inline">
            ／ Overview
          </span>
        </div>
        {subtitle && (
          <p className="text-[12px] md:text-[13px] text-foreground/55 mt-2 md:mt-3 max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap md:shrink-0 -mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto md:overflow-visible">{actions}</div>}
    </div>
  );
}
